'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Zap, TrendingUp, Shield, Crown } from 'lucide-react';
import Header from '@/components/Header';

export default function UpgradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      icon: Shield,
      color: 'from-slate-600 to-slate-700',
      features: [
        { text: '1 Portfolio', included: true },
        { text: '10 Stocks Maximum', included: true },
        { text: 'Basic Analytics', included: true },
        { text: 'Email Support', included: true },
        { text: 'Multiple Portfolios', included: false },
        { text: 'Advanced Analytics', included: false },
        { text: 'Priority Support', included: false },
        { text: 'API Access', included: false },
      ],
      cta: 'Current Plan',
      disabled: true
    },
    {
      name: 'Premium',
      price: '$9.99',
      period: 'per month',
      icon: Zap,
      color: 'from-blue-600 to-blue-700',
      popular: true,
      features: [
        { text: '3 Portfolios', included: true },
        { text: '15 Stocks per Portfolio', included: true },
        { text: 'Advanced Analytics', included: true },
        { text: 'Real-time Alerts', included: true },
        { text: 'Priority Email Support', included: true },
        { text: 'Custom Reports', included: true },
        { text: 'API Access', included: false },
        { text: 'Dedicated Support', included: false },
      ],
      cta: 'Upgrade to Premium',
      comingSoon: true
    },
    {
      name: 'Premium+',
      price: '$19.99',
      period: 'per month',
      icon: Crown,
      color: 'from-purple-600 to-purple-700',
      features: [
        { text: 'Unlimited Portfolios', included: true },
        { text: '20 Stocks per Portfolio', included: true },
        { text: 'Advanced Analytics & AI Insights', included: true },
        { text: 'Real-time Alerts & Notifications', included: true },
        { text: 'Priority Support (24/7)', included: true },
        { text: 'Custom Reports & Export', included: true },
        { text: 'Full API Access', included: true },
        { text: 'Dedicated Account Manager', included: true },
      ],
      cta: 'Upgrade to Premium+',
      comingSoon: true
    }
  ];

  const handleUpgrade = async (planName: string) => {
    if (loading) return;
    
    setLoading(true);
    
    // TODO: Integrate Stripe checkout
    alert(`Stripe integration coming soon! You selected: ${planName}`);
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header showNavigation={false} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Unlock the full power of AI-driven portfolio management.
            Start with our free plan and upgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <div
                key={index}
                className={`relative rounded-2xl border-2 ${
                  plan.popular 
                    ? 'border-blue-500 shadow-2xl shadow-blue-500/20 scale-105' 
                    : 'border-slate-700'
                } bg-slate-800/50 backdrop-blur-sm p-8 transition-all hover:scale-105 ${
                  plan.popular ? 'z-10' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full text-white text-sm font-bold">
                    ⭐ MOST POPULAR
                  </div>
                )}

                {/* Coming Soon Badge */}
                {plan.comingSoon && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-yellow-600 rounded-full text-white text-xs font-bold">
                    COMING SOON
                  </div>
                )}

                {/* Icon & Name */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-black text-white">{plan.price}</span>
                    <span className="ml-2 text-slate-400">/{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-slate-300' : 'text-slate-600'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(plan.name)}
                  disabled={plan.disabled || plan.comingSoon || loading}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
                    plan.disabled
                      ? 'bg-slate-700 cursor-not-allowed'
                      : plan.comingSoon
                      ? 'bg-yellow-600/50 cursor-not-allowed'
                      : `bg-gradient-to-r ${plan.color} hover:scale-105 shadow-lg`
                  }`}
                >
                  {plan.disabled ? plan.cta : plan.comingSoon ? '🔒 Coming Soon' : plan.cta}
                </button>

                {plan.comingSoon && (
                  <p className="text-center text-xs text-slate-500 mt-2">
                    Stripe integration in progress
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-slate-400">
                Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect immediately.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-slate-400">
                We accept all major credit cards (Visa, MasterCard, Amex) and debit cards through our secure Stripe integration.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-2">
                Is there a free trial for premium plans?
              </h3>
              <p className="text-slate-400">
                All users start with our Free plan which has full access to basic features. You can try it risk-free before upgrading.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-2">
                What happens to my data if I downgrade?
              </h3>
              <p className="text-slate-400">
                Your data is never deleted. If you downgrade, you'll keep access to your data but within the limits of your new plan.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-12">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

