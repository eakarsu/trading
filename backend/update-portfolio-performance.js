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

async function updatePortfolioPerformance() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Get all portfolios
    const portfolios = await sequelize.query('SELECT id, name, "totalReturnPercent" FROM portfolios', {
      type: Sequelize.QueryTypes.SELECT
    });

    console.log(`\n📊 Updating performance data for ${portfolios.length} portfolios...`);

    for (const portfolio of portfolios) {
      // Generate realistic performance data based on the portfolio's total return
      const baseReturn = parseFloat(portfolio.totalReturnPercent) || 0;
      
      // Create realistic performance metrics
      const performance = {
        oneDay: (Math.random() - 0.5) * 2, // Random daily change between -1% and +1%
        oneWeek: baseReturn * 0.1 + (Math.random() - 0.5) * 2, // 10% of total return + noise
        oneMonth: baseReturn * 0.3 + (Math.random() - 0.5) * 3, // 30% of total return + noise
        threeMonths: baseReturn * 0.6 + (Math.random() - 0.5) * 4, // 60% of total return + noise
        sixMonths: baseReturn * 0.8 + (Math.random() - 0.5) * 5, // 80% of total return + noise
        oneYear: baseReturn + (Math.random() - 0.5) * 3, // Total return + noise
        ytd: baseReturn * 0.7 + (Math.random() - 0.5) * 4, // 70% of total return + noise
        inception: baseReturn + (Math.random() - 0.5) * 2 // Total return + small noise
      };

      // Update the portfolio with performance data
      await sequelize.query(`
        UPDATE portfolios 
        SET performance = :performance 
        WHERE id = :id
      `, {
        replacements: {
          id: portfolio.id,
          performance: JSON.stringify(performance)
        },
        type: Sequelize.QueryTypes.UPDATE
      });

      console.log(`✅ Updated ${portfolio.name}: YTD ${performance.ytd.toFixed(2)}%, 1Y ${performance.oneYear.toFixed(2)}%`);
    }

    console.log('\n🎉 Portfolio performance data updated successfully!');

    // Verify the updates
    console.log('\n📊 Verification - Updated Performance Data:');
    const updatedPortfolios = await sequelize.query(`
      SELECT 
        name, 
        "totalReturnPercent",
        performance::text as performance_json
      FROM portfolios 
      ORDER BY "createdAt"
    `, {
      type: Sequelize.QueryTypes.SELECT
    });
    
    updatedPortfolios.forEach((portfolio) => {
      const perf = JSON.parse(portfolio.performance_json);
      console.log(`\n--- ${portfolio.name} ---`);
      console.log(`Total Return: ${portfolio.totalReturnPercent}%`);
      console.log(`YTD: ${perf.ytd.toFixed(2)}%`);
      console.log(`1 Day: ${perf.oneDay.toFixed(2)}%`);
      console.log(`1 Week: ${perf.oneWeek.toFixed(2)}%`);
      console.log(`1 Month: ${perf.oneMonth.toFixed(2)}%`);
      console.log(`6 Months: ${perf.sixMonths.toFixed(2)}%`);
      console.log(`1 Year: ${perf.oneYear.toFixed(2)}%`);
      console.log(`Inception: ${perf.inception.toFixed(2)}%`);
    });

  } catch (error) {
    console.error('❌ Error updating portfolio performance:', error);
  } finally {
    await sequelize.close();
  }
}

updatePortfolioPerformance();
