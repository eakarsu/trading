const { sequelize } = require('./backend/src/config/database');

async function migrateMarketData() {
  try {
    console.log('🔄 Starting MarketData table migration...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Add userId column
    try {
      await sequelize.query(`
        ALTER TABLE market_data 
        ADD COLUMN "userId" UUID REFERENCES users(id)
      `);
      console.log('✅ Added userId column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ userId column already exists');
      } else {
        console.log('❌ Error adding userId column:', error.message);
      }
    }
    
    // Add lastUpdated column
    try {
      await sequelize.query(`
        ALTER TABLE market_data 
        ADD COLUMN "lastUpdated" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `);
      console.log('✅ Added lastUpdated column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ lastUpdated column already exists');
      } else {
        console.log('❌ Error adding lastUpdated column:', error.message);
      }
    }
    
    // Update existing records to have lastUpdated = createdAt
    try {
      await sequelize.query(`
        UPDATE market_data 
        SET "lastUpdated" = "createdAt" 
        WHERE "lastUpdated" IS NULL
      `);
      console.log('✅ Updated existing records with lastUpdated values');
    } catch (error) {
      console.log('❌ Error updating existing records:', error.message);
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sequelize.close();
    console.log('🔒 Database connection closed.');
  }
}

migrateMarketData();
