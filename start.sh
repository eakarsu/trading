#!/bin/bash

# AI Trading Platform Start Script (PostgreSQL Version)

echo "🚀 Starting AI Trading Platform with PostgreSQL..."

# Function to check if a port is in use and kill processes
check_port() {
  local port=$1
  local service_name=$2
  if lsof -i :$port -t >/dev/null 2>&1; then
    echo "🔄 Port $port ($service_name) is already in use. Killing process..."
    # Get all PIDs using the port
    local pids=$(lsof -ti:$port)
    if [ ! -z "$pids" ]; then
      echo "   Killing PIDs: $pids"
      echo "$pids" | xargs kill -9 2>/dev/null || true
      sleep 2
      # Double check if port is still in use
      if lsof -i :$port -t >/dev/null 2>&1; then
        echo "   ⚠️  Port $port still in use, trying force kill..."
        lsof -ti:$port | xargs kill -KILL 2>/dev/null || true
        sleep 1
      fi
    fi
  fi
}

# Function to kill processes by name
kill_by_name() {
  local process_name=$1
  local pids=$(pgrep -f "$process_name" 2>/dev/null || true)
  if [ ! -z "$pids" ]; then
    echo "🔄 Killing $process_name processes: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

# Kill any processes using our ports and related processes
echo "🧹 Cleaning up existing processes..."
check_port 3000 "Frontend"
check_port 3001 "Backend" 
check_port 5002 "Python Data Server"
# Don't kill PostgreSQL - we want to keep it running
# Skip port 5432 (PostgreSQL) entirely

# Also kill any remaining Node.js processes that might be related
kill_by_name "node.*frontend"
kill_by_name "node.*backend"
kill_by_name "npm.*start"
kill_by_name "npm.*dev"
kill_by_name "yahoo_finance_server.py"
kill_by_name "python.*yahoo_finance_server"

# Wait a moment for cleanup
sleep 2

# Create PostgreSQL data directory if it doesn't exist
POSTGRES_DATA_DIR="./postgres-data"
if [ ! -d "$POSTGRES_DATA_DIR" ]; then
  echo "� Creating PostgreSQL data directory..."
  mkdir -p "$POSTGRES_DATA_DIR"
fi

# Function to check PostgreSQL connection
check_postgres() {
  local host=${1:-localhost}
  local port=${2:-5432}
  local user=${3:-trading_user}
  local db=${4:-ai_trading_platform}
  
  # Try to connect using psql if available
  if command -v psql >/dev/null 2>&1; then
    PGPASSWORD=trading_password psql -h "$host" -p "$port" -U "$user" -d "$db" -c "SELECT 1;" >/dev/null 2>&1
  else
    # Fallback to nc (netcat) for basic connectivity check
    nc -z "$host" "$port" 2>/dev/null
  fi
}

# Function to check if PostgreSQL service is running (without connecting to specific DB)
check_postgres_service() {
  local host=${1:-localhost}
  local port=${2:-5432}
  
  # Just check if PostgreSQL is listening on the port
  if command -v psql >/dev/null 2>&1; then
    psql -h "$host" -p "$port" -U postgres -c "SELECT 1;" >/dev/null 2>&1
  else
    nc -z "$host" "$port" 2>/dev/null
  fi
}

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL..."

# First check if we're running in Docker environment
if [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" == *"postgres:"* ]]; then
  echo "🐳 Detected Docker environment, waiting for PostgreSQL container..."
  # Wait for PostgreSQL in the Docker network
  until check_postgres_service postgres 5432; do
    echo "Waiting for PostgreSQL at postgres:5432..."
    sleep 2
  done
  echo "✅ PostgreSQL container is ready!"
elif check_postgres_service localhost 5432; then
  echo "✅ PostgreSQL service is running!"
  # Now check if our specific database and user are accessible
  if check_postgres localhost 5432; then
    echo "✅ Trading database is accessible!"
  else
    echo "⚠️  PostgreSQL is running but trading database may need setup..."
    echo "💡 The database initialization step will handle this."
  fi
else
  echo "⚠️  PostgreSQL service is not running. Attempting to start PostgreSQL..."
  
  # Try different methods to start PostgreSQL
  if command -v brew >/dev/null 2>&1 && brew services list | grep postgresql >/dev/null 2>&1; then
    echo "🍺 Starting PostgreSQL with Homebrew..."
    brew services start postgresql@14 2>/dev/null || brew services start postgresql
    sleep 3
  elif command -v systemctl >/dev/null 2>&1; then
    echo "🐧 Starting PostgreSQL with systemctl..."
    sudo systemctl start postgresql
    sleep 3
  elif command -v service >/dev/null 2>&1; then
    echo "🐧 Starting PostgreSQL with service..."
    sudo service postgresql start
    sleep 3
  else
    echo "❌ Could not start PostgreSQL automatically."
    echo "💡 Please start PostgreSQL manually using one of the following commands:"
    echo "   - On macOS with Homebrew: brew services start postgresql@14"
    echo "   - On Linux: sudo systemctl start postgresql"
    echo "   - Or start PostgreSQL using your preferred method"
    echo ""
    echo "Make sure PostgreSQL is running on localhost:5432"
    echo ""
    echo "After starting PostgreSQL, please run this script again."
    exit 1
  fi
  
  # Check again after attempting to start
  if ! check_postgres_service localhost 5432; then
    echo "❌ Failed to start PostgreSQL."
    echo "💡 Please ensure PostgreSQL is installed and configured properly."
    echo "   You can install PostgreSQL using:"
    echo "   - On macOS: brew install postgresql@14"
    echo "   - On Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "   - On CentOS/RHEL: sudo yum install postgresql-server postgresql-contrib"
    echo ""
    echo "After installation, the database initialization step will create the required database and user."
    exit 1
  fi
fi

# Install backend dependencies if node_modules doesn't exist
if [ ! -d "backend/node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  cd backend && npm install && cd ..
fi

# Install frontend dependencies if node_modules doesn't exist
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

# Install Python dependencies if not already installed
if ! python3 -c "import yfinance" 2>/dev/null; then
  echo "📦 Installing Python dependencies..."
  cd data/src/server && pip install -r requirements.txt && cd ../../..
fi

# Initialize database and seed data
echo "🗄️  Initializing PostgreSQL database..."
cd backend
node -e "
const { initializeDatabase } = require('./src/models');
initializeDatabase().then(() => {
  console.log('✅ Database initialized successfully');
  process.exit(0);
}).catch(err => {
  console.error('❌ Database initialization failed:', err);
  process.exit(1);
});
" || {
  echo "❌ Database initialization failed. Please check your PostgreSQL connection."
  exit 1
}

echo "🌱 Seeding database with sample data..."
node seed.js || echo "⚠️  Seeding failed/skipped - database may already contain data"
cd ..

# Start backend, frontend, and Python server in parallel
echo "⚙️  Starting backend, frontend, and Python server..."

# Start Python server
cd data/src/server
python3 yahoo_finance_server.py > ../../../data_server.log 2>&1 &
PYTHON_SERVER_PID=$!
cd ../../..

# Start backend
cd backend
PORT=3001 npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Start frontend
cd frontend
PORT=3000 npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "✅ PostgreSQL is ready!"
echo "✅ Python Server PID: $PYTHON_SERVER_PID"
echo "✅ Backend PID: $BACKEND_PID"
echo "✅ Frontend PID: $FRONTEND_PID"

echo ""
echo "🎉 All services started successfully!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:3001"
echo "📊 Python Data Server: http://localhost:5002"
echo "🗄️  Database: PostgreSQL (ai_trading_platform)"
echo ""
echo "📝 Logs are being written to:"
echo "   - data_server.log (Python server)"
echo "   - backend.log (Node.js backend)"
echo "   - frontend.log (React frontend)"
echo ""
echo "🔐 Test credentials:"
echo "   - Admin: admin@trading.com / admin123"
echo "   - Trader: trader1@trading.com / trader123"
echo "   - Investor: investor1@trading.com / investor123"
echo ""
echo "⏹️  To stop the servers, press Ctrl+C"

# Function to cleanup on exit
cleanup() {
  echo ""
  echo "🛑 Shutting down services..."
  kill $PYTHON_SERVER_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  echo "✅ Services stopped"
  exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for processes to complete or be interrupted
wait $PYTHON_SERVER_PID $BACKEND_PID $FRONTEND_PID
