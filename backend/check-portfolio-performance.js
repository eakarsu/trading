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

async function checkPortfolioPerformance() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Read portfolio performance data in detail
    console.log('\n💼 PORTFOLIO PERFORMANCE DETAILS:');
    const portfolios = await sequelize.query(`
      SELECT 
        id, 
        "userId", 
        name, 
        "totalValue", 
        "cashBalance", 
        "totalReturn", 
        "totalReturnPercent",
        performance::text as performance_json
      FROM portfolios 
      ORDER BY "createdAt"
    `, {
      type: Sequelize.QueryTypes.SELECT
    });
    
    portfolios.forEach((portfolio, index) => {
      console.log(`\n--- Portfolio ${index + 1}: ${portfolio.name} ---`);
      console.log(`User ID: ${portfolio.userId}`);
      console.log(`Total Value: $${portfolio.totalValue}`);
      console.log(`Cash Balance: $${portfolio.cashBalance}`);
      console.log(`Total Return: $${portfolio.totalReturn}`);
      console.log(`Total Return %: ${portfolio.totalReturnPercent}%`);
      console.log(`Performance JSON: ${portfolio.performance_json}`);
    });

  } catch (error) {
    console.error('❌ Error reading portfolio performance:', error);
  } finally {
    await sequelize.close();
  }
}

checkPortfolioPerformance();
