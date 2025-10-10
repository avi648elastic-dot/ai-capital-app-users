// Debug script to test stock decisions
const axios = require('axios');

async function testStockDecision() {
  try {
    console.log('🧪 Testing stock decision...');
    
    const response = await axios.post('http://localhost:3000/api/stocks/test-decision', {
      ticker: 'QS',
      entryPrice: 16.00,
      currentPrice: 16.34,
      stopLoss: 14.5,
      takeProfit: 16.8
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

async function testStockMetrics() {
  try {
    console.log('🧪 Testing stock metrics...');
    
    const response = await axios.get('http://localhost:3000/api/stocks/test-metrics/QS', {
      timeout: 10000
    });
    
    console.log('✅ Metrics:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Wait a bit for server to start, then test
setTimeout(async () => {
  console.log('🔍 Starting debug tests...');
  await testStockMetrics();
  await testStockDecision();
}, 5000);
