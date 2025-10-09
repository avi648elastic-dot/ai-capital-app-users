'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Crown, CreditCard, Star, Check, X } from 'lucide-react';
import ResponsiveNavigation from '@/components/ResponsiveNavigation';

export default function SubscriptionPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/');
      return;
    }
    // TODO: Fetch user data
    setUser({ subscriptionTier: 'free' });
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading subscription...</p>
        </div>
      </div>
    );
  }

  const currentPlan = user?.subscriptionTier || 'free';
  const isPremium = currentPlan === 'premium';

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <ResponsiveNavigation 
        userName={user?.name || 'User'} 
        subscriptionTier={currentPlan}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 pt-20 lg:pt-8 pb-8">
        <div className="max-w-4xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Subscription & Billing</h1>
            <p className="text-slate-400">Manage your subscription and billing information</p>
          </div>

          {/* Current Plan Status */}
          <div className="mb-8">
            <div className={`p-6 rounded-xl border-2 ${
              isPremium 
                ? 'bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border-emerald-500/50' 
                : 'bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-500/50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${
                    isPremium ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}>
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {isPremium ? 'Premium Plan' : 'Free Plan'}
                    </h2>
                    <p className="text-slate-400">
                      {isPremium ? 'Full access to all features' : 'Limited features available'}
                    </p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  isPremium 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {isPremium ? 'Active' : 'Upgrade Available'}
                </div>
              </div>
            </div>
          </div>

          {/* Billing Section */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Billing Information
            </h3>
            <div className="bg-slate-800 p-6 rounded-xl">
              {isPremium ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Plan</span>
                    <span className="text-white font-medium">Premium - $29.99/month</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Next Billing Date</span>
                    <span className="text-white">December 15, 2024</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Payment Method</span>
                    <span className="text-white">•••• 4242</span>
                  </div>
                  <button className="w-full mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                    Update Payment Method
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400 mb-4">No billing information available for free accounts</p>
                  <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:from-blue-500 hover:to-emerald-500 transition-all duration-300">
                    Upgrade to Premium
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Upgrade Section */}
          {!isPremium && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Upgrade to Premium
              </h3>
              <div className="bg-gradient-to-r from-blue-900/30 to-emerald-900/30 border border-blue-500/50 p-6 rounded-xl">
                <div className="text-center mb-6">
                  <h4 className="text-2xl font-bold text-white mb-2">Premium Plan</h4>
                  <p className="text-blue-200">$29.99/month</p>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-slate-300">Advanced Portfolio Analysis</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-slate-300">Detailed Reports</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-slate-300">Risk Management Tools</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-slate-300">Watchlist Management</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-slate-300">Priority Support</span>
                  </div>
                </div>
                
                <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:from-blue-500 hover:to-emerald-500 transition-all duration-300 font-medium">
                  Start Premium Trial
                </button>
              </div>
            </div>
          )}

          {/* Cancel Subscription */}
          {isPremium && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4">Manage Subscription</h3>
              <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-white mb-1">Cancel Subscription</h4>
                    <p className="text-red-200">You will lose access to premium features at the end of your billing period.</p>
                  </div>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors">
                    Cancel Plan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
