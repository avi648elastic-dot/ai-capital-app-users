import { Request, Response, NextFunction } from 'express';
import Portfolio from '../models/Portfolio';
import User from '../models/User';
import { loggerService } from '../services/loggerService';

// Middleware to check portfolio count limits based on subscription tier
export const checkPortfolioLimits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user subscription tier
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Count existing portfolios for this user
    const portfolioCount = await Portfolio.distinct('portfolioId', { userId });
    const currentPortfolioCount = portfolioCount.length;

    // Check limits based on subscription tier
    let maxPortfolios = 1; // Default for free users
    if (user.subscriptionTier === 'premium') {
      maxPortfolios = 3;
    } else if (user.subscriptionTier === 'premium+') {
      maxPortfolios = 5;
    }

    // Check if user is trying to create a new portfolio
    const isNewPortfolio = req.method === 'POST' && req.path.includes('/portfolio');
    
    if (isNewPortfolio && currentPortfolioCount >= maxPortfolios) {
      loggerService.warn(`Portfolio limit exceeded for user ${userId}`, {
        userId,
        subscriptionTier: user.subscriptionTier,
        currentCount: currentPortfolioCount,
        maxAllowed: maxPortfolios
      });

      return res.status(403).json({
        success: false,
        error: 'Portfolio limit exceeded',
        message: `You have reached the maximum number of portfolios for your ${user.subscriptionTier} plan (${maxPortfolios} portfolios). Upgrade your plan to create more portfolios.`,
        currentCount: currentPortfolioCount,
        maxAllowed: maxPortfolios,
        subscriptionTier: user.subscriptionTier
      });
    }

    // Add portfolio info to request for use in route handlers
    (req as any).portfolioInfo = {
      currentCount: currentPortfolioCount,
      maxAllowed: maxPortfolios,
      subscriptionTier: user.subscriptionTier
    };

    next();
  } catch (error: any) {
    loggerService.error('Error checking portfolio limits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check portfolio limits'
    });
  }
};

// Middleware to check stock limits per portfolio
export const checkStockLimits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { portfolioId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!portfolioId) {
      return next(); // Skip if no portfolioId provided
    }

    // Get user subscription tier
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Count stocks in the specific portfolio
    const stockCount = await Portfolio.countDocuments({ 
      userId, 
      portfolioId 
    });

    // Check limits based on subscription tier
    let maxStocksPerPortfolio = 10; // Default for free users
    if (user.subscriptionTier === 'premium') {
      maxStocksPerPortfolio = 10;
    } else if (user.subscriptionTier === 'premium+') {
      maxStocksPerPortfolio = 15;
    }

    // Check if user is trying to add a new stock
    const isAddingStock = req.method === 'POST' && req.path.includes('/portfolio');
    
    if (isAddingStock && stockCount >= maxStocksPerPortfolio) {
      loggerService.warn(`Stock limit exceeded for portfolio ${portfolioId}`, {
        userId,
        portfolioId,
        subscriptionTier: user.subscriptionTier,
        currentCount: stockCount,
        maxAllowed: maxStocksPerPortfolio
      });

      return res.status(403).json({
        success: false,
        error: 'Stock limit exceeded',
        message: `You have reached the maximum number of stocks per portfolio for your ${user.subscriptionTier} plan (${maxStocksPerPortfolio} stocks). Upgrade your plan to add more stocks.`,
        currentCount: stockCount,
        maxAllowed: maxStocksPerPortfolio,
        subscriptionTier: user.subscriptionTier,
        portfolioId
      });
    }

    next();
  } catch (error: any) {
    loggerService.error('Error checking stock limits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check stock limits'
    });
  }
};
