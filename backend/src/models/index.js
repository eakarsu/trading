const { sequelize } = require('../config/database');
const User = require('./User');
const MarketData = require('./MarketData');
const Portfolio = require('./Portfolio');
const Strategy = require('./Strategy');
const Prediction = require('./Prediction');
const MarketAnalysis = require('./MarketAnalysis');
const ActiveStrategy = require('./ActiveStrategy');
const AIAnalysis = require('./AIAnalysis');
const AIResult = require('./AIResult');
const MarketSnapshot = require('./MarketSnapshot');
const PaperAccount = require('./PaperAccount');
const PaperOrder = require('./PaperOrder');
const PaperFill = require('./PaperFill');
const PaperPosition = require('./PaperPosition');
const LedgerEntry = require('./LedgerEntry');
const TradingAuditEvent = require('./TradingAuditEvent');
const CorporateAction = require('./CorporateAction');

// Define associations
User.hasMany(Portfolio, { foreignKey: 'userId', as: 'portfolios' });
Portfolio.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Strategy, { foreignKey: 'userId', as: 'strategies' });
Strategy.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Prediction, { foreignKey: 'userId', as: 'predictions' });
Prediction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(MarketAnalysis, { foreignKey: 'userId', as: 'analyses' });
MarketAnalysis.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(ActiveStrategy, { foreignKey: 'userId', as: 'activeStrategies' });
ActiveStrategy.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(AIAnalysis, { foreignKey: 'userId', as: 'aiAnalyses' });
AIAnalysis.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(AIResult, { foreignKey: 'userId', as: 'aiResults' });
AIResult.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(PaperAccount, { foreignKey: 'userId', as: 'paperAccount' });
PaperAccount.belongsTo(User, { foreignKey: 'userId', as: 'user' });
PaperAccount.hasMany(PaperOrder, { foreignKey: 'accountId', as: 'orders' });
PaperOrder.belongsTo(PaperAccount, { foreignKey: 'accountId', as: 'account' });
PaperOrder.hasMany(PaperFill, { foreignKey: 'orderId', as: 'fills' });
PaperFill.belongsTo(PaperOrder, { foreignKey: 'orderId', as: 'order' });
PaperAccount.hasMany(PaperPosition, { foreignKey: 'accountId', as: 'positions' });
PaperPosition.belongsTo(PaperAccount, { foreignKey: 'accountId', as: 'account' });

// Initialize database
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    console.log('✅ Database schema is reachable. Apply checked-in migrations before startup.');
    return true;
  } catch (error) {
    console.error('❌ Unable to initialize database:', error.message);
    return false;
  }
};

module.exports = {
  sequelize,
  User,
  MarketData,
  Portfolio,
  Strategy,
  Prediction,
  MarketAnalysis,
  ActiveStrategy,
  AIAnalysis,
  AIResult,
  MarketSnapshot,
  PaperAccount,
  PaperOrder,
  PaperFill,
  PaperPosition,
  LedgerEntry,
  TradingAuditEvent,
  CorporateAction,
  initializeDatabase
};
