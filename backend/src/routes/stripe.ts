/**
 * 💳 AI-Capital Stripe Routes
 * Handles all Stripe payment and subscription endpoints
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { stripeService } from '../services/stripeService';
import { loggerService } from '../services/loggerService';
// import { body, validationResult } from 'express-validator';

const router = Router();

/**
 * Create checkout session for subscription
 * POST /api/stripe/create-checkout-session
 */
router.post('/create-checkout-session', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Manual validation
    const { priceId, successUrl, cancelUrl } = req.body;
    
    if (!priceId || typeof priceId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Price ID is required and must be a string'
      });
    }
    
    if (!successUrl || typeof successUrl !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Success URL is required and must be a string'
      });
    }
    
    if (!cancelUrl || typeof cancelUrl !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Cancel URL is required and must be a string'
      });
    }

    const userId = (req as any).user._id || (req as any).user.id;
    const userEmail = (req as any).user.email;

    loggerService.info(`💳 [STRIPE] Creating checkout session for user ${userId}`, { priceId });

    const session = await stripeService.createCheckoutSession({
      userId,
      userEmail,
      priceId,
      successUrl,
      cancelUrl
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    loggerService.error(`❌ [STRIPE] Error creating checkout session`, { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session'
    });
  }
});

/**
 * Create billing portal session
 * POST /api/stripe/create-billing-portal-session
 */
router.post('/create-billing-portal-session', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Manual validation
    const { returnUrl } = req.body;
    
    if (!returnUrl || typeof returnUrl !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Return URL is required and must be a string'
      });
    }

    const userId = (req as any).user._id || (req as any).user.id;

    // For now, we'll need to get the customer ID from the user record
    // You'll need to add a stripeCustomerId field to your User model
    const user = (req as any).user;
    const customerId = user.stripeCustomerId;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'No Stripe customer found. Please contact support.'
      });
    }

    loggerService.info(`💳 [STRIPE] Creating billing portal session for user ${userId}`, { customerId });

    const session = await stripeService.createBillingPortalSession(customerId, returnUrl);

    res.json({
      success: true,
      url: session.url
    });

  } catch (error) {
    loggerService.error(`❌ [STRIPE] Error creating billing portal session`, { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create billing portal session'
    });
  }
});

/**
 * Get subscription details
 * GET /api/stripe/subscription/:subscriptionId
 */
router.get('/subscription/:subscriptionId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const userId = (req as any).user._id || (req as any).user.id;

    loggerService.info(`💳 [STRIPE] Getting subscription ${subscriptionId} for user ${userId}`);

    const subscription = await stripeService.getSubscription(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    // Verify the subscription belongs to the user
    const customerId = subscription.customer as string;
    const customer = await stripeService.getCustomer(customerId);
    
    if (!customer || customer.metadata?.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: (subscription as any).current_period_start,
        currentPeriodEnd: (subscription as any).current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        planType: stripeService.getPlanTypeFromPriceId(subscription.items.data[0].price.id)
      }
    });

  } catch (error) {
    loggerService.error(`❌ [STRIPE] Error getting subscription`, { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription details'
    });
  }
});

/**
 * Cancel subscription
 * POST /api/stripe/subscription/:subscriptionId/cancel
 */
router.post('/subscription/:subscriptionId/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const userId = (req as any).user._id || (req as any).user.id;
    const { cancelAtPeriodEnd = true } = req.body;

    loggerService.info(`💳 [STRIPE] Cancelling subscription ${subscriptionId} for user ${userId}`);

    // Verify subscription belongs to user
    const subscription = await stripeService.getSubscription(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    const customerId = subscription.customer as string;
    const customer = await stripeService.getCustomer(customerId);
    
    if (!customer || customer.metadata?.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const cancelledSubscription = await stripeService.cancelSubscription(subscriptionId, cancelAtPeriodEnd);

    res.json({
      success: true,
      message: cancelAtPeriodEnd ? 'Subscription will be cancelled at the end of the current period' : 'Subscription cancelled immediately',
      subscription: {
        id: cancelledSubscription.id,
        status: cancelledSubscription.status,
        cancelAtPeriodEnd: cancelledSubscription.cancel_at_period_end
      }
    });

  } catch (error) {
    loggerService.error(`❌ [STRIPE] Error cancelling subscription`, { error });
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    });
  }
});

/**
 * Reactivate subscription
 * POST /api/stripe/subscription/:subscriptionId/reactivate
 */
