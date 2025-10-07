'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Check, Star, Zap, Shield, Users } from 'lucide-react';

export default function Upgrade() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      window.location.href = '/';
      return;
    }
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    // TODO: implement payment integration
    alert('Payment integration coming soon!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (user?.subscriptionTier === 'premium') {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">You're Already Premium!</h1>
            <p className="text-slate-400 mb-8">Enjoy all the premium features</p>
            <button
              onClick={() => window.history.back()}
              className="btn-primary"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Multiple Portfolios",
      description: "Create up to 6 portfolios (3 Solid + 3 Dangerous)",
      free: "1 portfolio only",
      premium: "6 portfolios"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "More Stocks",
      description: "Add up to 20 stocks per portfolio",
      free: "10 stocks per portfolio",
      premium: "20 stocks per portfolio"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Both Portfolio Types",
      description: "Access to both Solid and Dangerous portfolios",
      free: "1 portfolio type only",
      premium: "Both types"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Custom Featured Stocks",
      description: "Customize your market overview",
      free: "Default stocks only",
      premium: "Fully customizable"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Upgrade to Premium</h1>
          <p className="text-xl text-slate-400">Unlock the full potential of your portfolio management</p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="card p-8 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Premium Plan</h2>
              <div className="text-5xl font-bold text-primary-500 mb-2">$29</div>
              <div className="text-slate-400">per month</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">What's Included</h3>
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="text-primary-500 mt-1">{feature.icon}</div>
                    <div>
                      <div className="text-white font-medium">{feature.title}</div>
                      <div className="text-slate-400 text-sm">{feature.description}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">Comparison</h3>
                {features.map((feature, index) => (
                  <div key={index} className="space-y-2">
                    <div className="text-white font-medium">{feature.title}</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Free: {feature.free}</span>
                      <span className="text-primary-400">Premium: {feature.premium}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center mt-8">
              <button
                onClick={handleUpgrade}
                className="btn-primary text-lg px-8 py-4"
              >
                Upgrade Now
              </button>
              <p className="text-sm text-slate-400 mt-4">
                Cancel anytime • 30-day money-back guarantee
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div className="card p-6">
              <h4 className="text-white font-semibold mb-2">Can I cancel anytime?</h4>
              <p className="text-slate-400">Yes, you can cancel your subscription at any time. You'll continue to have premium access until the end of your billing period.</p>
            </div>
            <div className="card p-6">
              <h4 className="text-white font-semibold mb-2">What happens to my data if I downgrade?</h4>
              <p className="text-slate-400">Your data is always safe. If you downgrade, you'll keep your first portfolio and can access it with free features.</p>
            </div>
            <div className="card p-6">
              <h4 className="text-white font-semibold mb-2">Do you offer refunds?</h4>
              <p className="text-slate-400">Yes, we offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
