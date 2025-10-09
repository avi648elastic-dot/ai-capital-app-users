// Cleanup inactive portfolios from the past 4 days
// Run with: mongo aicapital cleanup-inactive.js

use aicapital;

print("🔍 Starting cleanup of inactive portfolios...");

// Calculate 4 days ago
const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
print(`📅 Looking for portfolios not updated since: ${fourDaysAgo}`);

// Get total count first
const totalPortfolios = db.portfolios.countDocuments();
print(`📊 Total portfolios before cleanup: ${totalPortfolios}`);

// Find inactive portfolios (not updated in last 4 days)
const inactivePortfolios = db.portfolios.find({ 
  "updatedAt": { "$lt": fourDaysAgo } 
});

// Count how many will be deleted
const inactiveCount = db.portfolios.countDocuments({ 
  "updatedAt": { "$lt": fourDaysAgo } 
});

print(`🔴 Found ${inactiveCount} inactive portfolios (not updated in 4 days)`);

if (inactiveCount > 0) {
  print("\n📋 Sample inactive portfolios that will be deleted:");
  db.portfolios.find({ 
    "updatedAt": { "$lt": fourDaysAgo } 
  }).limit(5).forEach(function(doc) {
    print(`- ${doc.ticker} (${doc.shares} shares) - Last updated: ${doc.updatedAt} - User: ${doc.userId}`);
  });
  
  print("\n🗑️  Deleting inactive portfolios...");
  
  // Delete the inactive portfolios
  const result = db.portfolios.deleteMany({ 
    "updatedAt": { "$lt": fourDaysAgo } 
  });
  
  print(`✅ Successfully deleted ${result.deletedCount} inactive portfolios`);
  
  const remainingPortfolios = db.portfolios.countDocuments();
  print(`📊 Total portfolios after cleanup: ${remainingPortfolios}`);
  print(`🎉 Cleanup completed! Removed ${result.deletedCount} inactive portfolios.`);
  
} else {
  print("✅ No inactive portfolios found. All portfolios have been updated in the last 4 days.");
}

print("\n✨ Cleanup process finished!");
