import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import User from '../models/User';
import { loggerService } from '../services/loggerService';

// Subscription tier limits
const PLAN_LIMITS = {
  free: {
    maxStocks: 5,
    maxPortfolios: 1,
    maxWatchlistItems: 3,
    maxNotifications: 10,
    features: {
      realTimeData: false,
      advancedAnalytics: false,
      portfolioSharing: false,
      customAlerts: false,
    }
  },
  premium: {
    maxStocks: 25,
    maxPortfolios: 3,
    maxWatchlistItems: 15,
    maxNotifications: 100,
    features: {
      realTimeData: true,
      advancedAnalytics: true,
      portfolioSharing: false,
      customAlerts: true,
    }
  },
  'premium+': {
    maxStocks: 100,
    maxPortfolios: 10,
    maxWatchlistItems: 50,
    maxNotifications: 500,
    features: {
      realTimeData: true,
      advancedAnalytics: true,
      portfolioSharing: true,
      customAlerts: true,
    }
  }
};

// Validation schema for plan limit checks
const planLimitSchema = z.object({
  resource: z.enum(['stocks', 'portfolios', 'watchlist', 'notifications']),
  current: z.number().min(0),
  requested: z.number().min(1).optional().default(1),
  feature: z.string().optional(),
});

interface PlanLimitRequest extends Request {
  user: any; // Using any to avoid complex type conflicts
}

/**
 * Middleware to check if user has reached plan limits
 */
export const checkPlanLimit = (resource: 'stocks' | 'portfolios' | 'watchlist' | 'notifications') => {
  return async (req: PlanLimitRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const userTier = req.user.subscriptionTier;
      const isActive = req.user.subscriptionActive;

      // Validate request
      const validation = planLimitSchema.safeParse({
        resource,
        current: 0, // Will be updated below
        requested: 1,
      });

      if (!validation.success) {
        loggerService.warn('Plan limit validation failed', {
          userId,
          resource,
          errors: validation.error.issues,
          requestId: loggerService.getRequestId(),
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid plan limit request',
          requestId: loggerService.getRequestId(),
        });
      }

      // Get user's current usage
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          requestId: loggerService.getRequestId(),
        });
      }

      // Check if subscription is active (premium users only)
      if (userTier !== 'free' && !isActive) {
        loggerService.warn('Inactive subscription attempting to use premium features', {
          userId,
          userTier,
          resource,
          requestId: loggerService.getRequestId(),
        });
        return res.status(403).json({
          success: false,
          message: 'Your subscription is inactive. Please renew to continue using premium features.',
          code: 'SUBSCRIPTION_INACTIVE',
          upgradeUrl: '/upgrade',
          requestId: loggerService.getRequestId(),
        });
      }

      // Get current usage count
      let currentUsage = 0;
      switch (resource) {
        case 'stocks':
          const { default: Portfolio } = await import('../models/Portfolio');
          currentUsage = await Portfolio.countDocuments({ userId });
          break;
        case 'portfolios':
          const { default: PortfolioModel } = await import('../models/Portfolio');
          const portfolios = await PortfolioModel.distinct('portfolioId', { userId });
          currentUsage = portfolios.length;
          break;
        case 'watchlist':
          const { default: Watchlist } = await import('../models/Watchlist');
          currentUsage = await Watchlist.countDocuments({ userId });
          break;
        case 'notifications':
          const { default: Notification } = await import('../models/Notification');
          currentUsage = await Notification.countDocuments({ userId, readAt: null });
          break;
      }

      // Get plan limits
      const limits = PLAN_LIMITS[userTier as keyof typeof PLAN_LIMITS];
      const maxAllowed = limits[`max${resource.charAt(0).toUpperCase() + resource.slice(1)}s` as keyof typeof limits] as number;

      // Check if user would exceed limits
      if (currentUsage >= maxAllowed) {
        loggerService.warn('Plan limit exceeded', {
          userId,
          userTier,
          resource,
          currentUsage,
          maxAllowed,
          requestId: loggerService.getRequestId(),
        });

        return res.status(403).json({
          success: false,
          message: `You've reached your ${userTier} plan limit of ${maxAllowed} ${resource}`,
          code: 'PLAN_LIMIT_EXCEEDED',
          currentUsage,
          maxAllowed,
          userTier,
          upgradeUrl: userTier === 'free' ? '/upgrade' : '/upgrade',
          requestId: loggerService.getRequestId(),
        });
      }

      // Add plan info to request for use in route handlers
      req.planInfo = {
        tier: userTier,
        limits,
        currentUsage,
        maxAllowed,
        canUpgrade: userTier === 'free' || userTier === 'premium',
      };

      loggerService.info('Plan limit check passed', {
        userId,
        userTier,
        resource,
        currentUsage,
        maxAllowed,
        requestId: loggerService.getRequestId(),
      });

      next();
    } catch (error) {
      loggerService.error('Plan limit check error', {
        userId: req.user?._id,
        resource,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: loggerService.getRequestId(),
      });

      res.status(500).json({
        success: false,
        message: 'Failed to check plan limits',
        requestId: loggerService.getRequestId(),
      });
    }
  };
};

