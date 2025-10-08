import express, { Request, Response } from 'express';
import Portfolio from '../models/Portfolio';
import User from '../models/User';
import { authenticateToken, requireSubscription } from '../middleware/auth';

const router = express.Router();

// Get all portfolios for a user (grouped by portfolioId)
router.get('/', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ userId: req.user!._id }).sort({ portfolioId: 1, createdAt: -1 });
    
    // Group portfolios by portfolioId
    const groupedPortfolios = portfolios.reduce((acc, item) => {
      const key = item.portfolioId;
      if (!acc[key]) {
        acc[key] = {
          portfolioId: item.portfolioId,
          portfolioType: item.portfolioType,
          portfolioName: item.portfolioName || `${item.portfolioType} Portfolio ${item.portfolioId.split('-')[1]}`,
          stocks: [],
          totals: { initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 },
          volatility: item.volatility || 0,
          lastVolatilityUpdate: item.lastVolatilityUpdate
        };
      }
      
      // Calculate totals
      const cost = item.entryPrice * item.shares;
      const value = item.currentPrice * item.shares;
      const pnl = value - cost;
      
      acc[key].totals.initial += cost;
      acc[key].totals.current += value;
      acc[key].totals.totalPnL += pnl;
      acc[key].stocks.push(item);
      
      return acc;
    }, {} as any);

    // Calculate percentages
    Object.values(groupedPortfolios).forEach((portfolio: any) => {
      portfolio.totals.totalPnLPercent = portfolio.totals.initial > 0 
        ? (portfolio.totals.totalPnL / portfolio.totals.initial) * 100 
        : 0;
    });

    res.json({ portfolios: Object.values(groupedPortfolios) });
  } catch (error) {
    console.error('Get portfolios error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new portfolio
router.post('/create', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const { 
      portfolioType, 
      portfolioName, 
      initialInvestment, 
      riskTolerance
    } = req.body;
    
    if (!['solid', 'risky'].includes(portfolioType)) {
      return res.status(400).json({ message: 'Invalid portfolio type' });
    }

    // Validate initial investment
    if (initialInvestment && (isNaN(initialInvestment) || initialInvestment <= 0)) {
      return res.status(400).json({ message: 'Initial investment must be a positive number' });
    }

    // Validate risk tolerance (1-10 scale)
    if (riskTolerance && (isNaN(riskTolerance) || riskTolerance < 1 || riskTolerance > 10)) {
      return res.status(400).json({ message: 'Risk tolerance must be between 1 and 10' });
    }

    // Check if user is premium
    const user = await User.findById(req.user!._id);
    if (user?.subscriptionTier !== 'premium') {
      return res.status(403).json({ message: 'Premium subscription required to create multiple portfolios' });
    }

    // Count existing portfolios of this type
    const existingCount = await Portfolio.distinct('portfolioId', { 
      userId: req.user!._id, 
      portfolioType 
    });

    if (existingCount.length >= 3) {
      return res.status(403).json({ 
        message: `Maximum 3 ${portfolioType} portfolios allowed for premium users. Upgrade to Premium+ for up to 5 portfolios.` 
      });
    }

    // Generate new portfolio ID
    const nextNumber = existingCount.length + 1;
    const portfolioId = `${portfolioType}-${nextNumber}`;

    // Create the portfolio (empty for now)
    const portfolio = {
      portfolioId,
      portfolioType,
      portfolioName: portfolioName || `${portfolioType} Portfolio ${nextNumber}`,
      initialInvestment: initialInvestment || 0,
      riskTolerance: riskTolerance || 7,
      investmentGoal: portfolioType === 'solid' ? 'Growth' : 'Aggressive',
      stocks: [],
      totals: { 
        initial: initialInvestment || 0, 
        current: initialInvestment || 0, 
        totalPnL: 0, 
        totalPnLPercent: 0 
      }
    };

    res.json({ 
      message: 'Portfolio created successfully', 
      portfolio,
      success: true
    });
  } catch (error) {
    console.error('Create portfolio error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get stocks for a specific portfolio
router.get('/:portfolioId', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const { portfolioId } = req.params;
    
    const stocks = await Portfolio.find({ 
      userId: req.user!._id, 
      portfolioId 
    }).sort({ createdAt: -1 });

    if (stocks.length === 0) {
      return res.json({ 
        portfolioId, 
        stocks: [], 
        totals: { initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 } 
      });
    }

    // Calculate totals
    const totals = stocks.reduce((acc, item) => {
      const cost = item.entryPrice * item.shares;
      const value = item.currentPrice * item.shares;
      const pnl = value - cost;
      
      return {
        initial: acc.initial + cost,
        current: acc.current + value,
        totalPnL: acc.totalPnL + pnl,
        totalPnLPercent: 0 // Will calculate after
      };
    }, { initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 });

    totals.totalPnLPercent = totals.initial > 0 ? (totals.totalPnL / totals.initial) * 100 : 0;

    res.json({ portfolioId, stocks, totals });
  } catch (error) {
    console.error('Get portfolio stocks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a portfolio (and all its stocks)
router.delete('/:portfolioId', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const { portfolioId } = req.params;
    console.log('🗑️ [DELETE PORTFOLIO] Attempting to delete portfolio:', portfolioId);
    console.log('🗑️ [DELETE PORTFOLIO] User ID:', (req as any).user!._id);
    
    // Check if user is premium
    const user = await User.findById((req as any).user!._id);
    console.log('🗑️ [DELETE PORTFOLIO] User found:', user?.email, 'Tier:', user?.subscriptionTier);
    
    if (user?.subscriptionTier !== 'premium') {
      console.log('🗑️ [DELETE PORTFOLIO] User is not premium, denying deletion');
      return res.status(403).json({ message: 'Premium subscription required to manage multiple portfolios' });
    }

    // Check if this is the user's primary portfolio from onboarding
    const onboardingData = await User.findById((req as any).user!._id).select('onboardingCompleted portfolioType');
    console.log('🗑️ [DELETE PORTFOLIO] User onboarding data:', onboardingData);
    
    // Get the primary portfolio ID based on onboarding
    const primaryPortfolioId = onboardingData?.portfolioType ? `${onboardingData.portfolioType}-1` : null;
    console.log('🗑️ [DELETE PORTFOLIO] Primary portfolio ID from onboarding:', primaryPortfolioId);
    
    if (portfolioId === primaryPortfolioId) {
      console.log('🗑️ [DELETE PORTFOLIO] Cannot delete primary portfolio from onboarding:', portfolioId);
      return res.status(403).json({ 
        message: 'Cannot delete your primary portfolio from onboarding. You can only delete additional portfolios created later.' 
      });
    }

    console.log('🗑️ [DELETE PORTFOLIO] Proceeding with deletion...');
    const result = await Portfolio.deleteMany({ 
      userId: (req as any).user!._id, 
      portfolioId 
    });
    
    console.log('🗑️ [DELETE PORTFOLIO] Deletion result:', result);

    res.json({ message: 'Portfolio deleted successfully' });
  } catch (error) {
    console.error('Delete portfolio error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update portfolio volatilities for a specific user
router.post('/update-volatility', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const userId = (req as any).user!._id;
    
    // Import volatility service
    const { volatilityService } = await import('../services/volatilityService');
    
    await volatilityService.updateUserPortfolioVolatilities(userId.toString());
    
    res.json({ message: 'Portfolio volatilities updated successfully' });
  } catch (error) {
    console.error('❌ [PORTFOLIOS] Error updating volatilities:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
