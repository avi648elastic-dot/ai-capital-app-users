import express from 'express';
import Portfolio from '../models/Portfolio';
import User from '../models/User';
import DeletedTransactionAudit from '../models/DeletedTransactionAudit';
import { authenticateToken } from '../middleware/auth';
import { stockDataService } from '../services/stockDataService';
import { loggerService } from '../services/loggerService';
import { expertPortfolioCache, deletedTransactionsCache } from '../middleware/cache';

const router = express.Router();

/**
 * Get expert trader's portfolio
 * GET /api/expert-portfolio
 */
router.get('/', authenticateToken, expertPortfolioCache, async (req, res) => {
  try {
    loggerService.info('🎓 [EXPERT PORTFOLIO] Fetching expert portfolio');

    // Find the expert trader
    const expertUser = await User.findOne({ isExpertTrader: true });
    
    if (!expertUser) {
      return res.status(404).json({
        success: false,
        error: 'No expert trader found',
        message: 'Expert portfolio is not available at this time'
      });
    }

    // Get expert's portfolio
    const expertPortfolio = await Portfolio.find({ 
      userId: expertUser._id 
    }).sort({ createdAt: -1 });

    if (expertPortfolio.length === 0) {
      return res.json({
        success: true,
        expert: {
          name: expertUser.name,
          reputation: expertUser.reputation || 0,
          totalPositionsClosed: expertUser.totalPositionsClosed || 0,
          winRate: expertUser.winRate || 0
        },
        portfolio: [],
        totals: {
          initial: 0,
          current: 0,
          totalPnL: 0,
          totalPnLPercent: 0
        }
      });
    }

    // Get unique tickers for price updates
    const tickers = [...new Set(expertPortfolio.map(item => item.ticker))];
    
    // Update current prices
    const priceUpdates = await Promise.allSettled(
      tickers.map(async ticker => {
        try {
          const stockData: any = await stockDataService.getStockData(ticker);
          const current = (stockData && (stockData.current ?? stockData.price)) || 0;
          const change = (stockData && stockData.change) || 0;
          const changePercent = (stockData && stockData.changePercent) || 0;
          return { ticker, currentPrice: current, change, changePercent };
        } catch (error) {
          loggerService.warn(`Failed to get price for ${ticker}:`, error);
          return null;
        }
      })
    );

    // Map prices to portfolio items
    const priceMap = new Map();
    priceUpdates.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        priceMap.set(result.value.ticker, result.value);
      }
    });

    // Update portfolio with current prices
    const updatedPortfolio = expertPortfolio.map(item => {
      const priceData = priceMap.get(item.ticker);
      if (priceData) {
        item.currentPrice = priceData.currentPrice;
      }
      return item;
    });

    // Calculate totals
    const totals = updatedPortfolio.reduce(
      (acc, item) => ({
        initial: acc.initial + item.shares * item.entryPrice,
        current: acc.current + item.shares * item.currentPrice,
        totalPnL: acc.totalPnL + (item.shares * (item.currentPrice - item.entryPrice)),
        totalPnLPercent: 0 // Will calculate after
      }),
      { initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 }
    );

    totals.totalPnLPercent = totals.initial > 0 
      ? (totals.totalPnL / totals.initial) * 100 
      : 0;

    res.json({
      success: true,
      expert: {
        name: expertUser.name,
        reputation: expertUser.reputation || 0,
        totalPositionsClosed: expertUser.totalPositionsClosed || 0,
        winRate: expertUser.winRate || 0,
        averageReturn: expertUser.reputation && expertUser.totalPositionsClosed 
          ? expertUser.reputation / expertUser.totalPositionsClosed 
          : 0
      },
      portfolio: updatedPortfolio,
      totals,
      priceUpdates: Array.from(priceMap.values())
    });

  } catch (error: any) {
    loggerService.error('❌ [EXPERT PORTFOLIO] Error fetching expert portfolio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expert portfolio',
      message: error.message
    });
  }
});

