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

export default router;

