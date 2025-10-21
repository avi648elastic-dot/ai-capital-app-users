/**
 * Email Service Testing Script
 * 
 * Usage:
 *   node backend/scripts/test-email.js
 * 
 * This script tests the email service configuration and sends test emails.
 */

require('dotenv').config();

async function testEmailService() {
  console.log('🧪 Testing Email Service Configuration\n');
  console.log('================================================');
  
  // Check environment variables
  console.log('\n📋 Environment Variables:');
  console.log('  EMAIL_PROVIDER:', process.env.EMAIL_PROVIDER || 'gmail (default)');
  console.log('  EMAIL_FROM:', process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Not set');
  console.log('  EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME || 'AiCapital');
  console.log('  EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
  console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set');
  
  if (process.env.EMAIL_PROVIDER === 'sendgrid') {
    console.log('  SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Not set');
  }
  
  if (process.env.EMAIL_PROVIDER === 'ses' || process.env.EMAIL_PROVIDER === 'aws-ses') {
    console.log('  AWS_SES_HOST:', process.env.AWS_SES_HOST || 'Not set');
    console.log('  AWS_SES_ACCESS_KEY:', process.env.AWS_SES_ACCESS_KEY ? '✅ Set' : '❌ Not set');
    console.log('  AWS_SES_SECRET_KEY:', process.env.AWS_SES_SECRET_KEY ? '✅ Set' : '❌ Not set');
  }
  
  // Check for missing configuration
  const provider = process.env.EMAIL_PROVIDER || 'gmail';
  let hasRequiredConfig = false;
  
  if (provider === 'gmail') {
    hasRequiredConfig = !!(process.env.EMAIL_USER && (process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS));
  } else if (provider === 'sendgrid') {
    hasRequiredConfig = !!process.env.SENDGRID_API_KEY;
  } else if (provider === 'ses' || provider === 'aws-ses') {
    hasRequiredConfig = !!(process.env.AWS_SES_ACCESS_KEY && process.env.AWS_SES_SECRET_KEY);
  } else if (provider === 'smtp' || provider === 'custom') {
    hasRequiredConfig = !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  }
  
  console.log('\n📊 Configuration Status:');
  if (hasRequiredConfig) {
    console.log('  ✅ All required environment variables are set');
  } else {
    console.log('  ❌ Missing required environment variables');
    console.log('\n❗ Please set up your email configuration in the .env file');
    console.log('   See EMAIL_SETUP_GUIDE.md for detailed instructions\n');
    process.exit(1);
  }
  
  // Test email service initialization
  console.log('\n🔧 Testing Email Service...');
  
  try {
    // Import after environment is loaded
    const emailService = require('../dist/services/emailService').default;
    
    // Wait a bit for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const status = emailService.getStatus();
    console.log('  Provider:', status.provider);
    console.log('  From Address:', status.fromAddress);
    console.log('  From Name:', status.fromName);
    console.log('  Initialized:', status.initialized ? '✅ Yes' : '❌ No');
    
    if (!status.initialized) {
      console.log('\n❌ Email service failed to initialize');
      console.log('   Check your credentials and configuration\n');
      process.exit(1);
    }
    
    // Prompt for test email
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('\n================================================\n');
    
    readline.question('Enter your email address to receive a test email: ', async (testEmail) => {
      if (!testEmail || !testEmail.includes('@')) {
        console.log('❌ Invalid email address');
        readline.close();
        process.exit(1);
      }
      
      console.log('\n📧 Sending test welcome email to:', testEmail);
      
      try {
        const success = await emailService.sendWelcomeEmail({
          name: 'Test User',
          email: testEmail
        });
        
        if (success) {
          console.log('\n✅ Test email sent successfully!');
          console.log('   Check your inbox (and spam folder) for the email');
        } else {
          console.log('\n❌ Failed to send test email');
          console.log('   Check the logs above for error details');
        }
      } catch (error) {
        console.log('\n❌ Error sending test email:', error.message);
      }
      
      console.log('\n================================================');
      console.log('\n✅ Email service test complete!\n');
      
      readline.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.log('\n❌ Error testing email service:', error.message);
    console.log('   Make sure to build the project first: npm run build\n');
    process.exit(1);
  }
}

// Run the test
testEmailService().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

