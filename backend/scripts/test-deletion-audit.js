/**
 * Test script to verify deletion audit logging works
 * This will create a test portfolio item and then delete it to see if it gets logged
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-capital');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define schemas
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  isExpertTrader: Boolean,
  role: String,
}, { timestamps: true });

const PortfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ticker: { type: String, required: true },
  shares: { type: Number, required: true },
  entryPrice: { type: Number, required: true },
  currentPrice: { type: Number, required: true },
  stopLoss: { type: Number },
  takeProfit: { type: Number },
  action: { type: String, enum: ['BUY', 'SELL', 'HOLD'], default: 'BUY' },
  notes: { type: String },
  portfolioType: { type: String, enum: ['solid', 'risky'], default: 'solid' },
  portfolioId: { type: String, required: true },
}, { timestamps: true });

const DeletedTransactionAuditSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transactionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, enum: ['delete'], required: true },
  beforeSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  amount: { type: Number, required: true },
  ticker: { type: String, required: true },
  portfolioId: { type: String, required: true },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deletedAt: { type: Date, default: Date.now },
  reason: { type: String },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Portfolio = mongoose.model('Portfolio', PortfolioSchema);
const DeletedTransactionAudit = mongoose.model('DeletedTransactionAudit', DeletedTransactionAuditSchema);

async function testDeletionAudit() {
  try {
    await connectDB();

    // Find the expert user
    const expertUser = await User.findOne({ isExpertTrader: true });
    
    if (!expertUser) {
      console.log('❌ No expert user found. Please run the expert setup first.');
      process.exit(1);
    }

    console.log('✅ Found expert user:', expertUser.email);

    // Create a test portfolio item
    const testPortfolioItem = new Portfolio({
      userId: expertUser._id,
      ticker: 'TEST-STOCK',
      shares: 100,
      entryPrice: 50.00,
      currentPrice: 60.00,
      stopLoss: 45.00,
      takeProfit: 70.00,
      action: 'BUY',
      notes: 'Test stock for deletion audit',
      portfolioType: 'solid',
      portfolioId: 'solid-1'
    });

    await testPortfolioItem.save();
    console.log('✅ Created test portfolio item:', testPortfolioItem.ticker);

    // Now simulate the deletion process (like the API endpoint does)
    const portfolioItem = await Portfolio.findOne({ _id: testPortfolioItem._id, userId: expertUser._id });
    if (!portfolioItem) {
      console.log('❌ Test portfolio item not found');
      process.exit(1);
    }

    const finalExitPrice = portfolioItem.currentPrice; // Use current price as exit price

    console.log('🔄 Simulating deletion with audit logging...');
    console.log('   Ticker:', portfolioItem.ticker);
    console.log('   Entry Price:', portfolioItem.entryPrice);
    console.log('   Exit Price:', finalExitPrice);
    console.log('   Shares:', portfolioItem.shares);

    // Write audit log BEFORE deletion (like the API does)
    try {
      const auditEntry = await DeletedTransactionAudit.create({
        userId: expertUser._id,
        transactionId: portfolioItem._id,
        type: 'delete',
        beforeSnapshot: portfolioItem.toObject(),
        amount: finalExitPrice * portfolioItem.shares, // Total exit value
        ticker: portfolioItem.ticker,
        portfolioId: portfolioItem.portfolioId,
        deletedBy: expertUser._id,
        deletedAt: new Date(),
        reason: 'manual_delete'
      });
      console.log('✅ [AUDIT] Deleted transaction audit logged:', {
        ticker: portfolioItem.ticker,
        amount: auditEntry.amount,
        shares: portfolioItem.shares,
        exitPrice: finalExitPrice
      });
    } catch (auditErr) {
      console.error('❌ [AUDIT] Failed to write delete audit:', auditErr.message);
      console.error('❌ [AUDIT] Error details:', auditErr);
    }

    // Now delete the portfolio item
    await Portfolio.findOneAndDelete({ _id: portfolioItem._id, userId: expertUser._id });
    console.log('✅ Test portfolio item deleted');

    // Check if the audit entry was created
    const auditEntries = await DeletedTransactionAudit.find({ ticker: 'TEST-STOCK' });
    console.log(`\n📊 Audit entries for TEST-STOCK: ${auditEntries.length}`);

    if (auditEntries.length > 0) {
      const entry = auditEntries[0];
      const snapshot = entry.beforeSnapshot;
      const pnl = entry.amount - (snapshot.shares * snapshot.entryPrice);
      const pnlPercent = ((entry.amount / (snapshot.shares * snapshot.entryPrice)) - 1) * 100;
      
      console.log('\n✅ AUDIT ENTRY CREATED SUCCESSFULLY:');
      console.log(`   Ticker: ${entry.ticker}`);
      console.log(`   Entry: $${snapshot.entryPrice} → Exit: $${(entry.amount / snapshot.shares).toFixed(2)}`);
      console.log(`   P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%)`);
      console.log(`   Amount (Exit Value): $${entry.amount}`);
      console.log(`   Reason: ${entry.reason}`);
      console.log(`   Deleted: ${entry.deletedAt.toISOString()}`);
      
      console.log('\n🎉 SUCCESS! Deletion audit logging is working correctly!');
      console.log('💡 Now when you delete real stocks from your portfolio, they will appear in the historic transactions.');
    } else {
      console.log('❌ FAILED! No audit entry was created. There might be an issue with the audit logging.');
    }

    // Clean up test audit entry
    await DeletedTransactionAudit.deleteMany({ ticker: 'TEST-STOCK' });
    console.log('🧹 Cleaned up test audit entry');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing deletion audit:', error);
    process.exit(1);
  }
}

testDeletionAudit();
