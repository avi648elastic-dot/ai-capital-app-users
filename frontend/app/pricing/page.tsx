'use client';

import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              AI-Capital
            </h1>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold rounded-lg transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Start free, upgrade as you grow. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {/* Free */}
          <div className="rounded-2xl border-2 border-slate-700 bg-slate-800/30 p-8">
            <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
            <div className="mb-6">
              <span className="text-5xl font-black text-white">$0</span>
              <span className="text-slate-400 ml-2">forever</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-slate-300">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                1 Portfolio
              </li>
              <li className="flex items-center text-slate-300">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                10 Stocks Maximum
              </li>
              <li className="flex items-center text-slate-300">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                Basic Analytics
              </li>
              <li className="flex items-center text-slate-300">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                Email Support
              </li>
            </ul>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all"
            >
              Get Started Free
            </button>
          </div>

          {/* Premium */}
          <div className="rounded-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-900/30 to-blue-800/30 p-8 relative scale-105 shadow-2xl shadow-blue-500/20">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full text-white text-sm font-bold">
              ⭐ MOST POPULAR
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
            <div className="mb-6">
              <span className="text-5xl font-black text-white">$9.99</span>
              <span className="text-slate-400 ml-2">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-slate-300">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                3 Portfolios
              </li>
              <li className="flex items-center text-slate-300">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                15 Stocks per Portfolio
              </li>
              <li className="flex items-center text-slate-300">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                Advanced Analytics
              </li>
              <li className="flex items-center text-slate-300">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                Real-time Alerts
              </li>
              <li className="flex items-center text-slate-300">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                Priority Support
              </li>
            </ul>
            <button
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all shadow-lg cursor-not-allowed opacity-50"
              disabled
            >
              Coming Soon
            </button>
          </div>

          {/* Premium+ */}
          <div className="rounded-2xl border-2 border-purple-500 bg-gradient-to-br from-purple-900/30 to-purple-800/30 p-8">
            <h3 className="text-2xl font-bold text-white mb-2">Premium+</h3>
            <div className="mb-6">
              <span className="text-5xl font-black text-white">$19.99</span>
              <span className="text-slate-400 ml-2">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-slate-300">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                Unlimited Portfolios
              </li>
              <li className="flex items-center text-slate-300">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                20 Stocks per Portfolio
              </li>
              <li className="flex items-center text-slate-300">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                AI Insights & Predictions
              </li>
              <li className="flex items-center text-slate-300">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                24/7 Priority Support
              </li>
              <li className="flex items-center text-slate-300">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                Full API Access
              </li>
            </ul>
            <button
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-lg transition-all shadow-lg cursor-not-allowed opacity-50"
              disabled
            >
              Coming Soon
            </button>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="text-center">
          <p className="text-slate-500 mb-4">Trusted by investors worldwide</p>
          <div className="flex justify-center items-center space-x-8 text-slate-600">
            <div>🔒 Bank-level Security</div>
            <div>💳 Secure Payments</div>
            <div>🌐 99.9% Uptime</div>
          </div>
        </div>
      </div>
    </div>
  );
}

