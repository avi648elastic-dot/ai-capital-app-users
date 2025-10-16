/**
 * Create sample deleted transactions for testing the audit feature
 * This helps users see how the deleted transactions audit works
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

// Define schemas (simplified versions)
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

async function createSampleDeletedTransactions() {
  try {
    await connectDB();

    // Find the expert user
    const expertUser = await User.findOne({ isExpertTrader: true });
    
    if (!expertUser) {
      console.log('❌ No expert user found. Please run the expert setup first.');
      console.log('💡 Run: node backend/scripts/set-expert-user.js');
      process.exit(1);
    }

    console.log('✅ Found expert user:', expertUser.email);

    // Check if sample transactions already exist
    const existingCount = await DeletedTransactionAudit.countDocuments({ 
      userId: expertUser._id,
      ticker: { $in: ['SAMPLE-AAPL', 'SAMPLE-TSLA', 'SAMPLE-MSFT'] }
    });

    if (existingCount > 0) {
      console.log(`ℹ️ Found ${existingCount} existing sample deleted transactions`);
      console.log('💡 Skipping creation to avoid duplicates');
      process.exit(0);
    }

    // Create sample deleted transactions
    const sampleTransactions = [
      {
        userId: expertUser._id,
        transactionId: new mongoose.Types.ObjectId(),
        type: 'delete',
        beforeSnapshot: {
          ticker: 'SAMPLE-AAPL',
          shares: 100,
          entryPrice: 150.00,
          currentPrice: 180.00,
          stopLoss: 140.00,
          takeProfit: 200.00,
          action: 'BUY',
          notes: 'Strong growth potential in services sector. Bought on dip.',
          portfolioType: 'solid',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        },
        amount: 18000, // Exit value: 100 shares * $180
        ticker: 'SAMPLE-AAPL',
        portfolioId: 'solid-1',
        deletedBy: expertUser._id,
        deletedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        reason: 'Take profit target reached. Locked in 20% gain as planned.',
      },
      {
        userId: expertUser._id,
        transactionId: new mongoose.Types.ObjectId(),
        type: 'delete',
        beforeSnapshot: {
          ticker: 'SAMPLE-TSLA',
          shares: 50,
          entryPrice: 200.00,
          currentPrice: 180.00,
          stopLoss: 170.00,
          takeProfit: 250.00,
          action: 'HOLD',
          notes: 'High volatility play. Set tight stop loss.',
          portfolioType: 'risky',
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
        },
        amount: 9000, // Exit value: 50 shares * $180
        ticker: 'SAMPLE-TSLA',
        portfolioId: 'risky-1',
        deletedBy: expertUser._id,
        deletedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        reason: 'Stop loss triggered at $180. Prevented further losses as market turned bearish.',
      },
      {
        userId: expertUser._id,
        transactionId: new mongoose.Types.ObjectId(),
        type: 'delete',
        beforeSnapshot: {
          ticker: 'SAMPLE-MSFT',
          shares: 75,
          entryPrice: 300.00,
          currentPrice: 360.00,
          stopLoss: 280.00,
          takeProfit: 380.00,
          action: 'BUY',
          notes: 'Cloud computing growth story. Long-term hold.',
          portfolioType: 'solid',
          date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
        },
        amount: 27000, // Exit value: 75 shares * $360
        ticker: 'SAMPLE-MSFT',
        portfolioId: 'solid-1',
        deletedBy: expertUser._id,
        deletedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        reason: 'Partial profit taking (sold 75 shares). Still holding remaining position.',
      },
      {
        userId: expertUser._id,
        transactionId: new mongoose.Types.ObjectId(),
        type: 'delete',
        beforeSnapshot: {
          ticker: 'SAMPLE-NVDA',
          shares: 30,
          entryPrice: 400.00,
          currentPrice: 550.00,
          stopLoss: 360.00,
          takeProfit: 600.00,
          action: 'BUY',
          notes: 'AI chip leader. Strong fundamentals and momentum.',
          portfolioType: 'solid',
          date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
        },
        amount: 16500, // Exit value: 30 shares * $550
        ticker: 'SAMPLE-NVDA',
        portfolioId: 'solid-1',
        deletedBy: expertUser._id,
        deletedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        reason: 'Rebalancing portfolio. Took 37.5% profit and reallocated to other opportunities.',
      },
      {
        userId: expertUser._id,
        transactionId: new mongoose.Types.ObjectId(),
        type: 'delete',
        beforeSnapshot: {
          ticker: 'SAMPLE-AMD',
          shares: 200,
          entryPrice: 80.00,
          currentPrice: 70.00,
          stopLoss: 72.00,
          takeProfit: 100.00,
          action: 'SELL',
          notes: 'Competition intensifying. Watch for entry opportunity.',
          portfolioType: 'risky',
          date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) // 20 days ago
        },
        amount: 14000, // Exit value: 200 shares * $70
        ticker: 'SAMPLE-AMD',
        portfolioId: 'risky-1',
        deletedBy: expertUser._id,
        deletedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
        reason: 'Cut losses early. Fundamentals weakening, better opportunities elsewhere.',
      }
    ];

    // Insert sample transactions
    const result = await DeletedTransactionAudit.insertMany(sampleTransactions);
    
    console.log('✅ Successfully created sample deleted transactions!');
    console.log(`📊 Created ${result.length} sample closed positions for expert user`);
    console.log('\n🎓 Sample Transactions Summary:');
    result.forEach((trans, index) => {
      const snapshot = trans.beforeSnapshot;
      const pnl = trans.amount - (snapshot.shares * snapshot.entryPrice);
      const pnlPercent = ((trans.amount / (snapshot.shares * snapshot.entryPrice)) - 1) * 100;
      
      console.log(`\n${index + 1}. ${trans.ticker}`);
      console.log(`   Entry: $${snapshot.entryPrice} → Exit: $${(trans.amount / snapshot.shares).toFixed(2)}`);
      console.log(`   P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%)`);
      console.log(`   Reason: ${trans.reason}`);
    });

    console.log('\n✅ You can now view these transactions:');
    console.log('   1. Go to Expert Portfolio page (/expert-portfolio)');
    console.log('   2. Scroll down to "Expert\'s Closed Positions" section');
    console.log('   3. You\'ll see all 5 sample transactions with full details');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample transactions:', error);
    process.exit(1);
  }
}

createSampleDeletedTransactions();
