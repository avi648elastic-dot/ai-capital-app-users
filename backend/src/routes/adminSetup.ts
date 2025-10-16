import { Router, Request, Response } from 'express';
import User from '../models/User';
import { loggerService } from '../services/loggerService';

const router = Router();

/**
 * One-time setup endpoint to designate expert trader
 * POST /api/admin-setup/set-expert
 * Body: { email: string, secretKey: string }
 */
router.post('/set-expert', async (req: Request, res: Response) => {
  try {
    const { email, secretKey } = req.body;

    // Security: Require a secret key to prevent unauthorized access
    const ADMIN_SECRET = process.env.ADMIN_SETUP_SECRET || 'change-this-secret-key-in-production';
    
    if (secretKey !== ADMIN_SECRET) {
      loggerService.warn('❌ [ADMIN SETUP] Invalid secret key attempt');
      return res.status(403).json({
        success: false,
        error: 'Invalid secret key'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: `User not found: ${email}`
      });
    }

    // Update user to expert status
    user.role = 'admin';
    user.isExpertTrader = true;
    user.isAdmin = true;
    user.subscriptionTier = 'premium+';
    user.subscriptionActive = true;
    await user.save();

    loggerService.info('✅ [ADMIN SETUP] Expert trader designated', {
      email: user.email,
      name: user.name,
      userId: user._id
    });

    res.json({
      success: true,
      message: 'Expert trader designated successfully',
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        isExpertTrader: user.isExpertTrader,
        subscriptionTier: user.subscriptionTier
      }
    });

  } catch (error: any) {
    loggerService.error('❌ [ADMIN SETUP] Error setting expert trader:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set expert trader',
      message: error.message
    });
  }
});

/**
 * Get current expert trader info
 * GET /api/admin-setup/expert-info
 */
router.get('/expert-info', async (req: Request, res: Response) => {
  try {
    const expertUser = await User.findOne({ isExpertTrader: true });
    
    if (!expertUser) {
      return res.json({
        success: true,
        hasExpert: false,
        message: 'No expert trader designated yet'
      });
    }

    res.json({
      success: true,
      hasExpert: true,
      expert: {
        name: expertUser.name,
        email: expertUser.email,
        reputation: expertUser.reputation || 0,
        totalPositionsClosed: expertUser.totalPositionsClosed || 0,
        winRate: expertUser.winRate || 0
      }
    });

  } catch (error: any) {
    loggerService.error('❌ [ADMIN SETUP] Error getting expert info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get expert info'
    });
  }
});

export default router;

