const { initializeDatabase, User, MarketData } = require('./backend/src/models');

const testPostgreSQL = async () => {
  try {
    console.log('🧪 Testing PostgreSQL connection...');
    
    // Initialize database
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      throw new Error('Failed to initialize database');
    }
    
    console.log('✅ Database connection successful');
    
    // Test creating a user
    console.log('👤 Testing user creation...');
    const testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpass123',
      firstName: 'Test',
      lastName: 'User'
    });
    
    console.log('✅ User created:', testUser.username);
    
    // Test creating market data
    console.log('📊 Testing market data creation...');
    const testMarketData = await MarketData.create({
      symbol: 'TEST',
      price: 100.50,
      volume: 1000000,
      high: 105.00,
      low: 98.00,
      open: 99.50,
      close: 100.50,
      source: 'test'
    });
    
    console.log('✅ Market data created:', testMarketData.symbol);
    
    // Clean up test data
    await testUser.destroy();
    await testMarketData.destroy();
    
    console.log('🧹 Test data cleaned up');
    console.log('🎉 PostgreSQL setup test completed successfully!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ PostgreSQL test failed:', error);
    process.exit(1);
  }
};

testPostgreSQL();
