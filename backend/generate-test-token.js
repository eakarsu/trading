const jwt = require('jsonwebtoken');
const { User, initializeDatabase } = require('./src/models');
require('dotenv').config();

const generateTestToken = async () => {
  try {
    console.log('🔑 Generating test JWT token...');
    
    // Initialize database
    await initializeDatabase();
    
    // Find the admin user
    const adminUser = await User.findOne({
      where: { email: 'admin@trading.com' }
    });
    
    if (!adminUser) {
      console.log('❌ Admin user not found. Please run the seed script first.');
      console.log('Run: node backend/seed.js');
      process.exit(1);
    }
    
    console.log('✅ Admin user found:', {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: adminUser.id,
        email: adminUser.email,
        username: adminUser.username 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    console.log('\n🎉 JWT Token generated successfully!');
    console.log('\n📋 Token Details:');
    console.log('='.repeat(50));
    console.log('User ID:', adminUser.id);
    console.log('Username:', adminUser.username);
    console.log('Email:', adminUser.email);
    console.log('='.repeat(50));
    console.log('\n🔐 JWT Token:');
    console.log(token);
    console.log('\n📝 Instructions to fix 401 Unauthorized errors:');
    console.log('1. Copy the token above');
    console.log('2. Open browser developer tools (F12)');
    console.log('3. Go to Application/Storage > Local Storage');
    console.log('4. Add a new item:');
    console.log('   Key: token');
    console.log('   Value: [paste the token here]');
    console.log('5. Refresh the page');
    console.log('\n🌐 Or use this JavaScript command in browser console:');
    console.log(`localStorage.setItem('token', '${token}');`);
    console.log('window.location.reload();');
    
    // Also create a simple login test
    console.log('\n🧪 Alternative: Test login via API:');
    console.log('POST http://localhost:3001/api/users/login');
    console.log('Body: {');
    console.log('  "email": "admin@trading.com",');
    console.log('  "password": "admin123"');
    console.log('}');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error generating token:', error);
    process.exit(1);
  }
};

generateTestToken();
