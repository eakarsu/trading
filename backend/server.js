const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const cors = require('cors');
const express = require('express');
const fs = require('fs');
const helmet = require('helmet');
const http = require('http');
const { sequelize } = require('./src/config/database');
const { boolean, list, validateRuntime } = require('./src/config/runtime');
const { initializeDatabase } = require('./src/models');

const allowedOrigins = list('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173');
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && allowedOrigins.includes('*'))) {
      return callback(null, true);
    }
    return callback(Object.assign(new Error('Origin is not allowed by CORS policy'), { status: 403, code: 'CORS_DENIED' }));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
};

const app = express();
const server = http.createServer(app);
const publicPath = path.join(__dirname, 'public');

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '256kb' }));
if (fs.existsSync(publicPath)) app.use(express.static(publicPath));

app.get('/', (req, res) => res.json({
  message: 'Paper Trading Platform API',
  version: '2.0.0',
  custodyBoundary: 'PAPER_SIMULATION_ONLY',
  liveTradingEnabled: false,
}));

app.get('/health', async (req, res) => {
  try {
    await sequelize.query('SELECT 1');
    res.json({ status: 'healthy', database: 'reachable', timestamp: new Date().toISOString(), uptime: process.uptime() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', database: 'unreachable', timestamp: new Date().toISOString() });
  }
});

app.get('/ready', async (req, res) => {
  try {
    const [rows] = await sequelize.query("SELECT to_regclass('public.paper_orders') AS paper_orders");
    if (!rows[0]?.paper_orders) return res.status(503).json({ status: 'not_ready', reason: 'migrations_required' });
    return res.json({ status: 'ready', migrations: 'applied' });
  } catch (error) {
    return res.status(503).json({ status: 'not_ready', reason: 'database_unreachable' });
  }
});

app.use('/api/health', require('./src/routes/healthRoutes'));
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/runtime-ai', require('./src/routes/runtimeAiRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/paper-trading', require('./src/routes/paperTradingRoutes'));

const disabled = feature => (req, res) => res.status(503).json({
  code: 'FEATURE_DISABLED',
  message: `${feature} is disabled. This deployment exposes paper simulation only.`,
  custodyBoundary: 'PAPER_SIMULATION_ONLY',
});
const mountFeature = (enabled, routePath, modulePath, feature) => {
  app.use(routePath, enabled ? require(modulePath) : disabled(feature));
};

const legacy = false;
const experimentalAi = false;
const liveTrading = false;

mountFeature(legacy, '/api/market-data', './src/routes/marketDataRoutes', 'legacy market-data tools');
mountFeature(legacy, '/api/strategies', './src/routes/strategyRoutes', 'legacy strategy tools');
mountFeature(legacy, '/api/portfolio', './src/routes/portfolioRoutes', 'legacy portfolio tools');
mountFeature(legacy, '/api/custom-views', './src/routes/customViews', 'custom views');
mountFeature(experimentalAi, '/api/predictions', './src/routes/predictionRoutes', 'AI predictions');
mountFeature(experimentalAi, '/api/analysis', './src/routes/marketAnalysisRoutes', 'AI analysis');
mountFeature(experimentalAi, '/api/stock-picks', './src/routes/stockPicksRoutes', 'AI stock picks');
mountFeature(experimentalAi, '/api/ai', './src/routes/aiResultsRoutes', 'AI results');
mountFeature(experimentalAi, '/api/ai-extras', './src/routes/aiExtrasRoutes', 'AI extras');
mountFeature(liveTrading, '/api/alpaca', './src/routes/alpacaRoutes', 'live broker execution');
mountFeature(liveTrading, '/api/algo', './src/routes/algoTradingRoutes', 'live algorithm execution');
mountFeature(liveTrading, '/api/brokers', './src/routes/brokerRoutes', 'broker connectivity');
mountFeature(liveTrading, '/api/broker-failover', './src/routes/brokerFailoverRoutes', 'broker failover');

if (fs.existsSync(publicPath)) {
  app.get(/^\/(?!api(?:\/|$)|health$|ready$).*/, (req, res) => res.sendFile(path.join(publicPath, 'index.html')));
}

app.use((req, res) => res.status(404).json({ code: 'NOT_FOUND', message: 'Route not found', path: req.originalUrl }));

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Validation error', errors: err.errors.map(item => ({ field: item.path, message: item.message })) });
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ code: 'CONFLICT', message: 'Resource already exists' });
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ code: 'INVALID_REFERENCE', message: 'Invalid reference to related resource' });
  }
  const status = Number(err.status) || 500;
  if (status >= 500) console.error('[request-error]', err);
  return res.status(status).json({
    code: err.code || 'INTERNAL_ERROR', message: status >= 500 ? 'Internal server error' : err.message,
    ...(err.details === undefined ? {} : { details: err.details }),
  });
});

async function start() {
  validateRuntime();
  const initialized = await initializeDatabase();
  if (!initialized) throw new Error('Database initialization failed');
  const port = Number(process.env.PORT || 3001);
  const host = process.env.HOST || '127.0.0.1';
  return new Promise(resolve => server.listen(port, host, () => {
    console.log(`Paper Trading API listening on ${host}:${port}`);
    resolve(server);
  }));
}

async function shutdown(signal) {
  console.log(`${signal} received; stopping HTTP and database connections`);
  server.close(async () => {
    await sequelize.close();
    process.exit(0);
  });
}

if (require.main === module) {
  start().catch(error => {
    console.error('Startup failed:', error.message);
    process.exit(1);
  });
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

module.exports = { app, server, start };
