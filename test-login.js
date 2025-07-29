const { User, initializeDatabase } = require('./backend/src/models');

const testLogin = async () => {
  try {
    console.log('🧪 Testing login functionality...');
    
    // Initialize database
    await initializeDatabase();
    
    // Find the admin user
    const adminUser = await User.findOne({
      where: { email: 'admin@trading.com' }
    });
    
    if (!adminUser) {
      console.log('❌ Admin user not found. Running seed script...');
      // Run seed script
      const { seedData } = require('./backend/seed.js');
      await seedData();
      
      // Try to find admin user again
      const newAdminUser = await User.findOne({
        where: { email: 'admin@trading.com' }
      });
      
      if (!newAdminUser) {
        console.log('❌ Admin user still not found after seeding');
        return;
      }
      
      console.log('✅ Admin user found after seeding');
      console.log('User details:', {
        id: newAdminUser.id,
        username: newAdminUser.username,
        email: newAdminUser.email,
        firstName: newAdminUser.firstName,
        lastName: newAdminUser.lastName,
        role: newAdminUser.role
      });
    } else {
      console.log('✅ Admin user found');
      console.log('User details:', {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role
      });
    }
    
    // Test password comparison
    const testPassword = 'admin123';
    const isPasswordValid = await adminUser.comparePassword(testPassword);
    
    if (isPasswordValid) {
      console.log('✅ Password validation successful');
    } else {
      console.log('❌ Password validation failed');
    }
    
    // Test finding all users
    const allUsers = await User.findAll({
      attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'role']
    });
    
    console.log('\n📋 All users in database:');
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.username}) - ${user.role}`);
    });
    
    console.log('\n🎉 Login test completed successfully!');
    console.log('\n🔐 Test these credentials in your frontend:');
    console.log('   - Admin: admin@trading.com / admin123');
    console.log('   - Trader: trader1@trading.com / trader123');
    console.log('   - Investor: investor1@trading.com / investor123');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Login test failed:', error);
    process.exit(1);
  }
};

testLogin();
