/**
 * 💳 AI-Capital Stripe Integration Service
 * Handles all Stripe payment processing and subscription management
 */

import Stripe from 'stripe';
import { loggerService } from './loggerService';
import User from '../models/User';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_REPLACE_WITH_YOUR_STRIPE_SECRET_KEY', {
  apiVersion: '2025-09-30.clover',
});

export interface CreateCheckoutSessionData {
  userId: string;
  userEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCustomerData {
  email: string;
  name?: string;
  userId: string;
}

export interface SubscriptionData {
  id: string;
  customerId: string;
  priceId: string;
  status: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  planType: 'free' | 'premium' | 'premium+';
}

class StripeService {
  /**
   * Create a new Stripe customer
   */
  async createCustomer(data: CreateCustomerData): Promise<Stripe.Customer> {
    try {
      loggerService.info(`💳 [STRIPE] Creating customer for user ${data.userId}`, { email: data.email });

      const customer = await stripe.customers.create({
        email: data.email,
        name: data.name,
        metadata: {
          userId: data.userId,
          source: 'ai-capital'
        }
      });

      loggerService.info(`✅ [STRIPE] Customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      loggerService.error(`❌ [STRIPE] Error creating customer`, { error, userId: data.userId });
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      return customer as Stripe.Customer;
    } catch (error) {
      loggerService.error(`❌ [STRIPE] Error retrieving customer ${customerId}`, { error });
      return null;
    }
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(data: CreateCheckoutSessionData): Promise<Stripe.Checkout.Session> {
    try {
      loggerService.info(`💳 [STRIPE] Creating checkout session for user ${data.userId}`, { priceId: data.priceId });

      const session = await stripe.checkout.sessions.create({
        customer_email: data.userEmail,
        payment_method_types: ['card'],
        line_items: [
          {
            price: data.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        metadata: {
          userId: data.userId,
          source: 'ai-capital'
        },
        subscription_data: {
          metadata: {
            userId: data.userId,
            source: 'ai-capital'
          }
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
      });

      loggerService.info(`✅ [STRIPE] Checkout session created: ${session.id}`);
      return session;
    } catch (error) {
      loggerService.error(`❌ [STRIPE] Error creating checkout session`, { error, userId: data.userId });
      throw error;
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      loggerService.error(`❌ [STRIPE] Error retrieving subscription ${subscriptionId}`, { error });
      return null;
    }
  }

  /**
   * Get customer's subscriptions
   */
  async getCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 10
      });

      return subscriptions.data;
    } catch (error) {
      loggerService.error(`❌ [STRIPE] Error retrieving customer subscriptions`, { error, customerId });
      return [];
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<Stripe.Subscription> {
    try {
      loggerService.info(`💳 [STRIPE] Cancelling subscription ${subscriptionId}`, { cancelAtPeriodEnd });

      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd
      });

      loggerService.info(`✅ [STRIPE] Subscription cancelled: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      loggerService.error(`❌ [STRIPE] Error cancelling subscription`, { error, subscriptionId });
      throw error;
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      loggerService.info(`💳 [STRIPE] Reactivating subscription ${subscriptionId}`);

      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false
      });

      loggerService.info(`✅ [STRIPE] Subscription reactivated: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      loggerService.error(`❌ [STRIPE] Error reactivating subscription`, { error, subscriptionId });
      throw error;
    }
  }

  /**
   * Create billing portal session
   */
  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    try {
      loggerService.info(`💳 [STRIPE] Creating billing portal session for customer ${customerId}`);

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      loggerService.info(`✅ [STRIPE] Billing portal session created: ${session.id}`);
      return session;
    } catch (error) {
      loggerService.error(`❌ [STRIPE] Error creating billing portal session`, { error, customerId });
      throw error;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(payload: string, signature: string): Promise<void> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('Stripe webhook secret not configured');
      }

      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      
      loggerService.info(`💳 [STRIPE] Webhook received: ${event.type}`, { eventId: event.id });

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
        
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        
        default:
          loggerService.info(`💳 [STRIPE] Unhandled webhook event: ${event.type}`);
      }
    } catch (error) {
      loggerService.error(`❌ [STRIPE] Webhook error`, { error });
      throw error;
    }
  }

  /**
   * Handle checkout session completed
   */
  async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    try {
      const userId = session.metadata?.userId;
      if (!userId) {
        loggerService.warn(`⚠️ [STRIPE] Checkout completed without userId`, { sessionId: session.id });
        return;
      }

      loggerService.info(`✅ [STRIPE] Checkout completed for user ${userId}`, { sessionId: session.id });
      
      // Update user with Stripe customer ID
      const customerId = session.customer as string;
      if (customerId) {
        await User.findByIdAndUpdate(userId, {
          stripeCustomerId: customerId
        });
        loggerService.info(`✅ [STRIPE] Updated user ${userId} with customer ID ${customerId}`);
      }
    } catch (error) {
      loggerService.error(`❌ [STRIPE] Error handling checkout completed`, { error, sessionId: session.id });
    }
  }

  /**
   * Handle subscription created
   */
  async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    try {
      const userId = subscription.metadata?.userId;
      if (!userId) {
        loggerService.warn(`⚠️ [STRIPE] Subscription created without userId`, { subscriptionId: subscription.id });
        return;
      }

      loggerService.info(`✅ [STRIPE] Subscription created for user ${userId}`, { 
        subscriptionId: subscription.id,
        status: subscription.status 
      });
      
      // Determine subscription tier from price ID
      const priceId = subscription.items.data[0]?.price.id;
      const planType = this.getPlanTypeFromPriceId(priceId);
      
      // Update user with subscription details
      await User.findByIdAndUpdate(userId, {
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status as any,
        subscriptionActive: subscription.status === 'active' || subscription.status === 'trialing',
        subscriptionTier: planType,
        subscriptionEndDate: new Date((subscription as any).current_period_end * 1000)
      });
      
      loggerService.info(`✅ [STRIPE] Updated user ${userId} subscription to ${planType}`);
    } catch (error) {
      loggerService.error(`❌ [STRIPE] Error handling subscription created`, { error, subscriptionId: subscription.id });
    }
  }

  /**
   * Handle subscription updated
   */
  async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      const userId = subscription.metadata?.userId;
      if (!userId) {
        loggerService.warn(`⚠️ [STRIPE] Subscription updated without userId`, { subscriptionId: subscription.id });
        return;
      }

      loggerService.info(`✅ [STRIPE] Subscription updated for user ${userId}`, { 
        subscriptionId: subscription.id,
        status: subscription.status 
      });
      
      // Determine subscription tier from price ID
      const priceId = subscription.items.data[0]?.price.id;
      const planType = this.getPlanTypeFromPriceId(priceId);
      
      // Update user with new subscription details
      await User.findByIdAndUpdate(userId, {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status as any,
        subscriptionActive: subscription.status === 'active' || subscription.status === 'trialing',
        subscriptionTier: planType,
        subscriptionEndDate: new Date((subscription as any).current_period_end * 1000)
      });
      
      loggerService.info(`✅ [STRIPE] Updated user ${userId} subscription status to ${subscription.status}`);
    } catch (error) {
      loggerService.error(`❌ [STRIPE] Error handling subscription updated`, { error, subscriptionId: subscription.id });
    }
  }

  /**
   * Handle subscription deleted
   */
  async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      const userId = subscription.metadata?.userId;
      if (!userId) {
        loggerService.warn(`⚠️ [STRIPE] Subscription deleted without userId`, { subscriptionId: subscription.id });
        return;
      }

      loggerService.info(`✅ [STRIPE] Subscription deleted for user ${userId}`, { subscriptionId: subscription.id });
      
      // Downgrade user to free tier
      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: 'canceled',
        subscriptionActive: false,
        subscriptionTier: 'free',
        stripeSubscriptionId: null,
        subscriptionEndDate: new Date()
      });
      
      loggerService.info(`✅ [STRIPE] Downgraded user ${userId} to free tier`);
    } catch (error) {
      loggerService.error(`❌ [STRIPE] Error handling subscription deleted`, { error, subscriptionId: subscription.id });
    }
  }

  /**
   * Handle payment succeeded
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    try {
      const subscriptionId = (invoice as any).subscription as string;
      if (!subscriptionId) {
        loggerService.warn(`⚠️ [STRIPE] Payment succeeded without subscription`, { invoiceId: invoice.id });
        return;
      }

      loggerService.info(`✅ [STRIPE] Payment succeeded`, { 
        invoiceId: invoice.id,
        subscriptionId: subscriptionId,
        amount: invoice.amount_paid 
      });
      
      // Here you would update your database to mark payment as successful
      // For now, just log it
    } catch (error) {
      loggerService.error(`❌ [STRIPE] Error handling payment succeeded`, { error, invoiceId: invoice.id });
    }
  }

  /**
   * Handle payment failed
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    try {
      const subscriptionId = (invoice as any).subscription as string;
      if (!subscriptionId) {
        loggerService.warn(`⚠️ [STRIPE] Payment failed without subscription`, { invoiceId: invoice.id });
        return;
      }

      loggerService.info(`❌ [STRIPE] Payment failed`, { 
        invoiceId: invoice.id,
        subscriptionId: subscriptionId,
        amount: invoice.amount_due 
      });
      
      // Here you would update your database to mark payment as failed
      // For now, just log it
    } catch (error) {
      loggerService.error(`❌ [STRIPE] Error handling payment failed`, { error, invoiceId: invoice.id });
    }
  }

  /**
   * Get plan type from price ID
   */
  getPlanTypeFromPriceId(priceId: string): 'premium' | 'premium+' | 'free' {
    // Your actual Stripe Price IDs
    const premiumPriceId = process.env.STRIPE_PREMIUM_PRICE_ID || 'price_1SHKPDJoluh5VDRCioKOKTOH';
    const premiumPlusPriceId = process.env.STRIPE_PREMIUM_PLUS_PRICE_ID || 'price_1SHKPnJoluh5VDRCYcSxV4jb';
    
    if (priceId === premiumPriceId) {
      return 'premium';
    } else if (priceId === premiumPlusPriceId) {
      return 'premium+';
    } else {
      return 'free';
    }
  }

  /**
   * Get price ID from plan type
   */
  getPriceIdFromPlanType(planType: 'premium' | 'premium+'): string {
    const premiumPriceId = process.env.STRIPE_PREMIUM_PRICE_ID || 'price_1SHKPDJoluh5VDRCioKOKTOH';
    const premiumPlusPriceId = process.env.STRIPE_PREMIUM_PLUS_PRICE_ID || 'price_1SHKPnJoluh5VDRCYcSxV4jb';
    
    return planType === 'premium' ? premiumPriceId : premiumPlusPriceId;
  }

  /**
   * Handle invoice payment succeeded
   */
  async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    try {
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
      if (!subscriptionId) {
        loggerService.warn(`⚠️ [STRIPE] Payment succeeded without subscription`, { invoiceId: invoice.id });
        return;
      }

      loggerService.info(`✅ [STRIPE] Payment succeeded`, { 
        invoiceId: invoice.id,
        subscriptionId,
        amount: invoice.amount_paid
      });

      // Update user subscription status
      await User.findOneAndUpdate(
        { stripeSubscriptionId: subscriptionId },
        { 
          subscriptionStatus: 'active',
          subscriptionActive: true,
          lastPaymentDate: new Date()
        }
      );
    } catch (error) {
      loggerService.error(`❌ [STRIPE] Error handling payment succeeded`, { error, invoiceId: invoice.id });
    }
  }

  /**
   * Handle invoice payment failed
   */
  async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    try {
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
      if (!subscriptionId) {
        loggerService.warn(`⚠️ [STRIPE] Payment failed without subscription`, { invoiceId: invoice.id });
        return;
      }

      loggerService.info(`❌ [STRIPE] Payment failed`, { 
        invoiceId: invoice.id,
        subscriptionId,
        amount: invoice.amount_due
      });

      // Update user subscription status
      await User.findOneAndUpdate(
        { stripeSubscriptionId: subscriptionId },
        { 
          subscriptionStatus: 'past_due',
          subscriptionActive: false
        }
      );
    } catch (error) {
      loggerService.error(`❌ [STRIPE] Error handling payment failed`, { error, invoiceId: invoice.id });
    }
  }

  /**
   * Handle trial will end
   */
  async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    try {
      const userId = subscription.metadata?.userId;
      if (!userId) {
        loggerService.warn(`⚠️ [STRIPE] Trial ending without user ID`, { subscriptionId: subscription.id });
        return;
      }

      loggerService.info(`⚠️ [STRIPE] Trial ending soon`, { 
        subscriptionId: subscription.id,
        userId,
        trialEnd: subscription.trial_end
      });

      // Here you could send an email notification to the user
      // For now, just log it
    } catch (error) {
      loggerService.error(`❌ [STRIPE] Error handling trial will end`, { error, subscriptionId: subscription.id });
    }
  }

  /**
   * Get user subscription by user ID
   */
  async getUserSubscription(userId: string): Promise<any> {
    try {
      const user = await User.findById(userId);
      if (!user || !user.stripeSubscriptionId) {
        return null;
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        planType: this.getPlanTypeFromPriceId(subscription.items.data[0]?.price.id || ''),
        price: subscription.items.data[0]?.price.unit_amount ? subscription.items.data[0].price.unit_amount / 100 : 0
      };
    } catch (error: any) {
      loggerService.error('❌ [STRIPE] Error getting user subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel user subscription by user ID
   */
  async cancelUserSubscription(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user || !user.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      loggerService.info(`✅ [STRIPE] Subscription cancelled for user ${userId}`, {
        subscriptionId: user.stripeSubscriptionId
      });
    } catch (error: any) {
      loggerService.error('❌ [STRIPE] Error cancelling user subscription:', error);
      throw error;
    }
  }

  /**
   * Reactivate user subscription by user ID
   */
  async reactivateUserSubscription(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user || !user.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: false
      });

      loggerService.info(`✅ [STRIPE] Subscription reactivated for user ${userId}`, {
        subscriptionId: user.stripeSubscriptionId
      });
    } catch (error: any) {
      loggerService.error('❌ [STRIPE] Error reactivating user subscription:', error);
      throw error;
    }
  }

  /**
   * Create billing portal session for user
   */
  async createUserBillingPortalSession(data: {
    userId: string;
    userEmail: string;
    returnUrl: string;
  }): Promise<Stripe.BillingPortal.Session> {
    try {
      const user = await User.findById(data.userId);
      if (!user || !user.stripeCustomerId) {
        throw new Error('No Stripe customer found');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: data.returnUrl
      });

      loggerService.info(`✅ [STRIPE] Billing portal session created for user ${data.userId}`);
      return session;
    } catch (error: any) {
      loggerService.error('❌ [STRIPE] Error creating user billing portal session:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
