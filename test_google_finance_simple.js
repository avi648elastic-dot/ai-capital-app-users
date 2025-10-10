// Simple test to check if Google Finance service is working
const axios = require('axios');

async function testGoogleFinance() {
  try {
    console.log('🔍 Testing Google Finance API directly...');
    
    // Test with Finnhub API (has default key)
    const finnhubUrl = `https://finnhub.io/api/v1/quote?symbol=AAPL&token=d3crne9r01qmnfgf0q70d3crne9r01qmnfgf0q7g`;
    
    const response = await axios.get(finnhubUrl);
    console.log('✅ Finnhub API Response:', response.data);
    
    // Test with FMP API (has default key)
    const fmpUrl = `https://financialmodelingprep.com/api/v3/quote-short/AAPL?apikey=DPQXLdd8vdBNFA1tl5HWXt8Fd7D0Lw6G`;
    
    const fmpResponse = await axios.get(fmpUrl);
    console.log('✅ FMP API Response:', fmpResponse.data);
    
  } catch (error) {
    console.error('❌ Error testing APIs:', error.response?.data || error.message);
  }
}

testGoogleFinance();
