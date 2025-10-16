/**
 * Check what's currently in the audit database
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
const DeletedTransactionAudit = mongoose.model('DeletedTransactionAudit', DeletedTransactionAuditSchema);

async function checkAuditData() {
  try {
    await connectDB();

    // Find all users
    const users = await User.find({});
    console.log('👥 Users in database:');
    users.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user._id}) - Expert: ${user.isExpertTrader}`);
    });

    // Find all deleted transactions
    const allTransactions = await DeletedTransactionAudit.find({}).sort({ deletedAt: -1 });
    console.log(`\n📊 Total deleted transactions in audit: ${allTransactions.length}`);

    if (allTransactions.length > 0) {
      console.log('\n📋 All deleted transactions:');
      allTransactions.forEach((trans, index) => {
        const snapshot = trans.beforeSnapshot;
        const pnl = trans.amount - (snapshot.shares * snapshot.entryPrice);
        const pnlPercent = ((trans.amount / (snapshot.shares * snapshot.entryPrice)) - 1) * 100;
        
        console.log(`\n${index + 1}. ${trans.ticker} (${trans.type})`);
        console.log(`   User ID: ${trans.userId}`);
        console.log(`   Entry: $${snapshot.entryPrice} → Exit: $${(trans.amount / snapshot.shares).toFixed(2)}`);
        console.log(`   P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%)`);
        console.log(`   Reason: ${trans.reason}`);
        console.log(`   Deleted: ${trans.deletedAt.toISOString()}`);
        console.log(`   Is Sample: ${trans.ticker.startsWith('SAMPLE-')}`);
      });
    }

    // Check for real transactions (not samples)
    const realTransactions = allTransactions.filter(trans => !trans.ticker.startsWith('SAMPLE-'));
    console.log(`\n✅ Real transactions (non-sample): ${realTransactions.length}`);

    // Check for sample transactions
    const sampleTransactions = allTransactions.filter(trans => trans.ticker.startsWith('SAMPLE-'));
    console.log(`📝 Sample transactions: ${sampleTransactions.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking audit data:', error);
    process.exit(1);
  }
}

checkAuditData();
