/**
 * Test script to debug stock API failures
 */

require('dotenv').config();
const axios = require('axios');

async function testStockAPIs() {
  const symbol = 'UEC';
  
  console.log(`🔍 Testing APIs for ${symbol}...`);
  
  // Test Alpha Vantage
  console.log('\n📊 Testing Alpha Vantage...');
  try {
    const alphaKey = process.env.ALPHA_VANTAGE_API_KEY_1;
    if (!alphaKey) {
      console.log('❌ No Alpha Vantage API key');
    } else {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: symbol,
          outputsize: 'full',
          apikey: alphaKey
        },
        timeout: 15000
      });
      
      if (response.data['Error Message']) {
        console.log('❌ Alpha Vantage Error:', response.data['Error Message']);
      } else if (response.data['Note']) {
        console.log('⚠️ Alpha Vantage Note:', response.data['Note']);
      } else if (response.data['Time Series (Daily)']) {
        const dates = Object.keys(response.data['Time Series (Daily)']);
        console.log(`✅ Alpha Vantage Success: ${dates.length} days of data`);
      } else {
        console.log('❌ Alpha Vantage: No time series data');
      }
    }
  } catch (error) {
    console.log('❌ Alpha Vantage Error:', error.message);
  }
  
  // Test Finnhub
  console.log('\n📊 Testing Finnhub...');
  try {
    const finnhubKey = process.env.FINNHUB_API_KEY_1;
    if (!finnhubKey) {
      console.log('❌ No Finnhub API key');
    } else {
      const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubKey}`, {
        timeout: 10000
      });
      
      if (response.data.c === 0) {
        console.log('❌ Finnhub: No data for symbol');
      } else {
        console.log(`✅ Finnhub Success: $${response.data.c}`);
      }
    }
  } catch (error) {
    console.log('❌ Finnhub Error:', error.message);
  }
  
  // Test FMP
  console.log('\n📊 Testing FMP...');
  try {
    const fmpKey = process.env.FMP_API_KEY_1;
    if (!fmpKey) {
      console.log('❌ No FMP API key');
    } else {
      const response = await axios.get(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${fmpKey}`, {
        timeout: 10000
      });
      
      if (response.data.length === 0) {
        console.log('❌ FMP: No data for symbol');
      } else {
        console.log(`✅ FMP Success: $${response.data[0].price}`);
      }
    }
  } catch (error) {
    console.log('❌ FMP Error:', error.message);
  }
  
  // Test the actual service endpoint
  console.log('\n📊 Testing service endpoint...');
  try {
    const response = await axios.get(`https://ai-capital-app7.onrender.com/api/test-stock/${symbol}`);
    console.log('✅ Service endpoint response:', response.data);
  } catch (error) {
    console.log('❌ Service endpoint error:', error.message);
  }
}

testStockAPIs().catch(console.error);