router.post('/subscription/:subscriptionId/reactivate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const userId = (req as any).user._id || (req as any).user.id;

    loggerService.info(`💳 [STRIPE] Reactivating subscription ${subscriptionId} for user ${userId}`);

    // Verify subscription belongs to user
    const subscription = await stripeService.getSubscription(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    const customerId = subscription.customer as string;
    const customer = await stripeService.getCustomer(customerId);
    
    if (!customer || customer.metadata?.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const reactivatedSubscription = await stripeService.reactivateSubscription(subscriptionId);

    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
      subscription: {
        id: reactivatedSubscription.id,
        status: reactivatedSubscription.status,
        cancelAtPeriodEnd: reactivatedSubscription.cancel_at_period_end
      }
    });

  } catch (error) {
    loggerService.error(`❌ [STRIPE] Error reactivating subscription`, { error });
    res.status(500).json({
      success: false,
      error: 'Failed to reactivate subscription'
    });
  }
});

/**
 * Stripe webhook endpoint
 * POST /api/stripe/webhook
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const payload = JSON.stringify(req.body);

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing Stripe signature'
      });
    }

    await stripeService.handleWebhook(payload, signature);

    res.json({ success: true, received: true });

  } catch (error) {
    loggerService.error(`❌ [STRIPE] Webhook error`, { error });
    res.status(400).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

/**
 * Get subscription plans
 * GET /api/stripe/plans
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        priceId: null,
        features: [
          'Up to 5 stocks in watchlist',
          'Basic portfolio tracking',
          'AI recommendations',
          'Real-time price updates'
        ],
        limits: {
          portfolios: 1,
          stocks: 5,
          watchlist: 5
        }
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 9.99,
        priceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_1SHKPDJoluh5VDRCioKOKTOH',
        features: [
          'Up to 15 stocks per portfolio',
          'Advanced analytics',
          'Risk management tools',
          'Priority support',
          'All Free features'
        ],
        limits: {
          portfolios: 3,
          stocks: 15,
          watchlist: 15
        }
      },
      {
        id: 'premium+',
        name: 'Premium+',
        price: 19.99,
        priceId: process.env.STRIPE_PREMIUM_PLUS_PRICE_ID || 'price_1SHKPnJoluh5VDRCYcSxV4jb',
        features: [
          'Unlimited stocks',
          'Advanced risk analysis',
          'Multi-portfolio management',
          'Custom alerts',
          'API access',
          'All Premium features'
        ],
        limits: {
          portfolios: -1, // unlimited
          stocks: -1, // unlimited
          watchlist: -1 // unlimited
        }
      }
    ];

    res.json({
      success: true,
      plans
    });

  } catch (error) {
    loggerService.error(`❌ [STRIPE] Error getting plans`, { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription plans'
    });
  }
});

/**
 * Get user subscription
 * GET /api/stripe/subscription
 */
router.get('/subscription', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const subscription = await stripeService.getSubscription(userId);
    
    res.json({
      success: true,
      subscription
    });
  } catch (error: any) {
    loggerService.error('❌ [STRIPE] Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription'
    });
  }
});

/**
 * Cancel subscription
 * POST /api/stripe/cancel-subscription
 */
router.post('/cancel-subscription', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    await stripeService.cancelSubscription(userId);
    
    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error: any) {
    loggerService.error('❌ [STRIPE] Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    });
  }
});

/**
 * Reactivate subscription
 * POST /api/stripe/reactivate-subscription
 */
router.post('/reactivate-subscription', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    await stripeService.reactivateSubscription(userId);
    
    res.json({
      success: true,
      message: 'Subscription reactivated successfully'
    });
  } catch (error: any) {
    loggerService.error('❌ [STRIPE] Error reactivating subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reactivate subscription'
    });
  }
});

/**
 * Create billing portal session
 * POST /api/stripe/create-portal-session
 */
router.post('/create-portal-session', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const userEmail = (req as any).user.email;
    const returnUrl = req.body.returnUrl || `${process.env.FRONTEND_URL}/dashboard`;
    
    const session = await stripeService.createBillingPortalSession({
      userId,
      userEmail,
      returnUrl
    });
    
    res.json({
      success: true,
      url: session.url
    });
  } catch (error: any) {
    loggerService.error('❌ [STRIPE] Error creating portal session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create billing portal session'
    });
  }
});

export default router;
