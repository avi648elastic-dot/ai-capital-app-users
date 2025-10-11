import express from 'express';
import User from '../models/User';
import Portfolio from '../models/Portfolio';
import { authenticateToken } from '../middleware/auth';
import { decisionEngine } from '../services/decisionEngine';
import { googleFinanceFormulasService } from '../services/googleFinanceFormulasService';

const router = express.Router();

// Admin middleware - role based
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user || user.isAdmin !== true) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all users and their portfolio stats
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const portfolio = await Portfolio.find({ userId: user._id });
        
        if (portfolio.length === 0) {
          return {
            id: user._id,
            name: user.name,
            email: user.email,
            subscriptionActive: user.subscriptionActive,
            subscriptionTier: user.subscriptionTier || 'free',
            onboardingCompleted: user.onboardingCompleted,
            portfolioType: user.portfolioType,
            portfolioSource: user.portfolioSource,
            totalCapital: user.totalCapital,
            riskTolerance: user.riskTolerance,
            createdAt: user.createdAt,
            portfolioStats: {
              totalCost: 0,
              totalValue: 0,
              totalPnL: 0,
              pnlPercent: 0,
              stockCount: 0,
              actionCounts: {},
            },
          };
        }

        // Get unique tickers for real-time price fetching
        const tickers = [...new Set(portfolio.map(item => item.ticker))];
        
        // Fetch real-time prices using stockDataService
        let realTimeData = new Map();
        try {
          const { stockDataService } = await import('../services/stockDataService');
          realTimeData = await stockDataService.getMultipleStockData(tickers);
          console.log(`📊 [ADMIN] Fetched real-time data for user ${user.email}:`, realTimeData.size, 'stocks');
        } catch (priceError) {
          console.warn(`⚠️ [ADMIN] Could not fetch real-time prices for user ${user.email}:`, priceError);
        }
        
        // Calculate portfolio stats with real-time prices
        const totals = portfolio.reduce((acc, item) => {
          const cost = item.entryPrice * item.shares;
          
          // Use real-time price if available, otherwise fallback to stored price
          const realTimeStock = realTimeData.get(item.ticker);
          const currentPrice = realTimeStock?.current || item.currentPrice;
          const value = currentPrice * item.shares;
          const pnl = value - cost;
          
          return {
            totalCost: acc.totalCost + cost,
            totalValue: acc.totalValue + value,
            totalPnL: acc.totalPnL + pnl,
            stockCount: acc.stockCount + 1,
          };
        }, { totalCost: 0, totalValue: 0, totalPnL: 0, stockCount: 0 });
        
        // Count actions
        const actionCounts = portfolio.reduce((acc, item) => {
          acc[item.action] = (acc[item.action] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return {
          id: user._id,
          name: user.name,
          email: user.email,
          subscriptionActive: user.subscriptionActive,
          subscriptionTier: user.subscriptionTier || 'free',
          onboardingCompleted: user.onboardingCompleted,
          portfolioType: user.portfolioType,
          portfolioSource: user.portfolioSource,
          totalCapital: user.totalCapital,
          riskTolerance: user.riskTolerance,
          createdAt: user.createdAt,
          portfolioStats: {
            ...totals,
            pnlPercent: totals.totalCost > 0 ? (totals.totalPnL / totals.totalCost) * 100 : 0,
            actionCounts,
          },
        };
      })
    );
    
    res.json({ users: usersWithStats });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get specific user's portfolio
