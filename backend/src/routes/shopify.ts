import express from 'express';
import User from '../models/User';
import crypto from 'crypto';

const router = express.Router();

// Shopify webhook for subscription events
router.post('/webhook', async (req, res) => {
  try {
    const { email, subscription_status, plan_name } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update subscription status
    if (subscription_status === 'active') {
      user.subscriptionActive = true;
      
      // Generate API key if not exists
      if (!user.apiKey) {
        user.apiKey = crypto.randomBytes(32).toString('hex');
      }
    } else if (subscription_status === 'cancelled' || subscription_status === 'expired') {
      user.subscriptionActive = false;
      user.apiKey = undefined;
    }

    await user.save();

    res.json({ 
      message: 'Subscription updated successfully',
      subscriptionActive: user.subscriptionActive,
      planName: plan_name || 'Unknown'
    });
  } catch (error) {
    console.error('Shopify webhook error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mock subscription endpoint for testing
router.post('/mock-subscription', async (req, res) => {
  try {
    const { email, action } = req.body;

    if (!email || !action) {
      return res.status(400).json({ message: 'Email and action are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (action === 'activate') {
      user.subscriptionActive = true;
      if (!user.apiKey) {
        user.apiKey = crypto.randomBytes(32).toString('hex');
      }
    } else if (action === 'deactivate') {
      user.subscriptionActive = false;
      user.apiKey = undefined;
    }

    await user.save();

    res.json({ 
      message: `Subscription ${action}d successfully`,
      subscriptionActive: user.subscriptionActive,
      apiKey: user.apiKey
    });
  } catch (error) {
    console.error('Mock subscription error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
