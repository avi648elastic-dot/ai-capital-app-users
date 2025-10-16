/**
 * Remove sample transactions from audit database
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

// Define schema
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

const DeletedTransactionAudit = mongoose.model('DeletedTransactionAudit', DeletedTransactionAuditSchema);

async function removeSampleTransactions() {
  try {
    await connectDB();

    // Find and remove sample transactions
    const sampleTransactions = await DeletedTransactionAudit.find({
      ticker: { $regex: /^SAMPLE-/ }
    });

    console.log(`📊 Found ${sampleTransactions.length} sample transactions to remove`);

    if (sampleTransactions.length > 0) {
      const result = await DeletedTransactionAudit.deleteMany({
        ticker: { $regex: /^SAMPLE-/ }
      });

      console.log(`✅ Successfully removed ${result.deletedCount} sample transactions`);
    } else {
      console.log('ℹ️ No sample transactions found');
    }

    // Check remaining transactions
    const remainingTransactions = await DeletedTransactionAudit.find({});
    console.log(`📋 Remaining real transactions: ${remainingTransactions.length}`);

    if (remainingTransactions.length > 0) {
      console.log('\n📋 Real transactions:');
      remainingTransactions.forEach((trans, index) => {
        const snapshot = trans.beforeSnapshot;
        const pnl = trans.amount - (snapshot.shares * snapshot.entryPrice);
        const pnlPercent = ((trans.amount / (snapshot.shares * snapshot.entryPrice)) - 1) * 100;
        
        console.log(`\n${index + 1}. ${trans.ticker}`);
        console.log(`   Entry: $${snapshot.entryPrice} → Exit: $${(trans.amount / snapshot.shares).toFixed(2)}`);
        console.log(`   P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%)`);
        console.log(`   Reason: ${trans.reason}`);
        console.log(`   Deleted: ${trans.deletedAt.toISOString()}`);
      });
    }

    console.log('\n✅ Sample transactions removed! Now when you delete real stocks from your portfolio, they will appear in the historic transactions.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error removing sample transactions:', error);
    process.exit(1);
  }
}

removeSampleTransactions();
