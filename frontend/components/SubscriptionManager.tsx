'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Calendar, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { stripeService } from '@/lib/stripeService';
import { useLanguage } from '@/contexts/LanguageContext';

interface SubscriptionData {
  id: string;
  status: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  planType: 'free' | 'premium' | 'premium+';
  price: number;
}

interface SubscriptionManagerProps {
  userId: string;
  onSubscriptionChange?: (subscription: SubscriptionData | null) => void;
}

export default function SubscriptionManager({ userId, onSubscriptionChange }: SubscriptionManagerProps) {
  const { t } = useLanguage();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadSubscription();
  }, [userId]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      const subData = await stripeService.getSubscription();
      setSubscription(subData);
      onSubscriptionChange?.(subData);
    } catch (err: any) {
      console.error('Error loading subscription:', err);
      setError(err.message || 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      setActionLoading('cancel');
      await stripeService.cancelSubscription();
      await loadSubscription(); // Reload to get updated status
    } catch (err: any) {
      console.error('Error canceling subscription:', err);
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription) return;

    try {
      setActionLoading('reactivate');
      await stripeService.reactivateSubscription();
      await loadSubscription(); // Reload to get updated status
    } catch (err: any) {
      console.error('Error reactivating subscription:', err);
      setError(err.message || 'Failed to reactivate subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      setActionLoading('billing');
      const portalUrl = await stripeService.createBillingPortal();
      window.open(portalUrl, '_blank');
    } catch (err: any) {
      console.error('Error opening billing portal:', err);
      setError(err.message || 'Failed to open billing portal');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'canceled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'past_due':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'canceled':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'past_due':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  if (loading) {
    return (
      <div className="card p-6 bg-slate-900 border border-slate-700 rounded-lg shadow-lg">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mr-3" />
          <span className="text-slate-400">Loading subscription details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 bg-slate-900 border border-red-500/20 rounded-lg shadow-lg">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <h3 className="text-lg font-semibold text-red-400">Error Loading Subscription</h3>
        </div>
        <p className="text-red-300 mb-4">{error}</p>
        <button
          onClick={loadSubscription}
          className="btn-secondary"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!subscription || subscription.planType === 'free') {
    return (
      <div className="card p-6 bg-slate-900 border border-slate-700 rounded-lg shadow-lg">
        <div className="flex items-center mb-4">
          <CreditCard className="w-5 h-5 text-slate-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Current Plan</h3>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xl font-bold text-white">Free Plan</h4>
              <p className="text-slate-400">No active subscription</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">$0</div>
              <div className="text-sm text-slate-400">per month</div>
            </div>
          </div>
        </div>
        <button
          onClick={() => window.location.href = '/upgrade'}
          className="btn-primary w-full"
        >
          Upgrade to Premium
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6 bg-slate-900 border border-slate-700 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <CreditCard className="w-5 h-5 text-slate-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Subscription Details</h3>
        </div>
        <div className={`flex items-center px-3 py-1 rounded-full border ${getStatusColor(subscription.status)}`}>
          {getStatusIcon(subscription.status)}
          <span className="ml-2 text-sm font-medium capitalize">
            {subscription.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xl font-bold text-white capitalize">{subscription.planType} Plan</h4>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">${subscription.price}</div>
            <div className="text-sm text-slate-400">per month</div>
          </div>
        </div>
        
        {subscription.cancelAtPeriodEnd && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-3">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
              <span className="text-yellow-400 text-sm">
                Your subscription will end on {formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800/30 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
            <span className="text-sm text-slate-400">Current Period</span>
          </div>
          <div className="text-sm text-white">
            {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
          </div>
        </div>
        
        <div className="bg-slate-800/30 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <CreditCard className="w-4 h-4 text-slate-400 mr-2" />
            <span className="text-sm text-slate-400">Next Billing</span>
          </div>
          <div className="text-sm text-white">
            {subscription.cancelAtPeriodEnd ? 'Cancelled' : formatDate(subscription.currentPeriodEnd)}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleManageBilling}
          disabled={actionLoading === 'billing'}
          className="btn-secondary flex-1 flex items-center justify-center"
        >
          {actionLoading === 'billing' ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <CreditCard className="w-4 h-4 mr-2" />
          )}
          Manage Billing
        </button>

        {subscription.cancelAtPeriodEnd ? (
          <button
            onClick={handleReactivateSubscription}
            disabled={actionLoading === 'reactivate'}
            className="btn-primary flex-1 flex items-center justify-center"
          >
            {actionLoading === 'reactivate' ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Reactivate
          </button>
        ) : (
          <button
            onClick={handleCancelSubscription}
            disabled={actionLoading === 'cancel'}
            className="btn-secondary flex-1 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            {actionLoading === 'cancel' ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <XCircle className="w-4 h-4 mr-2" />
            )}
            Cancel Subscription
          </button>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <button
          onClick={() => window.location.href = '/upgrade'}
          className="btn-primary w-full"
        >
          Change Plan
        </button>
      </div>
    </div>
  );
}
