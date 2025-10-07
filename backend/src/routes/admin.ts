import express from 'express';
import User from '../models/User';
import Portfolio from '../models/Portfolio';
import { authenticateToken } from '../middleware/auth';

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
        
        // Calculate portfolio stats
        const totals = portfolio.reduce((acc, item) => {
          const cost = item.entryPrice * item.shares;
          const value = item.currentPrice * item.shares;
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

export default router;
