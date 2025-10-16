#!/usr/bin/env node

/**
 * Script to designate a user as the expert/admin with featured portfolio
 * Run: node scripts/set-expert-user.js avi648elastic@gmail.com
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function setExpertUser(email) {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get User model
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      role: String,
      isExpertTrader: Boolean,
      subscriptionTier: String,
    }));

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    // Update user to expert status
    user.role = 'admin';
    user.isExpertTrader = true;
    user.subscriptionTier = 'premium+'; // Give expert the highest tier
    await user.save();

    console.log('✅ User updated successfully!');
    console.log('📊 User details:');
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Expert Trader:', user.isExpertTrader);
    console.log('   Tier:', user.subscriptionTier);
    
    console.log('\n🎉 This user\'s portfolio will now be featured to all users!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node scripts/set-expert-user.js <email>');
  process.exit(1);
}

setExpertUser(email);