/**
 * Middleware to check if user has access to a specific feature
 */
export const checkFeatureAccess = (feature: string) => {
  return async (req: PlanLimitRequest, res: Response, next: NextFunction) => {
    try {
      const userTier = req.user.subscriptionTier;
      const isActive = req.user.subscriptionActive;
      const limits = PLAN_LIMITS[userTier as keyof typeof PLAN_LIMITS];

      // Check if subscription is active for premium users
      if (userTier !== 'free' && !isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your subscription is inactive. Please renew to access premium features.',
          code: 'SUBSCRIPTION_INACTIVE',
          upgradeUrl: '/upgrade',
          requestId: loggerService.getRequestId(),
        });
      }

      // Check feature access
      const hasAccess = limits.features[feature as keyof typeof limits.features];
      
      if (!hasAccess) {
        loggerService.warn('Feature access denied', {
          userId: req.user._id,
          userTier,
          feature,
          requestId: loggerService.getRequestId(),
        });

        return res.status(403).json({
          success: false,
          message: `This feature requires a ${userTier === 'free' ? 'premium' : 'premium+'} subscription`,
          code: 'FEATURE_NOT_AVAILABLE',
          feature,
          userTier,
          upgradeUrl: userTier === 'free' ? '/upgrade' : '/upgrade',
          requestId: loggerService.getRequestId(),
        });
      }

      next();
    } catch (error) {
      loggerService.error('Feature access check error', {
        userId: req.user?._id,
        feature,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: loggerService.getRequestId(),
      });

      res.status(500).json({
        success: false,
        message: 'Failed to check feature access',
        requestId: loggerService.getRequestId(),
      });
    }
  };
};

/**
 * Helper function to get user's plan information
 */
export const getPlanInfo = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return null;
    }

    const limits = PLAN_LIMITS[user.subscriptionTier];
    
    // Get current usage
    const { default: Portfolio } = await import('../models/Portfolio');
    const { default: Watchlist } = await import('../models/Watchlist');
    const { default: Notification } = await import('../models/Notification');

    const currentStocks = await Portfolio.countDocuments({ userId });
    const portfolios = await Portfolio.distinct('portfolioId', { userId });
    const currentPortfolios = portfolios.length;
    const currentWatchlist = await Watchlist.countDocuments({ userId });
    const currentNotifications = await Notification.countDocuments({ userId, readAt: null });

    return {
      tier: user.subscriptionTier,
      active: user.subscriptionActive,
      limits,
      usage: {
        stocks: currentStocks,
        portfolios: currentPortfolios,
        watchlist: currentWatchlist,
        notifications: currentNotifications,
      },
      canUpgrade: user.subscriptionTier === 'free' || user.subscriptionTier === 'premium',
    };
  } catch (error) {
    loggerService.error('Failed to get plan info', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: loggerService.getRequestId(),
    });
    return null;
  }
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      planInfo?: {
        tier: 'free' | 'premium' | 'premium+';
        limits: typeof PLAN_LIMITS.free;
        currentUsage: number;
        maxAllowed: number;
        canUpgrade: boolean;
      };
    }
  }
}
