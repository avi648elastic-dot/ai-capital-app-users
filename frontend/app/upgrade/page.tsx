'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Zap, TrendingUp, Shield, Crown, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import { stripeService, SubscriptionPlan } from '@/lib/stripeService';
import { useLanguage } from '@/contexts/LanguageContext';

export default function UpgradePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Load subscription plans from Stripe
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const subscriptionPlans = await stripeService.getSubscriptionPlans();
        setPlans(subscriptionPlans);
      } catch (error) {
        console.error('Error loading plans:', error);
        // Fallback to hardcoded plans if API fails
        setPlans([
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
            limits: { portfolios: 1, stocks: 5, watchlist: 5 }
          },
          {
            id: 'premium',
            name: 'Premium',
            price: 29.99,
            priceId: 'price_xxxxxxxxx',
            features: [
              'Up to 15 stocks per portfolio',
              'Advanced analytics',
              'Risk management tools',
              'Priority support',
              'All Free features'
            ],
            limits: { portfolios: 3, stocks: 15, watchlist: 15 }
          },
          {
            id: 'premium+',
            name: 'Premium+',
            price: 49.99,
            priceId: 'price_xxxxxxxxx',
            features: [
              'Unlimited stocks',
              'Advanced risk analysis',
              'Multi-portfolio management',
              'Custom alerts',
              'API access',
              'All Premium features'
            ],
            limits: { portfolios: -1, stocks: -1, watchlist: -1 }
          }
        ]);
      } finally {
        setLoadingPlans(false);
      }
    };

    loadPlans();
  }, []);

  // Plan icons and colors mapping
  const getPlanIcon = (planId: string) => {
    const icons = {
      'free': Shield,
      'premium': Zap,
      'premium+': Crown
    };
    return icons[planId as keyof typeof icons] || Shield;
  };

  const getPlanColor = (planId: string) => {
    const colors = {
      'free': 'from-slate-600 to-slate-700',
      'premium': 'from-blue-600 to-blue-700',
      'premium+': 'from-purple-600 to-purple-700'
    };
    return colors[planId as keyof typeof colors] || 'from-slate-600 to-slate-700';
  };

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (loading || !plan.priceId) return;
    
    setLoading(true);
    
    try {
      // Redirect to Stripe checkout
      await stripeService.redirectToCheckout({
        priceId: plan.priceId,
        successUrl: `${window.location.origin}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/upgrade`
      });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setLoading(false);
    }
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
          {loadingPlans ? (
            <div className="col-span-3 flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-slate-400">Loading plans...</span>
            </div>
          ) : (
            plans.map((plan, index) => {
              const Icon = getPlanIcon(plan.id);
              const color = getPlanColor(plan.id);
              const isPopular = plan.id === 'premium';
              const isFree = plan.id === 'free';
              const hasPriceId = !!plan.priceId;
              
              return (
              <div
                key={index}
                className={`relative rounded-2xl border-2 ${
                  isPopular 
                    ? 'border-blue-500 shadow-2xl shadow-blue-500/20 scale-105' 
                    : 'border-slate-700'
                } bg-slate-800/50 backdrop-blur-sm p-8 transition-all hover:scale-105 ${
                  isPopular ? 'z-10' : ''
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full text-white text-sm font-bold">
                    ⭐ MOST POPULAR
                  </div>
                )}

                {/* Setup Required Badge */}
                {!hasPriceId && !isFree && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-yellow-600 rounded-full text-white text-xs font-bold">
                    SETUP REQUIRED
                  </div>
                )}

                {/* Icon & Name */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-black text-white">{stripeService.formatPrice(plan.price)}</span>
                    <span className="ml-2 text-slate-400">/{isFree ? 'forever' : 'per month'}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={isFree || !hasPriceId || loading}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center ${
                    isFree
                      ? 'bg-slate-700 cursor-not-allowed'
                      : !hasPriceId
                      ? 'bg-yellow-600/50 cursor-not-allowed'
                      : `bg-gradient-to-r ${color} hover:scale-105 shadow-lg`
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : isFree ? (
                    'Current Plan'
                  ) : !hasPriceId ? (
                    '🔒 Setup Required'
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </button>

                {!hasPriceId && !isFree && (
                  <p className="text-center text-xs text-slate-500 mt-2">
                    Product ID needed in Stripe Dashboard
                  </p>
                )}
              </div>
              );
            })
          )}
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

