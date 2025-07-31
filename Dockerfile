FROM node:24-slim

# Set environment variables for non-interactive package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies: Python, pip, PostgreSQL server and client, and other tools
RUN apt-get update && \
    apt-get install -y \
        python3 \
        python3-pip \
        python3-venv \
        curl \
        gnupg \
        netcat-openbsd \
        postgresql \
        postgresql-contrib \
        sudo \
        && rm -rf /var/lib/apt/lists/*

# Initialize PostgreSQL and create database and user
RUN service postgresql start && \
    sudo -u postgres psql -c "CREATE DATABASE ai_trading_platform;" && \
    sudo -u postgres psql -c "CREATE USER trading_user WITH PASSWORD 'trading_password';" && \
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ai_trading_platform TO trading_user;" && \
    sudo -u postgres psql -d ai_trading_platform -c "GRANT CREATE,USAGE ON SCHEMA public TO trading_user;" && \
    sudo -u postgres psql -c "ALTER USER trading_user CREATEDB;" && \
    service postgresql stop

# Set working directory
WORKDIR /app

# Copy application code
COPY . .

# Install NPM dependencies in both frontend and backend
RUN cd frontend && npm install
RUN cd backend && npm install 

# Copy Python requirements for the server
COPY data/src/server/requirements.txt ./requirements.txt

# Create and use a venv for dependencies
RUN python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# Ensure the venv Python and pip are available (optional, for PATH)
ENV PATH="/opt/venv/bin:$PATH"


# Make sure the start script is executable
RUN chmod +x ./start.sh


# Command to start PostgreSQL and then everything else
CMD ["sh", "-c", "service postgresql start && ./start.sh"]
