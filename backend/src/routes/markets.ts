import express from 'express';
import { authenticateToken } from '../middleware/auth';
import User from '../models/User';

const router = express.Router();

// Save featured tickers for premium users
router.post('/featured', authenticateToken, async (req: any, res) => {
  try {
    const { featuredTickers } = req.body as { featuredTickers: string[] };
    if (!Array.isArray(featuredTickers) || featuredTickers.length !== 4) {
      return res.status(400).json({ message: 'Provide exactly 4 tickers' });
    }
    const normalized = featuredTickers.map((t) => String(t).trim().toUpperCase());

    // Require premium
    if (req.user?.subscriptionTier !== 'premium') {
      return res.status(403).json({ message: 'Premium subscription required' });
    }

    await User.findByIdAndUpdate(req.user!._id, { featuredTickers: normalized });
    res.json({ message: 'Featured tickers saved', featuredTickers: normalized });
  } catch (error) {
    console.error('❌ Save featured tickers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;