router.get('/users/:userId/portfolio', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const portfolio = await Portfolio.find({ userId }).sort({ createdAt: -1 });
    
    res.json({ user, portfolio });
  } catch (error) {
    console.error('Get user portfolio error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Deactivate user
router.put('/users/:userId/deactivate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { subscriptionActive: false, apiKey: undefined },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deactivated successfully', user });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Activate user
router.put('/users/:userId/activate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { subscriptionActive: true },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User activated successfully', user });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Make user premium
router.put('/users/:userId/make-premium', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        subscriptionActive: true,
        subscriptionTier: 'premium'
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('✅ [ADMIN] User upgraded to premium:', user.email);
    res.json({ message: 'User upgraded to premium successfully', user });
  } catch (error) {
    console.error('Make premium error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Make user free
router.put('/users/:userId/make-free', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        subscriptionActive: false,
        subscriptionTier: 'free'
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('✅ [ADMIN] User downgraded to free:', user.email);
    res.json({ message: 'User downgraded to free successfully', user });
  } catch (error) {
    console.error('Make free error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Refresh user's portfolio data with real-time prices
router.post('/users/:userId/refresh', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔄 [ADMIN] Refreshing portfolio data for user: ${userId}`);
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const portfolio = await Portfolio.find({ userId });
    if (portfolio.length === 0) {
      return res.json({ 
        message: 'No portfolio data to refresh',
        user: {
          ...user.toObject(),
          portfolioStats: {
            totalCost: 0,
            totalValue: 0,
            totalPnL: 0,
            pnlPercent: 0,
            stockCount: 0,
            actionCounts: {},
          }
        }
      });
    }

    // Get unique tickers for real-time price fetching
    const tickers = [...new Set(portfolio.map(item => item.ticker))];
    console.log(`📊 [ADMIN] Refreshing prices for tickers:`, tickers);
    
    // Fetch real-time prices
    const { stockDataService } = await import('../services/stockDataService');
    const realTimeData = await stockDataService.getMultipleStockData(tickers);
    console.log(`✅ [ADMIN] Fetched real-time data for ${realTimeData.size} stocks`);
    
    // Calculate updated portfolio stats with real-time prices
    const totals = portfolio.reduce((acc, item) => {
      const cost = item.entryPrice * item.shares;
      
      // Use real-time price if available, otherwise fallback to stored price
      const realTimeStock = realTimeData.get(item.ticker);
      const currentPrice = realTimeStock?.current || item.currentPrice;
      const value = currentPrice * item.shares;
      const pnl = value - cost;
      
      return {
        totalCost: acc.totalCost + cost,
        totalValue: acc.totalValue + value,
        totalPnL: acc.totalPnL + pnl,
        stockCount: acc.stockCount + 1,
      };
    }, { totalCost: 0, totalValue: 0, totalPnL: 0, stockCount: 0 });
    
    // Count actions
    const actionCounts = portfolio.reduce((acc, item) => {
      acc[item.action] = (acc[item.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const updatedUser = {
      ...user.toObject(),
      portfolioStats: {
        ...totals,
        pnlPercent: totals.totalCost > 0 ? (totals.totalPnL / totals.totalCost) * 100 : 0,
        actionCounts,
      },
    };
    
    console.log(`✅ [ADMIN] Portfolio refreshed for user ${user.email}: P&L ${updatedUser.portfolioStats.pnlPercent.toFixed(2)}%`);
    
    res.json({ 
      message: 'Portfolio data refreshed successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Refresh portfolio error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Force update all portfolio prices (admin only)
router.post('/update-all-prices', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔄 [ADMIN] Force updating all portfolio prices...');
    
    // Import scheduler service
    const { schedulerService } = await import('../services/schedulerService');
    
    // Trigger portfolio update
    await schedulerService.triggerPortfolioUpdate();
    
    console.log('✅ [ADMIN] All portfolio prices updated successfully');
    res.json({ message: 'All portfolio prices updated successfully' });
  } catch (error) {
    console.error('❌ [ADMIN] Error updating all portfolio prices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset user portfolio
router.delete('/users/:userId/portfolio', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    await Portfolio.deleteMany({ userId });
    await User.findByIdAndUpdate(userId, {
      onboardingCompleted: false,
      portfolioType: undefined,
      portfolioSource: undefined,
      totalCapital: undefined,
    });
    
    res.json({ message: 'User portfolio reset successfully' });
  } catch (error) {
    console.error('Reset portfolio error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get system statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ subscriptionActive: true });
    const completedOnboarding = await User.countDocuments({ onboardingCompleted: true });
    
    const totalPortfolios = await Portfolio.countDocuments();
    const solidPortfolios = await User.countDocuments({ portfolioType: 'solid' });
    const riskyPortfolios = await User.countDocuments({ portfolioType: 'risky' });
    
    // Action distribution
    const actionStats = await Portfolio.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Total capital across all users
    const capitalStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalCapital: { $sum: '$totalCapital' },
          avgCapital: { $avg: '$totalCapital' },
        },
      },
    ]);
    
    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        completedOnboarding,
      },
      portfolios: {
        total: totalPortfolios,
        solid: solidPortfolios,
        risky: riskyPortfolios,
      },
      actions: actionStats,
      capital: capitalStats[0] || { totalCapital: 0, avgCapital: 0 },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Quick admin setup endpoint (temporary - for initial setup only)
router.post('/setup-admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Make user admin
    await User.findByIdAndUpdate(user._id, {
      isAdmin: true,
      subscriptionTier: 'premium',
      subscriptionActive: true
    });

    console.log('✅ [ADMIN SETUP] User made admin:', email);
    res.json({ 
      message: 'Admin setup successful! You can now access /admin',
      user: {
        email: user.email,
        isAdmin: true,
        subscriptionTier: 'premium'
      }
    });
  } catch (error) {
    console.error('Admin setup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Promote user to admin or update subscription tier
router.put('/users/:userId/promote', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { subscriptionTier, isAdmin } = req.body;

    // Validate input
    if (subscriptionTier && !['free', 'premium', 'premium+'].includes(subscriptionTier)) {
      return res.status(400).json({ message: 'Invalid subscription tier' });
    }

    const updateData: any = {};
    if (subscriptionTier !== undefined) updateData.subscriptionTier = subscriptionTier;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        isAdmin: user.isAdmin,
        subscriptionActive: user.subscriptionActive
      }
    });
  } catch (error) {
    console.error('Error promoting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// API Key Management Endpoints
router.get('/api-keys/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 [ADMIN] Getting API key statistics');
    
    const cacheStats = decisionEngine.getCacheStats();
    const apiKeyStats = decisionEngine.getApiKeyStats();
    
    const stats = {
      cache: cacheStats,
      apiKeys: apiKeyStats,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ [ADMIN] API key stats retrieved:', {
      totalKeys: apiKeyStats.totalKeys,
      availableKeys: apiKeyStats.availableKeys,
      blacklistedKeys: apiKeyStats.blacklistedKeys,
      cacheSize: cacheStats.size
    });
    
    res.json(stats);
  } catch (error) {
    console.error('❌ [ADMIN] Error getting API key stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset API key blacklist
router.post('/api-keys/reset-blacklist', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔄 [ADMIN] Resetting API key blacklist');
    
    decisionEngine.resetApiKeyBlacklist();
    
    console.log('✅ [ADMIN] API key blacklist reset successfully');
    res.json({ 
      message: 'API key blacklist reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [ADMIN] Error resetting blacklist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Clear cache
router.post('/api-keys/clear-cache', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🧹 [ADMIN] Clearing cache');
    
    decisionEngine.clearCache();
    
    console.log('✅ [ADMIN] Cache cleared successfully');
    res.json({ 
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [ADMIN] Error clearing cache:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
