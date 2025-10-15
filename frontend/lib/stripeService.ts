/**
 * 💳 AI-Capital Frontend Stripe Service
 * Handles Stripe Elements and checkout session creation
 * Version: 2.0 - No duplicate methods
 */

import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51SHKCxJoluh5VDRC_placeholder_key_here');

export interface CreateCheckoutSessionData {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  priceId: string | null;
  features: string[];
  limits: {
    portfolios: number;
    stocks: number;
    watchlist: number;
  };
}

class StripeService {
  private stripe: Promise<Stripe | null> = stripePromise;

  /**
   * Get Stripe instance
   */
  async getStripe(): Promise<Stripe | null> {
    return this.stripe;
  }

  /**
   * Create checkout session
   */
  async createCheckoutSession(data: CreateCheckoutSessionData): Promise<{ sessionId: string; url: string }> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create checkout session');
      }

      return {
        sessionId: result.sessionId,
        url: result.url
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Redirect to checkout
   */
  async redirectToCheckout(data: CreateCheckoutSessionData): Promise<void> {
    try {
      const { url } = await this.createCheckoutSession(data);
      window.location.href = url;
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      throw error;
    }
  }

  /**
   * Create billing portal session with return URL
   */
  async createBillingPortalWithReturnUrl(returnUrl: string): Promise<string> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/create-billing-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ returnUrl })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create billing portal session');
      }

      return result.url;
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      throw error;
    }
  }

  /**
   * Redirect to billing portal
   */
  async redirectToBillingPortal(returnUrl: string): Promise<void> {
    try {
      const url = await this.createBillingPortalSession(returnUrl);
      window.location.href = url;
    } catch (error) {
      console.error('Error redirecting to billing portal:', error);
      throw error;
    }
  }

  /**
   * Get subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/plans`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get subscription plans');
      }

      return result.plans;
    } catch (error) {
      console.error('Error getting subscription plans:', error);
      throw error;
    }
  }

  /**
   * Get subscription details by ID
   */
  async getSubscriptionById(subscriptionId: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/subscription/${subscriptionId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get subscription details');
      }

      return result.subscription;
    } catch (error) {
      console.error('Error getting subscription by ID:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription by ID
   */
  async cancelSubscriptionById(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/subscription/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ cancelAtPeriodEnd })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel subscription');
      }

      return result.subscription;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Reactivate subscription by ID
   */
  async reactivateSubscriptionById(subscriptionId: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/subscription/${subscriptionId}/reactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to reactivate subscription');
      }

      return result.subscription;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  /**
   * Get auth token from cookies
   */
  private getAuthToken(): string {
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
      return tokenCookie ? tokenCookie.split('=')[1] : '';
    }
    return '';
  }

  /**
   * Format price for display
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  }

  /**
   * Get plan display name
   */
  getPlanDisplayName(planId: string): string {
    const names: Record<string, string> = {
      'free': 'Free',
      'premium': 'Premium',
      'premium+': 'Premium+'
    };
    return names[planId] || planId;
  }

  /**
   * Get plan description
   */
  getPlanDescription(planId: string): string {
    const descriptions: Record<string, string> = {
      'free': 'Perfect for getting started with AI-powered portfolio management',
      'premium': 'Advanced features for serious investors',
      'premium+': 'Professional-grade tools for power users'
    };
    return descriptions[planId] || '';
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<any> {
    try {
      const token = this.getAuthToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/subscription`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch subscription');
      }
      
      return data.subscription;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<void> {
    try {
      const token = this.getAuthToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(): Promise<void> {
    try {
      const token = this.getAuthToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/reactivate-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to reactivate subscription');
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  /**
   * Create billing portal session
   */
  async createBillingPortal(): Promise<string> {
    try {
      const token = this.getAuthToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/create-portal-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create portal session');
      }
      
      return data.url;
    } catch (error) {
      console.error('Error creating billing portal:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
export default stripeService;
