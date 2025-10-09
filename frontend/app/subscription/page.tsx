'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Crown, CreditCard, Star, Check, X } from 'lucide-react';
import ResponsiveNavigation from '@/components/ResponsiveNavigation';

export default function SubscriptionPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/');
      return;
    }
    fetchUserData();
  }, [router]);

  const fetchUserData = async () => {
    try {
      const token = Cookies.get('token');
      console.log('🔍 [SUBSCRIPTION] Fetching user data with token:', token ? 'exists' : 'missing');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔍 [SUBSCRIPTION] User profile response:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('🔍 [SUBSCRIPTION] User data received:', userData);
        setUser(userData);
      } else {
        console.log('🔍 [SUBSCRIPTION] Profile fetch failed, trying subscription status...');
        // Try subscription status endpoint as fallback
        const subResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (subResponse.ok) {
          const subData = await subResponse.json();
          console.log('🔍 [SUBSCRIPTION] Subscription data received:', subData);
          setUser(subData.user || { subscriptionTier: subData.subscriptionTier || 'free' });
        } else {
          setUser({ subscriptionTier: 'free' });
        }
      }
    } catch (error) {
      console.error('❌ [SUBSCRIPTION] Error fetching user data:', error);
      setUser({ subscriptionTier: 'free' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/');
  };

  const handleUpgrade = async (plan: string) => {
    setUpgrading(true);
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Refresh user data
          await fetchUserData();
          alert(`Successfully upgraded to ${plan}!`);
        }
      } else {
        alert('Upgrade failed. Please try again.');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Upgrade failed. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  // Define the three subscription plans
  const plans = {
    free: {
      name: 'Free Plan',
      price: '$0',
      period: 'forever',
      yearlyPrice: null,
      description: 'Perfect for getting started with basic portfolio tracking',
      features: [
        '1 portfolio (Solid or Risky)',
        'Up to 10 stocks per portfolio',
        'AI engine recommendations',
        'Basic performance metrics',
        'Market overview',
        'Email support'
      ],
      limitations: [
        'Only 1 portfolio allowed',
        'Limited to 10 stocks max',
        'No portfolio analysis',
        'No risk management tools',
        'No watchlist',
        'No live notifications'
      ],
      color: 'amber',
      icon: '📊'
    },
    premium: {
      name: 'Premium Plan',
      price: '$9.99',
      period: 'month',
      yearlyPrice: '$79',
      yearlyPeriod: 'year',
      description: 'Advanced features for serious investors',
      features: [
        '3 portfolios (Solid or Risky)',
        'Up to 15 stocks per portfolio',
        'AI engine recommendations',
        'Portfolio Analysis reports',
        'Risk Management tools',
        'Watchlist with live notifications',
        'Advanced performance metrics',
        'Real-time data updates',
        'Priority email support'
      ],
      limitations: [
        'Limited to 3 portfolios',
        'Max 15 stocks per portfolio',
        'No advanced backtesting',
        'No white-label options'
      ],
      color: 'blue',
      icon: '⭐'
    },
    'premium+': {
      name: 'Premium+ Plan',
      price: '$17.99',
      period: 'month',
      yearlyPrice: '$149.99',
      yearlyPeriod: 'year',
      description: 'Complete AI-powered investment suite',
      features: [
        '5 portfolios (Solid or Risky)',
        'Up to 20 stocks per portfolio',
        'AI engine recommendations',
        'Portfolio Analysis reports',
        'Risk Management tools',
        'Watchlist with live notifications',
        'Advanced backtesting tools',
        'Portfolio optimization suggestions',
        'Market sentiment analysis',
        'Priority phone support',
        'White-label options',
        'API access'
      ],
      limitations: [],
      color: 'emerald',
      icon: '👑'
    }
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

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <ResponsiveNavigation 
        userName={user?.name || 'User'} 
        subscriptionTier={currentPlan}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 pt-20 lg:pt-8 pb-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Choose Your Plan</h1>
            <p className="text-slate-400">Select the perfect plan for your investment journey</p>
          </div>

          {/* Current Plan Status */}
          <div className="mb-8">
            <div className={`p-6 rounded-xl border-2 ${
              plans[currentPlan as keyof typeof plans]?.color === 'emerald'
                ? 'bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border-emerald-500/50' 
                : plans[currentPlan as keyof typeof plans]?.color === 'blue'
                ? 'bg-gradient-to-r from-blue-900/30 to-emerald-900/30 border-blue-500/50'
                : 'bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-500/50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{plans[currentPlan as keyof typeof plans]?.icon}</div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Current Plan: {plans[currentPlan as keyof typeof plans]?.name}
                    </h2>
                    <p className="text-slate-400">
                      {plans[currentPlan as keyof typeof plans]?.description}
                    </p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  currentPlan !== 'free'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {currentPlan !== 'free' ? 'Active' : 'Free'}
                </div>
              </div>
            </div>
          </div>

          {/* Plans Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Free Plan */}
            <div className={`relative bg-slate-800 rounded-xl border-2 p-6 flex flex-col ${
              currentPlan === 'free' 
                ? 'border-amber-500/50 bg-gradient-to-b from-amber-900/20 to-slate-800' 
                : 'border-slate-700 hover:border-amber-500/30'
            }`}>
              {currentPlan === 'free' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">{plans.free.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{plans.free.name}</h3>
                <div className="text-3xl font-bold text-amber-400 mb-1">{plans.free.price}</div>
                <div className="text-slate-400 text-sm">{plans.free.period}</div>
                <p className="text-slate-300 text-sm mt-2">{plans.free.description}</p>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                {plans.free.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                {currentPlan === 'free' ? (
                  <button disabled className="w-full px-4 py-3 bg-amber-500/20 text-amber-400 rounded-lg cursor-not-allowed">
                    Current Plan
                  </button>
                ) : (
                  <button 
                    onClick={() => handleUpgrade('free')}
                    disabled={upgrading}
                    className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Downgrade to Free
                  </button>
                )}
              </div>
            </div>

            {/* Premium Plan */}
            <div className={`relative bg-slate-800 rounded-xl border-2 p-6 flex flex-col ${
              currentPlan === 'premium' 
                ? 'border-blue-500/50 bg-gradient-to-b from-blue-900/20 to-slate-800' 
                : 'border-slate-700 hover:border-blue-500/30'
            }`}>
              {currentPlan === 'premium' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">{plans.premium.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{plans.premium.name}</h3>
                <div className="text-3xl font-bold text-blue-400 mb-1">{plans.premium.price}</div>
                <div className="text-slate-400 text-sm">per {plans.premium.period}</div>
                <div className="text-lg font-medium text-blue-300 mb-1">{plans.premium.yearlyPrice}</div>
                <div className="text-slate-400 text-sm">per {plans.premium.yearlyPeriod}</div>
                <p className="text-slate-300 text-sm mt-2">{plans.premium.description}</p>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                {plans.premium.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                {currentPlan === 'premium' ? (
                  <button disabled className="w-full px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg cursor-not-allowed">
                    Current Plan
                  </button>
                ) : (
                  <button 
                    onClick={() => handleUpgrade('premium')}
                    disabled={upgrading}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg transition-all duration-300 font-medium"
                  >
                    {upgrading ? 'Upgrading...' : 'Upgrade to Premium'}
                  </button>
                )}
              </div>
            </div>

            {/* Premium+ Plan */}
            <div className={`relative bg-slate-800 rounded-xl border-2 p-6 flex flex-col ${
              currentPlan === 'premium+' 
                ? 'border-emerald-500/50 bg-gradient-to-b from-emerald-900/20 to-slate-800' 
                : 'border-slate-700 hover:border-emerald-500/30'
            }`}>
              {currentPlan === 'premium+' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">{plans['premium+'].icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{plans['premium+'].name}</h3>
                <div className="text-3xl font-bold text-emerald-400 mb-1">{plans['premium+'].price}</div>
                <div className="text-slate-400 text-sm">per {plans['premium+'].period}</div>
                <div className="text-lg font-medium text-emerald-300 mb-1">{plans['premium+'].yearlyPrice}</div>
                <div className="text-slate-400 text-sm">per {plans['premium+'].yearlyPeriod}</div>
                <p className="text-slate-300 text-sm mt-2">{plans['premium+'].description}</p>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                {plans['premium+'].features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                {currentPlan === 'premium+' ? (
                  <button disabled className="w-full px-4 py-3 bg-emerald-500/20 text-emerald-400 rounded-lg cursor-not-allowed">
                    Current Plan
                  </button>
                ) : (
                  <button 
                    onClick={() => handleUpgrade('premium+')}
                    disabled={upgrading}
                    className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-lg transition-all duration-300 font-medium"
                  >
                    {upgrading ? 'Upgrading...' : 'Upgrade to Premium+'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Billing Information */}
          {currentPlan !== 'free' && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Billing Information
              </h3>
              <div className="bg-slate-800 p-6 rounded-xl">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Plan</span>
                    <span className="text-white font-medium">
                      {plans[currentPlan as keyof typeof plans]?.name} - {plans[currentPlan as keyof typeof plans]?.price}/{plans[currentPlan as keyof typeof plans]?.period}
                    </span>
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
