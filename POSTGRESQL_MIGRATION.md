# PostgreSQL Migration Guide

## Overview

This document explains the complete migration from MongoDB to PostgreSQL for the AI Trading Platform. The migration includes database setup, model conversion, and deployment instructions.

## What Changed

### 1. Database Technology
- **Before**: MongoDB with Mongoose ODM
- **After**: PostgreSQL with Sequelize ORM

### 2. Key Benefits of PostgreSQL
- **ACID Compliance**: Full transaction support with rollback capabilities
- **Complex Queries**: Advanced SQL queries with joins, subqueries, and aggregations
- **Data Integrity**: Foreign key constraints and referential integrity
- **Performance**: Better performance for complex analytical queries
- **JSON Support**: Native JSONB support for flexible data structures
- **Scalability**: Better horizontal and vertical scaling options

## Database Schema

### Tables Created

1. **users** - User accounts and preferences
2. **market_data** - Real-time and historical market data
3. **portfolios** - User investment portfolios
4. **strategies** - Trading strategies and algorithms
5. **predictions** - AI-generated market predictions
6. **market_analysis** - Comprehensive market analysis reports

### Key Features

- **UUID Primary Keys**: All tables use UUID for better distribution
- **JSONB Fields**: Flexible JSON storage for complex data structures
- **Indexes**: Optimized indexes for common query patterns
- **Foreign Key Constraints**: Proper relationships between tables
- **Validation**: Built-in data validation at the database level

## Setup Instructions

### 1. Using Docker (Recommended)

```bash
# Start PostgreSQL and the application
docker-compose up -d

# Check if containers are running
docker-compose ps

# View logs
docker-compose logs postgres
docker-compose logs app
```

### 2. Manual Setup

#### Install PostgreSQL
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE ai_trading_platform;
CREATE USER trading_user WITH PASSWORD 'trading_password';
GRANT ALL PRIVILEGES ON DATABASE ai_trading_platform TO trading_user;
\q
```

#### Install Dependencies
```bash
cd backend
npm install pg sequelize sequelize-cli bcryptjs jsonwebtoken dotenv
```

#### Environment Configuration
Update `backend/.env`:
```env
DATABASE_URL=postgresql://trading_user:trading_password@localhost:5432/ai_trading_platform
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_trading_platform
DB_USER=trading_user
DB_PASSWORD=trading_password
```

### 3. Database Initialization

#### Run Migrations
```bash
# Initialize database and create tables
cd backend
node -e "require('./src/models').initializeDatabase()"
```

#### Seed Sample Data
```bash
# Populate database with sample data
node seed.js
```

#### Test Connection
```bash
# Run connection test
node ../test-postgres.js
```

## Model Conversion Details

### User Model
- **MongoDB**: Simple document with nested objects
- **PostgreSQL**: Structured table with JSONB for preferences
- **Features**: Password hashing, validation, relationships

### MarketData Model
- **MongoDB**: Flexible document structure
- **PostgreSQL**: Typed columns with proper decimal handling
- **Features**: Indexes on symbol and timestamp, metadata JSONB

### Portfolio Model
- **MongoDB**: Embedded holdings array
- **PostgreSQL**: JSONB holdings with structured performance tracking
- **Features**: Foreign key to users, comprehensive portfolio metrics

### Strategy Model
- **MongoDB**: Flexible rule structure
- **PostgreSQL**: JSONB for parameters and rules, enum types
- **Features**: Public/private strategies, performance tracking

### Prediction Model
- **MongoDB**: Simple prediction document
- **PostgreSQL**: Comprehensive prediction tracking with resolution
- **Features**: Multiple prediction types, confidence tracking

### MarketAnalysis Model
- **MongoDB**: Nested analysis objects
- **PostgreSQL**: Structured analysis with JSONB for complex data
- **Features**: Multi-type analysis, recommendation system

## API Compatibility

### No Breaking Changes
The API endpoints remain the same. The migration is transparent to frontend applications.

### Enhanced Features
- **Better Error Handling**: Sequelize provides detailed validation errors
- **Transaction Support**: Database transactions for data consistency
- **Advanced Queries**: Complex SQL queries for analytics
- **Performance**: Optimized queries with proper indexing

## Performance Optimizations

### Indexes Created
```sql
-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Market data indexes
CREATE INDEX idx_market_data_symbol ON market_data(symbol);
CREATE INDEX idx_market_data_timestamp ON market_data(timestamp);
CREATE INDEX idx_market_data_symbol_timestamp ON market_data(symbol, timestamp);

-- Portfolio indexes
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolios_active ON portfolios(is_active);

-- Strategy indexes
CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_type ON strategies(type);
CREATE INDEX idx_strategies_public ON strategies(is_public);

-- Prediction indexes
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_symbol ON predictions(symbol);
CREATE INDEX idx_predictions_target_date ON predictions(target_date);

-- Analysis indexes
CREATE INDEX idx_market_analysis_user_id ON market_analysis(user_id);
CREATE INDEX idx_market_analysis_symbol ON market_analysis(symbol);
CREATE INDEX idx_market_analysis_created_at ON market_analysis(created_at);
```

### Query Optimizations
- **Prepared Statements**: Sequelize uses prepared statements by default
- **Connection Pooling**: Configured connection pool for better performance
- **Lazy Loading**: Efficient relationship loading
- **Bulk Operations**: Optimized bulk inserts and updates

## Migration Benefits

### 1. Data Integrity
- Foreign key constraints ensure referential integrity
- Check constraints validate data at the database level
- Transaction support prevents data corruption

### 2. Query Capabilities
- Complex joins across multiple tables
- Advanced aggregation functions
- Window functions for analytics
- Full-text search capabilities

### 3. Scalability
- Better performance with large datasets
- Read replicas for scaling reads
- Partitioning support for large tables
- Better memory management

### 4. Analytics
- Native support for complex analytical queries
- Better integration with BI tools
- Advanced statistical functions
- Time-series analysis capabilities

## Monitoring and Maintenance

### Health Checks
```bash
# Check database connection
curl http://localhost:3001/health

# Check specific endpoints
curl http://localhost:3001/api/health
```

### Database Maintenance
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('ai_trading_platform'));

-- Check table sizes
SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname='public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM market_data WHERE symbol = 'AAPL';
```

### Backup and Recovery
```bash
# Create backup
pg_dump -h localhost -U trading_user ai_trading_platform > backup.sql

# Restore backup
psql -h localhost -U trading_user ai_trading_platform < backup.sql
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if PostgreSQL is running
   - Verify connection parameters in .env
   - Check firewall settings

2. **Authentication Failed**
   - Verify username and password
   - Check pg_hba.conf configuration
   - Ensure user has proper permissions

3. **Table Not Found**
   - Run database initialization
   - Check if migrations completed successfully
   - Verify table names and schema

### Debug Commands
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Connect to database directly
psql -h localhost -U trading_user -d ai_trading_platform

# List all tables
\dt

# Describe table structure
\d users
```

## Test Credentials

After running the seed script, you can use these test accounts:

- **Admin**: admin@trading.com / admin123
- **Trader**: trader1@trading.com / trader123
- **Investor**: investor1@trading.com / investor123

## Next Steps

1. **Run the application**: `docker-compose up`
2. **Test the API**: Use the provided test credentials
3. **Monitor performance**: Check query performance and optimize as needed
4. **Scale as needed**: Add read replicas or partitioning for large datasets

The PostgreSQL migration provides a solid foundation for the AI Trading Platform with better performance, data integrity, and analytical capabilities.
