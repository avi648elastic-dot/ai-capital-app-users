/**
 * 🔍 Stripe Price ID Finder
 * 
 * This script helps you find the correct Price IDs from your Stripe dashboard.
 * 
 * INSTRUCTIONS:
 * 1. Go to your Stripe Dashboard → Products
 * 2. Click on "AI-Capital Premium" product
 * 3. In the "Pricing" section, look for the Price ID (starts with price_)
 * 4. Click on "AI-Capital Premium+" product  
 * 5. In the "Pricing" section, look for the Price ID (starts with price_)
 * 
 * The Price ID should look like: price_1ABC123DEF456GHI789
 * 
 * Once you have both Price IDs, update these values:
 */

const STRIPE_PRICE_IDS = {
  // Replace these with your actual Price IDs from Stripe Dashboard
  PREMIUM_PRICE_ID: 'price_1SHKPDJoluh5VDRCioKOKTOH', // Update this
  PREMIUM_PLUS_PRICE_ID: 'price_1SHKPnJoluh5VDRCYcSxV4jb', // Update this
};

console.log('🔍 Current Price IDs in code:');
console.log('Premium:', STRIPE_PRICE_IDS.PREMIUM_PRICE_ID);
console.log('Premium+:', STRIPE_PRICE_IDS.PREMIUM_PLUS_PRICE_ID);

console.log('\n📋 Next steps:');
console.log('1. Go to Stripe Dashboard → Products');
console.log('2. Find the actual Price IDs for your products');
console.log('3. Update the values above');
console.log('4. Add these to Render environment variables:');
console.log('   STRIPE_PREMIUM_PRICE_ID=your_actual_price_id');
console.log('   STRIPE_PREMIUM_PLUS_PRICE_ID=your_actual_price_id');
