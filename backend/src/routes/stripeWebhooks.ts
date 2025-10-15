/**
 * 🔗 AI-Capital Stripe Webhooks
 * Handles Stripe webhook events for subscription management
 */

import { Router, Request, Response } from 'express';
import { stripeService } from '../services/stripeService';
import { loggerService } from '../services/loggerService';
import Stripe from 'stripe';

const router = Router();

// Stripe webhook endpoint
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!endpointSecret) {
      loggerService.error('❌ [STRIPE] Webhook secret not configured');
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }

    // Verify webhook signature
    event = Stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    
    loggerService.info(`🔗 [STRIPE] Received webhook event: ${event.type}`, {
      eventId: event.id,
      type: event.type
    });
  } catch (err: any) {
    loggerService.error('❌ [STRIPE] Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await stripeService.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await stripeService.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await stripeService.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await stripeService.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await stripeService.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await stripeService.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.trial_will_end':
        await stripeService.handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      default:
        loggerService.info(`🔗 [STRIPE] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    loggerService.error('❌ [STRIPE] Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Health check for webhooks
router.get('/webhook/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'configured' : 'not configured',
    timestamp: new Date().toISOString()
  });
});

export default router;
