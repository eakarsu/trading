// Load environment variables FIRST, before any other imports
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
// Lazy-require helmet so the server still boots if dependencies have not
// been re-installed yet after the audit fix added it to package.json.
let helmet;
try {
  helmet = require('helmet');
} catch (_) {
  console.warn('[server] helmet not installed yet — run `npm install` to enable security headers');
  helmet = () => (req, res, next) => next();
}
const http = require('http');
const socketIo = require('socket.io');
const { initializeDatabase } = require('./src/models');

// Env-based CORS allow-list (audit fix: open CORS not safe for prod)
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',').map(s => s.trim()).filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    // Allow non-browser tools (no origin) and any explicit allow-list match
    if (!origin || ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) {
      return cb(null, true);
    }
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
};

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ALLOWED_ORIGINS.includes('*') ? '*' : ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize PostgreSQL connection
const initializeApp = async () => {
  try {
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      throw new Error('Failed to initialize database');
    }
    console.log('✅ PostgreSQL connected and models synchronized');

    // Recover active trading strategies from DB after models are ready
    const algoTradingService = require('./src/services/algoTradingService');
    await algoTradingService.recoverStrategiesFromDB();
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  }
};

// Initialize database connection
initializeApp();

// Middleware (security-first)
app.use(helmet({
  contentSecurityPolicy: false, // disable CSP at API layer; FE handles its own
  crossOriginEmbedderPolicy: false
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Trading Platform API', 
    version: '1.0.0',
    status: 'operational',
    database: 'PostgreSQL'
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL',
    uptime: process.uptime()
  });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
  
  // Real-time market data updates
  socket.on('subscribe-market-data', (symbols) => {
    console.log('Client subscribed to market data:', symbols);
    socket.join('market-data');
  });
  
  socket.on('unsubscribe-market-data', () => {
    console.log('Client unsubscribed from market data');
    socket.leave('market-data');
  });
});

// Routes
app.use('/api/health', require('./src/routes/healthRoutes'));
app.use('/api/market-data', require('./src/routes/marketDataRoutes'));
app.use('/api/strategies', require('./src/routes/strategyRoutes'));
app.use('/api/portfolio', require('./src/routes/portfolioRoutes'));
app.use('/api/predictions', require('./src/routes/predictionRoutes'));
app.use('/api/analysis', require('./src/routes/marketAnalysisRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/stock-picks', require('./src/routes/stockPicksRoutes'));
app.use('/api/alpaca', require('./src/routes/alpacaRoutes'));
app.use('/api/algo', require('./src/routes/algoTradingRoutes'));
app.use('/api/brokers', require('./src/routes/brokerRoutes'));
app.use('/api/ai', require('./src/routes/aiResultsRoutes'));
app.use('/api/ai-extras', require('./src/routes/aiExtrasRoutes'));

// Custom Views (mounted BEFORE 404 handler)
app.use('/api/custom-views', require('./src/routes/customViews'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }
  
  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      message: 'Resource already exists',
      field: err.errors[0]?.path
    });
  }
  
  // Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      message: 'Invalid reference to related resource'
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({ 
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: PostgreSQL`);
});

module.exports = { app, server, io };
app.use('/api', require('./src/routes/gap-features')); // === Batch 11 Gaps & Frontend Mounts ===

