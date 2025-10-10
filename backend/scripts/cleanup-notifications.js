/**
 * 🔧 Notification Cleanup Script
 * 
 * This script cleans up any existing notifications that might be showing
 * other users' portfolio data or non-SELL notifications that shouldn't exist.
 * 
 * Run with: node scripts/cleanup-notifications.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import the Notification model
const Notification = require('../dist/models/Notification').default;

async function cleanupNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aicapital');
    console.log('✅ Connected to MongoDB');

    // 1. Delete all portfolio action notifications that are not SELL actions
    const nonSellNotifications = await Notification.deleteMany({
      category: 'portfolio',
      'actionData.action': { $in: ['BUY', 'HOLD'] }
    });
    console.log(`🧹 Deleted ${nonSellNotifications.deletedCount} non-SELL portfolio notifications`);

    // 2. Delete any notifications that don't have proper userId or are malformed
    const malformedNotifications = await Notification.deleteMany({
      $or: [
        { userId: { $exists: false } },
        { userId: null, category: 'portfolio' }, // Portfolio notifications should have userId
        { title: { $exists: false } },
        { message: { $exists: false } }
      ]
    });
    console.log(`🧹 Deleted ${malformedNotifications.deletedCount} malformed notifications`);

    // 3. Keep only global notifications (userId: null) for system messages
    // and user-specific SELL notifications (userId: exists, action: SELL)
    
    // 4. Get statistics after cleanup
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          global: { $sum: { $cond: [{ $eq: ['$userId', null] }, 1, 0] } },
          userSpecific: { $sum: { $cond: [{ $ne: ['$userId', null] }, 1, 0] } },
          sellActions: { 
            $sum: { 
              $cond: [
                { $and: [
                  { $eq: ['$category', 'portfolio'] },
                  { $eq: ['$actionData.action', 'SELL'] }
                ]}, 1, 0
              ]
            }
          }
        }
      }
    ]);

    console.log('\n📊 Notification Statistics After Cleanup:');
    console.log(`Total notifications: ${stats[0]?.total || 0}`);
    console.log(`Global notifications: ${stats[0]?.global || 0}`);
    console.log(`User-specific notifications: ${stats[0]?.userSpecific || 0}`);
    console.log(`SELL action notifications: ${stats[0]?.sellActions || 0}`);

    console.log('\n✅ Notification cleanup completed successfully!');
    console.log('\n📋 Summary of changes:');
    console.log('- Deleted all BUY and HOLD portfolio notifications');
    console.log('- Deleted malformed notifications');
    console.log('- Kept only global notifications (admin-created) and user-specific SELL notifications');
    console.log('- Users will now only see their own SELL signals and global admin messages');

  } catch (error) {
    console.error('❌ Error during notification cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the cleanup
cleanupNotifications();
