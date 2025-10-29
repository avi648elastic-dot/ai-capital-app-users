const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB - USE ENVIRONMENT VARIABLE
const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/aicapital';
mongoose.connect(mongoUri);

// Define schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  isExpertTrader: Boolean,
  reputation: Number,
  totalRealizedPnL: Number,
  totalPositionsClosed: Number
});

const deletedTransactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: String,
  beforeSnapshot: mongoose.Schema.Types.Mixed,
  amount: Number,
  ticker: String,
  portfolioId: String,
  deletedBy: mongoose.Schema.Types.ObjectId,
  deletedAt: Date,
  reason: String
});

const User = mongoose.model('User', userSchema);
const DeletedTransactionAudit = mongoose.model('DeletedTransactionAudit', deletedTransactionSchema);

// Historical positions data
const historicalPositions = [
  {
    ticker: 'APM',
    shares: 500,
    entryPrice: 0.86,
    exitPrice: 2.25,
    pnl: 695.00,
    pnlPercent: 161.63,
    date: new Date('2025-10-01'),
    reason: 'manual_close'
  },
  {
    ticker: 'VVOS',
    shares: 1000,
    entryPrice: 2.20,
    exitPrice: 3.19,
    pnl: 990.00,
    pnlPercent: 45.00,
    date: new Date('2025-10-06'),
    reason: 'manual_close'
  },
  {
    ticker: 'BTG',
    shares: 1500,
    entryPrice: 3.35,
    exitPrice: 5.36,
    pnl: 3015.00,
    pnlPercent: 60.00,
    date: new Date('2025-10-06'),
    reason: 'manual_close'
  },
  {
    ticker: 'HST',
    shares: 1000,
    entryPrice: 14.64,
    exitPrice: 16.49,
    pnl: 1850.00,
    pnlPercent: 12.64,
    date: new Date('2025-10-16'),
    reason: 'manual_close'
  },
  {
    ticker: 'AQST',
    shares: 250,
    entryPrice: 6.00,
    exitPrice: 7.31,
    pnl: 327.50,
    pnlPercent: 21.83,
    date: new Date('2025-10-16'),
    reason: 'manual_close'
  },
  {
    ticker: 'UEC',
    shares: 500,
    entryPrice: 13.71,
    exitPrice: 17.37,
    pnl: 1830.00,
    pnlPercent: 26.70,
    date: new Date('2025-10-16'),
    reason: 'manual_close'
  }
];

async function addHistoricalData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Find or create expert trader
    let expertUser = await User.findOne({ isExpertTrader: true });
    
    if (!expertUser) {
      console.log('👤 Creating expert trader...');
      expertUser = new User({
        name: 'Expert Trader',
        email: 'expert@aicapital.com',
        isExpertTrader: true,
        reputation: 0,
        totalRealizedPnL: 0,
        totalPositionsClosed: 0
      });
      await expertUser.save();
      console.log('✅ Expert trader created');
    } else {
      console.log('👤 Found existing expert trader:', expertUser.email);
    }

    console.log('📊 Adding historical positions...');
    
    // Add each historical position
    for (const position of historicalPositions) {
      const beforeSnapshot = {
        ticker: position.ticker,
        shares: position.shares,
        entryPrice: position.entryPrice,
        currentPrice: position.exitPrice,
        stopLoss: position.entryPrice * 0.92,
        takeProfit: position.entryPrice * 1.15,
        portfolioId: 'expert-portfolio',
        action: 'SELL',
        reason: 'Position closed',
        color: 'green'
      };

      const auditEntry = new DeletedTransactionAudit({
        userId: expertUser._id,
        type: 'delete',
        beforeSnapshot: beforeSnapshot,
        amount: position.exitPrice * position.shares,
        ticker: position.ticker,
        portfolioId: 'expert-portfolio',
        deletedBy: expertUser._id,
        deletedAt: position.date,
        reason: position.reason
      });

      await auditEntry.save();
      console.log(`✅ Added: ${position.ticker} - P&L: $${position.pnl} (${position.pnlPercent}%)`);
    }

    // Update expert trader's reputation
    const totalPnL = historicalPositions.reduce((sum, pos) => sum + pos.pnl, 0);
    expertUser.reputation = totalPnL;
    expertUser.totalRealizedPnL = totalPnL;
    expertUser.totalPositionsClosed = historicalPositions.length;
    await expertUser.save();

    console.log(`🎉 Successfully added ${historicalPositions.length} historical positions`);
    console.log(`💰 Total P&L: $${totalPnL.toFixed(2)}`);
    console.log(`📊 Total positions closed: ${historicalPositions.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

addHistoricalData();




