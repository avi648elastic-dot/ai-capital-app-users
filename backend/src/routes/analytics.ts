import express from 'express';
import Portfolio from '../models/Portfolio';
import { authenticateToken, requireSubscription } from '../middleware/auth';
import { sectorService } from '../services/sectorService';

const router = express.Router();

// Get comprehensive portfolio analysis for analytics page
router.get('/portfolio-analysis', authenticateToken, requireSubscription, async (req, res) => {
  try {
    console.log('🔍 [ANALYTICS] Fetching portfolio analysis for user:', req.user!._id);
    
    // Get user's portfolio
    const portfolio = await Portfolio.find({ userId: req.user!._id }).sort({ createdAt: -1 });
    
    if (portfolio.length === 0) {
      return res.json({
        sectorAllocation: [],
        totalValue: 0,
        riskMetrics: {
          concentration: 0,
          diversification: 0,
          volatility: 0
        },
        performance90D: 0,
        portfolio: []
      });
    }

    // Analyze portfolio using sector service
    const analysis = await sectorService.analyzePortfolio(portfolio);
    
    console.log('✅ [ANALYTICS] Portfolio analysis completed:', {
      sectors: analysis.sectorAllocation.length,
      totalValue: analysis.totalValue,
      diversification: analysis.riskMetrics.diversification
    });

    res.json({
      ...analysis,
      portfolio: portfolio.map(stock => ({
        ticker: stock.ticker,
        shares: stock.shares,
        entryPrice: stock.entryPrice,
        currentPrice: stock.currentPrice,
        sector: sectorService.getSector(stock.ticker),
        value: stock.currentPrice * stock.shares,
        pnl: (stock.currentPrice - stock.entryPrice) * stock.shares,
        pnlPercent: ((stock.currentPrice - stock.entryPrice) / stock.entryPrice) * 100
      }))
    });
  } catch (error) {
    console.error('❌ [ANALYTICS] Portfolio analysis error:', error);
    res.status(500).json({ message: 'Failed to analyze portfolio' });
  }
});

// Get sector performance data
router.get('/sector-performance', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ userId: req.user!._id });
    const analysis = await sectorService.analyzePortfolio(portfolio);
    
    res.json({
      sectors: analysis.sectorAllocation,
      totalValue: analysis.totalValue,
      performance90D: analysis.performance90D
    });
  } catch (error) {
    console.error('❌ [ANALYTICS] Sector performance error:', error);
    res.status(500).json({ message: 'Failed to fetch sector performance' });
  }
});

export default router;
