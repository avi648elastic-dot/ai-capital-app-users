'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Crown, CreditCard, Star, Check, X } from 'lucide-react';

export default function SubscriptionPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [router]);

  const handleUpgrade = async (plan: string) => {
    setUpgrading(true);
    try {
      const token = Cookies.get('token');
      if (!token) return;

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/upgrade`, {
        plan
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Upgrade initiated! Please complete payment to activate your new plan.');
        // In a real app, you would redirect to payment processing
      }
    } catch (error) {
      console.error('Error upgrading:', error);
      alert('Failed to upgrade. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const currentPlan = user?.subscriptionTier || 'free';

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Choose Your Plan</h1>
        <p className="text-slate-400">Select the perfect plan for your investment journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
        {/* Free Plan */}
        <div className={`card p-6 sm:p-8 relative ${currentPlan === 'free' ? 'ring-2 ring-primary-500' : ''}`}>
          {currentPlan === 'free' && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Current Plan
              </span>
            </div>
          )}
          
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Free</h3>
            <div className="text-3xl font-bold text-white mb-1">$0</div>
            <div className="text-slate-400">Forever</div>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center text-slate-300">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">1 Portfolio</span>
            </li>
            <li className="flex items-center text-slate-300">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">10 Stocks per Portfolio</span>
            </li>
            <li className="flex items-center text-slate-300">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">Basic AI Analysis</span>
            </li>
            <li className="flex items-center text-slate-300">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">Performance Tracking</span>
            </li>
            <li className="flex items-center text-slate-300">
              <X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
              <span className="text-sm text-slate-500">Advanced Analytics</span>
            </li>
            <li className="flex items-center text-slate-300">
              <X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
              <span className="text-sm text-slate-500">Risk Management</span>
            </li>
          </ul>

          <button
            disabled={currentPlan === 'free' || upgrading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              currentPlan === 'free' 
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            {currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
          </button>
        </div>

        {/* Premium Plan */}
        <div className={`card p-6 sm:p-8 relative ${currentPlan === 'premium' ? 'ring-2 ring-primary-500' : 'border-primary-500'}`}>
          {currentPlan === 'premium' && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Current Plan
              </span>
            </div>
          )}
          
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-2">
              <Crown className="w-6 h-6 text-yellow-500 mr-2" />
              <h3 className="text-xl font-bold text-white">Premium</h3>
            </div>
            <div className="text-3xl font-bold text-white mb-1">$9.99</div>
            <div className="text-slate-400">per month</div>
            <div className="text-sm text-slate-500 mt-1">or $79/year (33% off)</div>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center text-slate-300">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">3 Solid + 3 Risky Portfolios</span>
            </li>
            <li className="flex items-center text-slate-300">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">15 Stocks per Portfolio</span>
            </li>
            <li className="flex items-center text-slate-300">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">Advanced AI Analysis</span>
            </li>
            <li className="flex items-center text-slate-300">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">Portfolio Analysis</span>
            </li>
            <li className="flex items-center text-slate-300">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">Risk Management</span>
            </li>
            <li className="flex items-center text-slate-300">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">Watchlist</span>
            </li>
          </ul>

          <button
            onClick={() => handleUpgrade('premium')}
            disabled={currentPlan === 'premium' || upgrading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              currentPlan === 'premium'
                ? 'bg-primary-500 text-white cursor-not-allowed'
                : 'bg-primary-500 hover:bg-primary-600 text-white'
            }`}
          >
            {currentPlan === 'premium' ? 'Current Plan' : upgrading ? 'Processing...' : 'Upgrade to Premium'}
          </button>
        </div>

        {/* Premium+ Plan */}
        <div className={`card p-6 sm:p-8 relative ${currentPlan === 'premium+' ? 'ring-2 ring-primary-500' : 'border-yellow-500'}`}>
          {currentPlan === 'premium+' && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Current Plan
              </span>
            </div>
          )}
          
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-2">
              <Star className="w-6 h-6 text-yellow-500 mr-2" />
              <h3 className="text-xl font-bold text-white">Premium+</h3>
            </div>
            <div className="text-3xl font-bold text-white mb-1">$17.99</div>
            <div className="text-slate-400">per month</div>
            <div className="text-sm text-slate-500 mt-1">or $149.99/year (31% off)</div>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center text-slate-300">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">5 Solid + 5 Risky Portfolios</span>
            </li>
            <li className="flex items-center text-slate-300">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">20 Stocks per Portfolio</span>
            </li>
            <li className="flex items-center text-slate-300">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">Premium AI Analysis</span>
            </li>
            <li className="flex items-center text-slate-300">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">Advanced Analytics</span>
            </li>
            <li className="flex items-center text-slate-300">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">Custom Reports</span>
            </li>
            <li className="flex items-center text-slate-300">
              <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">Priority Support</span>
            </li>
          </ul>

          <button
            onClick={() => handleUpgrade('premium+')}
            disabled={currentPlan === 'premium+' || upgrading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              currentPlan === 'premium+'
                ? 'bg-yellow-500 text-white cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            {currentPlan === 'premium+' ? 'Current Plan' : upgrading ? 'Processing...' : 'Upgrade to Premium+'}
          </button>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-12 text-center">
        <div className="bg-slate-800 rounded-xl p-6 max-w-2xl mx-auto">
          <CreditCard className="w-8 h-8 text-primary-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Secure Payment</h3>
          <p className="text-slate-400 text-sm">
            All payments are processed securely. You can cancel or change your plan at any time.
          </p>
        </div>
      </div>
    </div>
  );
}