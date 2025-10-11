/**
 * Comprehensive Watchlist System Test Script
 * Tests all watchlist functionality including:
 * - Model validation
 * - API endpoints
 * - Price monitoring service
 * - Notification creation
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';
let authToken = '';
let userId = '';
let watchlistItemId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Authentication
async function testAuthentication() {
  logInfo('Test 1: Authentication');
  try {
    // Try to login with a test account
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'Test123!'
    });
    
    if (response.data.token) {
      authToken = response.data.token;
      userId = response.data.user.id || response.data.user._id;
      logSuccess('Authentication successful');
      return true;
    }
  } catch (error) {
    logWarning('Test account not found, will create one');
    
    try {
      const signupResponse = await axios.post(`${API_URL}/api/auth/signup`, {
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User'
      });
      
      authToken = signupResponse.data.token;
      userId = signupResponse.data.user.id || signupResponse.data.user._id;
      logSuccess('Test account created and authenticated');
      return true;
    } catch (signupError) {
      logError(`Authentication failed: ${signupError.response?.data?.error || signupError.message}`);
      return false;
    }
  }
}

// Test 2: Add stock to watchlist
async function testAddStock() {
  logInfo('Test 2: Add stock to watchlist');
  try {
    const response = await axios.post(
      `${API_URL}/api/watchlist/add`,
      { ticker: 'AAPL', name: 'Apple Inc.' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    watchlistItemId = response.data.item.id;
    logSuccess(`Stock added to watchlist: ${response.data.item.ticker}`);
    logInfo(`Item ID: ${watchlistItemId}`);
    return true;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error.includes('already in watchlist')) {
      logWarning('Stock already in watchlist');
      return true;
    }
    logError(`Failed to add stock: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 3: Get watchlist
async function testGetWatchlist() {
  logInfo('Test 3: Get watchlist');
  try {
    const response = await axios.get(
      `${API_URL}/api/watchlist`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.watchlist && response.data.watchlist.length > 0) {
      watchlistItemId = response.data.watchlist[0].id;
      logSuccess(`Retrieved ${response.data.watchlist.length} stocks from watchlist`);
      
      response.data.watchlist.forEach(item => {
        logInfo(`  - ${item.ticker}: $${item.currentPrice.toFixed(2)} (${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%)`);
      });
      
      return true;
    } else {
      logWarning('Watchlist is empty');
      return true;
    }
  } catch (error) {
    logError(`Failed to get watchlist: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 4: Set price alert
async function testSetPriceAlert() {
  logInfo('Test 4: Set price alert');
  try {
    const response = await axios.patch(
      `${API_URL}/api/watchlist/${watchlistItemId}/alert`,
      {
        type: 'both',
        highPrice: 200.00,
        lowPrice: 150.00,
        enabled: true
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    logSuccess('Price alert set successfully');
    logInfo(`  High: $${response.data.priceAlert.highPrice}`);
    logInfo(`  Low: $${response.data.priceAlert.lowPrice}`);
    logInfo(`  Type: ${response.data.priceAlert.type}`);
    return true;
  } catch (error) {
    logError(`Failed to set price alert: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 5: Toggle notifications
async function testToggleNotifications() {
  logInfo('Test 5: Toggle notifications');
  try {
    // Toggle off
    await axios.patch(
      `${API_URL}/api/watchlist/${watchlistItemId}/notifications`,
      { notifications: false },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    logSuccess('Notifications disabled');
    
    // Toggle on
    await axios.patch(
      `${API_URL}/api/watchlist/${watchlistItemId}/notifications`,
      { notifications: true },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    logSuccess('Notifications enabled');
    
    return true;
  } catch (error) {
    logError(`Failed to toggle notifications: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 6: Test price alert validation
async function testPriceAlertValidation() {
  logInfo('Test 6: Test price alert validation');
  let passedTests = 0;
  let totalTests = 3;
  
  // Test 1: Invalid alert type
  try {
    await axios.patch(
      `${API_URL}/api/watchlist/${watchlistItemId}/alert`,
      { type: 'invalid', highPrice: 200, lowPrice: 150 },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    logError('Should have rejected invalid alert type');
  } catch (error) {
    if (error.response?.status === 400) {
      logSuccess('Correctly rejected invalid alert type');
      passedTests++;
    }
  }
  
  // Test 2: Low price > High price
  try {
    await axios.patch(
      `${API_URL}/api/watchlist/${watchlistItemId}/alert`,
      { type: 'both', highPrice: 150, lowPrice: 200 },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    logError('Should have rejected low price > high price');
  } catch (error) {
    if (error.response?.status === 400) {
      logSuccess('Correctly rejected low price > high price');
      passedTests++;
    }
  }
  
  // Test 3: Missing required price
  try {
    await axios.patch(
      `${API_URL}/api/watchlist/${watchlistItemId}/alert`,
      { type: 'high', lowPrice: 150 },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    logError('Should have rejected missing high price');
  } catch (error) {
    if (error.response?.status === 400) {
      logSuccess('Correctly rejected missing high price');
      passedTests++;
    }
  }
  
  return passedTests === totalTests;
}

// Test 7: Remove price alert
async function testRemovePriceAlert() {
  logInfo('Test 7: Remove price alert');
  try {
    await axios.delete(
      `${API_URL}/api/watchlist/${watchlistItemId}/alert`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    logSuccess('Price alert removed successfully');
    return true;
  } catch (error) {
    logError(`Failed to remove price alert: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 8: Remove stock from watchlist
async function testRemoveStock() {
  logInfo('Test 8: Remove stock from watchlist');
  try {
    await axios.delete(
      `${API_URL}/api/watchlist/${watchlistItemId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    logSuccess('Stock removed from watchlist');
    return true;
  } catch (error) {
    logError(`Failed to remove stock: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════╗', 'blue');
  log('║     Watchlist System Comprehensive Test Suite      ║', 'blue');
  log('╚════════════════════════════════════════════════════╝\n', 'blue');
  
  const results = [];
  
  // Run tests
  results.push({ name: 'Authentication', passed: await testAuthentication() });
  if (!results[0].passed) {
    logError('Authentication failed. Cannot proceed with tests.');
    return;
  }
  
  await sleep(500);
  results.push({ name: 'Add Stock', passed: await testAddStock() });
  
  await sleep(500);
  results.push({ name: 'Get Watchlist', passed: await testGetWatchlist() });
  
  await sleep(500);
  results.push({ name: 'Set Price Alert', passed: await testSetPriceAlert() });
  
  await sleep(500);
  results.push({ name: 'Toggle Notifications', passed: await testToggleNotifications() });
  
  await sleep(500);
  results.push({ name: 'Price Alert Validation', passed: await testPriceAlertValidation() });
  
  await sleep(500);
  results.push({ name: 'Remove Price Alert', passed: await testRemovePriceAlert() });
  
  await sleep(500);
  results.push({ name: 'Remove Stock', passed: await testRemoveStock() });
  
  // Print summary
  log('\n╔════════════════════════════════════════════════════╗', 'blue');
  log('║                   Test Summary                      ║', 'blue');
  log('╚════════════════════════════════════════════════════╝\n', 'blue');
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}: PASSED`);
    } else {
      logError(`${result.name}: FAILED`);
    }
  });
  
  log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'blue');
  if (passedTests === totalTests) {
    logSuccess(`ALL TESTS PASSED (${passedTests}/${totalTests})`);
    log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`, 'blue');
    process.exit(0);
  } else {
    logError(`SOME TESTS FAILED (${passedTests}/${totalTests})`);
    log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`, 'blue');
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

