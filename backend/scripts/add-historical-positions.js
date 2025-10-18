const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./dist/models/User');
const DeletedTransactionAudit = require('./dist/models/DeletedTransactionAudit');

// Historical positions data from the images
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

async function addHistoricalPositions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the expert trader
    const expertUser = await User.findOne({ isExpertTrader: true });
    if (!expertUser) {
      console.log('❌ No expert trader found. Creating one...');
      // Create expert trader if doesn't exist
      const newExpert = new User({
        name: 'Expert Trader',
        email: 'expert@aicapital.com',
        isExpertTrader: true,
        subscriptionActive: true,
        subscriptionTier: 'premium+',
        onboardingCompleted: true,
        reputation: 0,
        totalRealizedPnL: 0,
        totalPositionsClosed: 0
      });
      await newExpert.save();
      expertUser = newExpert;
      console.log('✅ Created expert trader');
    }

    console.log('🎯 Found expert trader:', expertUser.email);

    // Add each historical position
    for (const position of historicalPositions) {
      const beforeSnapshot = {
        ticker: position.ticker,
        shares: position.shares,
        entryPrice: position.entryPrice,
        currentPrice: position.exitPrice,
        stopLoss: position.entryPrice * 0.92, // 8% stop loss
        takeProfit: position.entryPrice * 1.15, // 15% take profit
        portfolioId: 'expert-portfolio',
        action: 'SELL',
        reason: 'Position closed',
        color: 'green'
      };

      const auditEntry = new DeletedTransactionAudit({
        userId: expertUser._id,
        type: 'delete',
        beforeSnapshot: beforeSnapshot,
        amount: position.exitPrice * position.shares, // Total exit value
        ticker: position.ticker,
        portfolioId: 'expert-portfolio',
        deletedBy: expertUser._id,
        deletedAt: position.date,
        reason: position.reason
      });

      await auditEntry.save();
      console.log(`✅ Added historical position: ${position.ticker} - P&L: $${position.pnl} (${position.pnlPercent}%)`);
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
    console.error('❌ Error adding historical positions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
addHistoricalPositions();
