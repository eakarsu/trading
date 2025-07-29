const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

// Test function to check export endpoints
async function testExportEndpoints() {
  try {
    // Get a test token first
    console.log('🔐 Getting test token...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'admin@trading.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Token obtained successfully');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test predictions export
    console.log('\n📊 Testing predictions export...');
    try {
      const predictionsExportResponse = await axios.get(`${API_BASE_URL}/api/predictions/export`, {
        headers,
        responseType: 'blob'
      });
      console.log('✅ Predictions export endpoint working');
      console.log(`   Response type: ${predictionsExportResponse.headers['content-type']}`);
      console.log(`   Response size: ${predictionsExportResponse.data.length || 'N/A'} bytes`);
    } catch (error) {
      console.log('❌ Predictions export failed:', error.response?.status, error.response?.statusText);
    }
    
    // Test market analysis export
    console.log('\n📈 Testing market analysis export...');
    try {
      const analysisExportResponse = await axios.get(`${API_BASE_URL}/api/analysis/export`, {
        headers,
        responseType: 'blob'
      });
      console.log('✅ Market analysis export endpoint working');
      console.log(`   Response type: ${analysisExportResponse.headers['content-type']}`);
      console.log(`   Response size: ${analysisExportResponse.data.length || 'N/A'} bytes`);
    } catch (error) {
      console.log('❌ Market analysis export failed:', error.response?.status, error.response?.statusText);
    }
    
    console.log('\n🎉 Export functionality test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testExportEndpoints();
