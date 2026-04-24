const { sequelize } = require('../config/database');
const User = require('./User');
const MarketData = require('./MarketData');
const Portfolio = require('./Portfolio');
const Strategy = require('./Strategy');
const Prediction = require('./Prediction');
const MarketAnalysis = require('./MarketAnalysis');

// Define associations
User.hasMany(Portfolio, { foreignKey: 'userId', as: 'portfolios' });
Portfolio.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Strategy, { foreignKey: 'userId', as: 'strategies' });
Strategy.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Prediction, { foreignKey: 'userId', as: 'predictions' });
Prediction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(MarketAnalysis, { foreignKey: 'userId', as: 'analyses' });
MarketAnalysis.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Initialize database
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✅ All models synchronized successfully.');
    
    return true;
  } catch (error) {
    console.error('❌ Unable to initialize database:', error);
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
  initializeDatabase
};
