import express from 'express';
import { authenticateToken } from '../middleware/auth';
import User from '../models/User';

const router = express.Router();

// Upgrade user subscription
router.post('/upgrade', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const { plan } = req.body;

    // Validate plan
    const validPlans = ['free', 'premium', 'premium+'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid plan. Must be one of: free, premium, premium+' 
      });
    }

    // Update user subscription
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { subscriptionTier: plan },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    console.log(`✅ [SUBSCRIPTION] User ${userId} upgraded to ${plan}`);

    res.json({
      success: true,
      message: `Successfully upgraded to ${plan}`,
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        subscriptionTier: updatedUser.subscriptionTier
      }
    });

  } catch (error: any) {
    console.error('❌ [SUBSCRIPTION] Upgrade error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during upgrade' 
    });
  }
});

// Get subscription status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user._id;

    const user = await User.findById(userId).select('subscriptionTier email name');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      subscriptionTier: user.subscriptionTier,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscriptionTier: user.subscriptionTier
      }
    });

  } catch (error: any) {
    console.error('❌ [SUBSCRIPTION] Status error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Cancel subscription (downgrade to free)
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { subscriptionTier: 'free' },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    console.log(`✅ [SUBSCRIPTION] User ${userId} cancelled subscription (downgraded to free)`);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        subscriptionTier: updatedUser.subscriptionTier
      }
    });

  } catch (error: any) {
    console.error('❌ [SUBSCRIPTION] Cancel error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during cancellation' 
    });
  }
});

export default router;