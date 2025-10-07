import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { User } from '../models/User';

const router = express.Router();

// Get subscription status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user!._id).select('subscriptionTier');
    res.json({ 
      subscriptionTier: user?.subscriptionTier || 'free',
      isPremium: user?.subscriptionTier === 'premium'
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Upgrade to premium (mock implementation)
router.post('/upgrade', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { subscriptionTier: 'premium' },
      { new: true }
    );
    
    res.json({ 
      message: 'Successfully upgraded to Premium!',
      subscriptionTier: user?.subscriptionTier,
      isPremium: true
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Downgrade to free (for testing)
router.post('/downgrade', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { subscriptionTier: 'free' },
      { new: true }
    );
    
    res.json({ 
      message: 'Downgraded to Free tier',
      subscriptionTier: user?.subscriptionTier,
      isPremium: false
    });
  } catch (error) {
    console.error('Error downgrading subscription:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
