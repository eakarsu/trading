const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'ai_trading_platform',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function readAllData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Read all data from each table
    console.log('\n📊 USERS:');
    const users = await sequelize.query('SELECT id, username, email, "firstName", "lastName", role FROM users ORDER BY "createdAt"', {
      type: Sequelize.QueryTypes.SELECT
    });
    console.table(users);

    console.log('\n💼 PORTFOLIOS:');
    const portfolios = await sequelize.query('SELECT id, "userId", name, "totalValue", "cashBalance", "totalReturn", "totalReturnPercent", performance FROM portfolios ORDER BY "createdAt"', {
      type: Sequelize.QueryTypes.SELECT
    });
    console.table(portfolios);

    console.log('\n📈 MARKET DATA:');
    const marketData = await sequelize.query('SELECT id, symbol, price, volume, high, low, "changePercent", sector FROM market_data ORDER BY "createdAt" LIMIT 10', {
      type: Sequelize.QueryTypes.SELECT
    });
    console.table(marketData);

    console.log('\n🎯 STRATEGIES:');
    const strategies = await sequelize.query('SELECT id, "userId", name, type, "riskLevel", "timeHorizon" FROM strategies ORDER BY "createdAt"', {
      type: Sequelize.QueryTypes.SELECT
    });
    console.table(strategies);

    console.log('\n🔮 PREDICTIONS:');
    const predictions = await sequelize.query('SELECT id, "userId", symbol, "predictionType", "currentPrice", "predictedPrice", confidence FROM predictions ORDER BY "createdAt"', {
      type: Sequelize.QueryTypes.SELECT
    });
    console.table(predictions);

    console.log('\n📊 MARKET ANALYSIS:');
    const analyses = await sequelize.query('SELECT id, "userId", symbol, "analysisType", "currentPrice", recommendation, confidence FROM market_analysis ORDER BY "createdAt"', {
      type: Sequelize.QueryTypes.SELECT
    });
    console.table(analyses);

  } catch (error) {
    console.error('❌ Error reading database data:', error);
  } finally {
    await sequelize.close();
  }
}

readAllData();
