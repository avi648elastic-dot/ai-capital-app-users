import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { reputationService } from '../services/reputationService';

const router = express.Router();

// Get leaderboard - top traders by reputation
router.get('/', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const leaderboard = await reputationService.getLeaderboard(limit);
    
    res.json({
      success: true,
      leaderboard,
      totalUsers: leaderboard.length
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's trading history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await reputationService.getUserTradingHistory(req.user!._id, limit);
    
    res.json({
      success: true,
      history,
      totalTrades: history.length
    });
  } catch (error) {
    console.error('Trading history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's reputation summary
router.get('/my-reputation', authenticateToken, async (req, res) => {
  try {
    const reputation = await reputationService.getUserReputationSummary(req.user!._id);
    
    res.json({
      success: true,
      reputation
    });
  } catch (error) {
    console.error('Reputation summary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
