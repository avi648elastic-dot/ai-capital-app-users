// MongoDB script to clean up inactive portfolios
// Run this script with: mongo your_database_name scripts/cleanup-inactive-portfolios.js

// Connect to your database
use aicapital;

print("🔍 Analyzing portfolio collection...");

// Get collection stats
const totalPortfolios = db.portfolios.countDocuments();
print(`📊 Total portfolios: ${totalPortfolios}`);

// Analyze different criteria for inactive portfolios
print("\n📈 Analyzing inactive portfolio criteria:");

// 1. Portfolios with SELL action
const sellActionCount = db.portfolios.countDocuments({ "action": "SELL" });
print(`🔴 Portfolios with SELL action: ${sellActionCount}`);

// 2. Portfolios not updated in last 30 days
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const oldUpdatedCount = db.portfolios.countDocuments({ "updatedAt": { "$lt": thirtyDaysAgo } });
print(`📅 Portfolios not updated in 30 days: ${oldUpdatedCount}`);

// 3. Portfolios with zero volatility
const zeroVolatilityCount = db.portfolios.countDocuments({ "volatility": 0 });
print(`📉 Portfolios with zero volatility: ${zeroVolatilityCount}`);

// 4. Portfolios with very old creation dates (more than 90 days)
const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
const oldCreatedCount = db.portfolios.countDocuments({ "createdAt": { "$lt": ninetyDaysAgo } });
print(`🗓️ Portfolios created more than 90 days ago: ${oldCreatedCount}`);

// 5. Check for test users (common patterns)
const testUserPatterns = [
  { "userId": { "$regex": /test/i } },
  { "userId": { "$regex": /demo/i } },
  { "ticker": { "$regex": /TEST/i } },
  { "ticker": { "$regex": /DEMO/i } }
];

let testPortfoliosCount = 0;
for (let pattern of testUserPatterns) {
  testPortfoliosCount += db.portfolios.countDocuments(pattern);
}
print(`🧪 Potential test portfolios: ${testPortfoliosCount}`);

print("\n🎯 RECOMMENDED CLEANUP ACTIONS:");
print("=====================================");

// Show sample documents that would be deleted
print("\n📋 Sample SELL action portfolios:");
db.portfolios.find({ "action": "SELL" }).limit(3).forEach(printjson);

print("\n📋 Sample old portfolios (not updated in 30 days):");
db.portfolios.find({ "updatedAt": { "$lt": thirtyDaysAgo } }).limit(3).forEach(printjson);

print("\n⚠️  IMPORTANT: Review the samples above before proceeding!");
print("⚠️  Make sure you want to delete these portfolios!");
print("\n🔧 To proceed with deletion, uncomment the delete operations below:");

// UNCOMMENT THESE LINES TO ACTUALLY DELETE - BE VERY CAREFUL!
/*
print("\n🗑️  Starting cleanup process...");

// Delete portfolios with SELL action
const deletedSell = db.portfolios.deleteMany({ "action": "SELL" });
print(`✅ Deleted ${deletedSell.deletedCount} portfolios with SELL action`);

// Delete portfolios not updated in 30 days
const deletedOld = db.portfolios.deleteMany({ "updatedAt": { "$lt": thirtyDaysAgo } });
print(`✅ Deleted ${deletedOld.deletedCount} old portfolios`);

// Delete portfolios with zero volatility (optional - be careful with this one)
// const deletedZeroVol = db.portfolios.deleteMany({ "volatility": 0 });
// print(`✅ Deleted ${deletedZeroVol.deletedCount} portfolios with zero volatility`);

// Delete test portfolios (optional)
// const deletedTest = db.portfolios.deleteMany({ 
//   "$or": [
//     { "userId": { "$regex": /test/i } },
//     { "userId": { "$regex": /demo/i } },
//     { "ticker": { "$regex": /TEST/i } },
//     { "ticker": { "$regex": /DEMO/i } }
//   ]
// });
// print(`✅ Deleted ${deletedTest.deletedCount} test portfolios`);

print("\n🎉 Cleanup completed!");
print("📊 Final portfolio count:", db.portfolios.countDocuments());
*/

print("\n💡 To run this script:");
print("1. Save this file as cleanup-inactive-portfolios.js");
print("2. Run: mongo your_database_name cleanup-inactive-portfolios.js");
print("3. Review the output and uncomment delete operations if satisfied");
print("4. Re-run the script to execute deletions");
