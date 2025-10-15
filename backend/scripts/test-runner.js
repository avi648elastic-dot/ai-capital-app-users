#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Starting AI Capital Test Suite...\n');

// Test configuration
const testConfig = {
  unit: {
    pattern: 'tests/services/**/*.test.ts',
    description: 'Unit Tests (Services)'
  },
  integration: {
    pattern: 'tests/api/**/*.test.ts',
    description: 'Integration Tests (API)'
  },
  all: {
    pattern: 'tests/**/*.test.ts',
    description: 'All Tests'
  }
};

// Parse command line arguments
const testType = process.argv[2] || 'all';
const config = testConfig[testType];

if (!config) {
  console.error('❌ Invalid test type. Available options: unit, integration, all');
  process.exit(1);
}

console.log(`📋 Running: ${config.description}`);
console.log(`🔍 Pattern: ${config.pattern}\n`);

// Run Jest with the specified pattern
const jestProcess = spawn('npx', [
  'jest',
  config.pattern,
  '--verbose',
  '--coverage',
  '--detectOpenHandles',
  '--forceExit'
], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

jestProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed.');
    process.exit(code);
  }
});

jestProcess.on('error', (error) => {
  console.error('❌ Failed to start test process:', error);
  process.exit(1);
});
