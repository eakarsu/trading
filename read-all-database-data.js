const { sequelize } = require('./backend/src/config/database');
const User = require('./backend/src/models/User');
const MarketData = require('./backend/src/models/MarketData');
const Portfolio = require('./backend/src/models/Portfolio');
const Strategy = require('./backend/src/models/Strategy');
const Prediction = require('./backend/src/models/Prediction');
const MarketAnalysis = require('./backend/src/models/MarketAnalysis');

async function readAllDatabaseData() {
  try {
    console.log('🔍 Reading all data from the trading database...\n');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.\n');

    // Read Users
    console.log('👥 USERS:');
    console.log('========');
    const users = await User.findAll({
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }
    console.log(`Total Users: ${users.length}\n`);

    // Read Market Data
    console.log('📊 MARKET DATA:');
    console.log('===============');
    const marketData = await MarketData.findAll({
      attributes: ['id', 'symbol', 'price', 'volume', 'marketCap', 'timestamp', 'createdAt'],
      order: [['timestamp', 'DESC']],
      limit: 10 // Show latest 10 records
    });
    
    if (marketData.length === 0) {
      console.log('No market data found in the database.');
    } else {
      marketData.forEach((data, index) => {
        console.log(`${index + 1}. ${data.symbol} - $${data.price}`);
        console.log(`   ID: ${data.id}`);
        console.log(`   Volume: ${data.volume ? data.volume.toLocaleString() : 'N/A'}`);
        console.log(`   Market Cap: ${data.marketCap ? '$' + data.marketCap.toLocaleString() : 'N/A'}`);
        console.log(`   Timestamp: ${data.timestamp}`);
        console.log('');
      });
    }
    console.log(`Total Market Data Records: ${marketData.length} (showing latest 10)\n`);

    // Read Portfolios
    console.log('💼 PORTFOLIOS:');
    console.log('==============');
    const portfolios = await Portfolio.findAll({
      attributes: ['id', 'userId', 'name', 'totalValue', 'totalReturn', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    if (portfolios.length === 0) {
      console.log('No portfolios found in the database.');
    } else {
      portfolios.forEach((portfolio, index) => {
        console.log(`${index + 1}. ${portfolio.name}`);
        console.log(`   ID: ${portfolio.id}`);
        console.log(`   User ID: ${portfolio.userId}`);
        console.log(`   Total Value: $${portfolio.totalValue ? portfolio.totalValue.toLocaleString() : 'N/A'}`);
        console.log(`   Total Return: ${portfolio.totalReturn ? portfolio.totalReturn + '%' : 'N/A'}`);
        console.log(`   Created: ${portfolio.createdAt}`);
        console.log('');
      });
    }
    console.log(`Total Portfolios: ${portfolios.length}\n`);

    // Read Strategies
    console.log('🎯 STRATEGIES:');
    console.log('==============');
    const strategies = await Strategy.findAll({
      attributes: ['id', 'userId', 'name', 'type', 'isActive', 'performance', 'riskLevel', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    if (strategies.length === 0) {
      console.log('No strategies found in the database.');
    } else {
      strategies.forEach((strategy, index) => {
        console.log(`${index + 1}. ${strategy.name}`);
        console.log(`   ID: ${strategy.id}`);
        console.log(`   User ID: ${strategy.userId}`);
        console.log(`   Type: ${strategy.type}`);
        console.log(`   Risk Level: ${strategy.riskLevel}`);
        console.log(`   Active: ${strategy.isActive}`);
        console.log(`   Performance: ${strategy.performance && strategy.performance.totalReturn ? strategy.performance.totalReturn + '%' : 'N/A'}`);
        console.log(`   Created: ${strategy.createdAt}`);
        console.log('');
      });
    }
    console.log(`Total Strategies: ${strategies.length}\n`);

    // Read Predictions
    console.log('🔮 PREDICTIONS:');
    console.log('===============');
    const predictions = await Prediction.findAll({
      attributes: ['id', 'userId', 'symbol', 'predictionType', 'currentPrice', 'predictedPrice', 'confidence', 'timeframe', 'targetDate', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 10 // Show latest 10 records
    });
    
    if (predictions.length === 0) {
      console.log('No predictions found in the database.');
    } else {
      predictions.forEach((prediction, index) => {
        console.log(`${index + 1}. ${prediction.symbol} - ${prediction.predictionType}`);
        console.log(`   ID: ${prediction.id}`);
        console.log(`   User ID: ${prediction.userId}`);
        console.log(`   Current Price: $${prediction.currentPrice}`);
        console.log(`   Predicted Price: $${prediction.predictedPrice || 'N/A'}`);
        console.log(`   Confidence: ${prediction.confidence}%`);
        console.log(`   Timeframe: ${prediction.timeframe}`);
        console.log(`   Target Date: ${prediction.targetDate}`);
        console.log(`   Created: ${prediction.createdAt}`);
        console.log('');
      });
    }
    console.log(`Total Predictions: ${predictions.length} (showing latest 10)\n`);

    // Read Market Analysis
    console.log('📈 MARKET ANALYSIS:');
    console.log('==================');
    const analyses = await MarketAnalysis.findAll({
      attributes: ['id', 'userId', 'symbol', 'currentPrice', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 10 // Show latest 10 records
    });
    
    if (analyses.length === 0) {
      console.log('No market analyses found in the database.');
    } else {
      analyses.forEach((analysis, index) => {
        console.log(`${index + 1}. ${analysis.symbol || 'MARKET'} Analysis`);
        console.log(`   ID: ${analysis.id}`);
        console.log(`   User ID: ${analysis.userId}`);
        console.log(`   Symbol: ${analysis.symbol || 'General Market'}`);
        console.log(`   Current Price: $${analysis.currentPrice || 'N/A'}`);
        console.log(`   Created: ${analysis.createdAt}`);
        console.log('');
      });
    }
    console.log(`Total Market Analyses: ${analyses.length} (showing latest 10)\n`);

    // Summary
    console.log('📋 DATABASE SUMMARY:');
    console.log('====================');
    console.log(`👥 Users: ${users.length}`);
    console.log(`📊 Market Data Records: ${marketData.length}`);
    console.log(`💼 Portfolios: ${portfolios.length}`);
    console.log(`🎯 Strategies: ${strategies.length}`);
    console.log(`🔮 Predictions: ${predictions.length}`);
    console.log(`📈 Market Analyses: ${analyses.length}`);
    console.log('');

    // Get table sizes
    console.log('📏 TABLE SIZES:');
    console.log('===============');
    
    const tableQueries = [
      { name: 'users', query: 'SELECT COUNT(*) as count FROM users' },
      { name: 'market_data', query: 'SELECT COUNT(*) as count FROM market_data' },
      { name: 'portfolios', query: 'SELECT COUNT(*) as count FROM portfolios' },
      { name: 'strategies', query: 'SELECT COUNT(*) as count FROM strategies' },
      { name: 'predictions', query: 'SELECT COUNT(*) as count FROM predictions' },
      { name: 'market_analyses', query: 'SELECT COUNT(*) as count FROM market_analyses' }
    ];

    for (const table of tableQueries) {
      try {
        const [results] = await sequelize.query(table.query);
        console.log(`${table.name}: ${results[0].count} records`);
      } catch (error) {
        console.log(`${table.name}: Error reading table (${error.message})`);
      }
    }

    console.log('\n✅ Database read operation completed successfully!');

  } catch (error) {
    console.error('❌ Error reading database data:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close database connection
    try {
      await sequelize.close();
      console.log('🔒 Database connection closed.');
    } catch (error) {
      console.error('Error closing database connection:', error.message);
    }
  }
}

// Run the function
readAllDatabaseData();