/**
 * Get expert trader's closed positions (historical trades)
 * GET /api/expert-portfolio/history
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    // Find the expert trader
    const expertUser = await User.findOne({ isExpertTrader: true });
    
    if (!expertUser) {
      return res.status(404).json({
        success: false,
        error: 'No expert trader found'
      });
    }

    // Get closed positions from transaction history or closed portfolio items
    // This would require a transaction history model, for now return empty
    const history: any[] = [];

    res.json({
      success: true,
      expert: {
        name: expertUser.name,
        reputation: expertUser.reputation || 0,
        totalPositionsClosed: expertUser.totalPositionsClosed || 0,
        winRate: expertUser.winRate || 0
      },
      history,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: history.length
      }
    });

  } catch (error: any) {
    loggerService.error('❌ [EXPERT PORTFOLIO] Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expert portfolio history',
      message: error.message
    });
  }
});

/**
 * Get expert trader stats
 * GET /api/expert-portfolio/stats
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Find the expert trader
    const expertUser = await User.findOne({ isExpertTrader: true });
    
    if (!expertUser) {
      return res.status(404).json({
        success: false,
        error: 'No expert trader found'
      });
    }

    // Get portfolio count and stats
    const portfolioCount = await Portfolio.countDocuments({ userId: expertUser._id });
    const portfolioItems = await Portfolio.find({ userId: expertUser._id });

    // Calculate portfolio composition
    const byAction = portfolioItems.reduce((acc, item) => {
      acc[item.action] = (acc[item.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPortfolioType = portfolioItems.reduce((acc, item) => {
      acc[item.portfolioType] = (acc[item.portfolioType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      expert: {
        name: expertUser.name,
        reputation: expertUser.reputation || 0,
        totalPositionsClosed: expertUser.totalPositionsClosed || 0,
        winRate: expertUser.winRate || 0,
        averageWin: expertUser.averageWin || 0,
        averageLoss: expertUser.averageLoss || 0,
        bestTrade: expertUser.bestTrade || 0,
        worstTrade: expertUser.worstTrade || 0
      },
      stats: {
        totalPositions: portfolioCount,
        byAction,
        byPortfolioType,
        activeStocks: portfolioCount,
        diversification: portfolioItems.length > 0 
          ? new Set(portfolioItems.map(i => i.ticker)).size / portfolioItems.length 
          : 0
      }
    });

  } catch (error: any) {
    loggerService.error('❌ [EXPERT PORTFOLIO] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expert portfolio stats',
      message: error.message
    });
  }
});

/**
 * Get expert trader's deleted transactions (closed positions)
 * GET /api/expert-portfolio/deleted-transactions
 */
router.get('/deleted-transactions', authenticateToken, deletedTransactionsCache, async (req, res) => {
  try {
    loggerService.info('🎓 [EXPERT PORTFOLIO] Fetching expert deleted transactions');

    // Find the expert trader
    const expertUser = await User.findOne({ isExpertTrader: true });
    
    if (!expertUser) {
      return res.status(404).json({
        success: false,
        error: 'No expert trader found'
      });
    }

    // Get expert's deleted transactions
    const deletedTransactions = await DeletedTransactionAudit.find({ 
      userId: expertUser._id,
      type: 'delete'
    })
    .sort({ deletedAt: -1 })
    .limit(50); // Limit to last 50 closed positions

    loggerService.info(`🎓 [EXPERT PORTFOLIO] Found ${deletedTransactions.length} deleted transactions for expert`);

    res.json({
      success: true,
      transactions: deletedTransactions,
      count: deletedTransactions.length
    });

  } catch (error: any) {
    loggerService.error('❌ [EXPERT PORTFOLIO] Error fetching deleted transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expert deleted transactions',
      message: error.message
    });
  }
});

/**
 * Add historical positions manually
 * POST /api/expert-portfolio/add-historical
 */
router.post('/add-historical', authenticateToken, async (req, res) => {
  try {
    loggerService.info('🎓 [EXPERT PORTFOLIO] Adding historical positions');

    // Find or create the expert trader
    let expertUser = await User.findOne({ isExpertTrader: true });
    
    if (!expertUser) {
      loggerService.info('🎓 [EXPERT PORTFOLIO] Creating expert trader');
      expertUser = new User({
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
      await expertUser.save();
    }

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
      loggerService.info(`✅ Added historical position: ${position.ticker} - P&L: $${position.pnl} (${position.pnlPercent}%)`);
    }

    // Update expert trader's reputation
    const totalPnL = historicalPositions.reduce((sum, pos) => sum + pos.pnl, 0);
    expertUser.reputation = totalPnL;
    expertUser.totalRealizedPnL = totalPnL;
    expertUser.totalPositionsClosed = historicalPositions.length;
    await expertUser.save();

    loggerService.info(`🎉 Successfully added ${historicalPositions.length} historical positions`);
    loggerService.info(`💰 Total P&L: $${totalPnL.toFixed(2)}`);

    res.json({
      success: true,
      message: `Successfully added ${historicalPositions.length} historical positions`,
      totalPnL: totalPnL,
      positionsAdded: historicalPositions.length
    });

  } catch (error: any) {
    loggerService.error('❌ [EXPERT PORTFOLIO] Error adding historical positions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add historical positions',
      message: error.message
    });
  }
});

export default router;

