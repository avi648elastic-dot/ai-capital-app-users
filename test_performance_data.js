const axios = require('axios');

async function testPerformanceAPI() {
  try {
    console.log('🔍 Testing Performance API endpoints...');
    
    // Test the Google Finance service directly
    console.log('\n1. Testing Google Finance Service...');
    const googleFinanceResponse = await axios.get('https://ai-capital-app7.onrender.com/api/stocks/test-metrics/AAPL');
    console.log('✅ Google Finance Service Response:', JSON.stringify(googleFinanceResponse.data, null, 2));
    
    // Test performance endpoint with a test user token (you'll need to replace this)
    console.log('\n2. Testing Performance Endpoint...');
    // Note: You'll need to get a real token from login
    const testToken = 'your-test-token-here';
    
    if (testToken !== 'your-test-token-here') {
      const performanceResponse = await axios.get('https://ai-capital-app7.onrender.com/api/performance?days=30', {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      console.log('✅ Performance API Response:', JSON.stringify(performanceResponse.data, null, 2));
    } else {
      console.log('⚠️ Skipping performance test - need real token');
    }
    
    // Test volatility service
    console.log('\n3. Testing Volatility Service...');
    const volatilityResponse = await axios.get('https://ai-capital-app7.onrender.com/api/performance/volatility', {
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    console.log('✅ Volatility API Response:', JSON.stringify(volatilityResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing APIs:', error.response?.data || error.message);
  }
}

testPerformanceAPI();
