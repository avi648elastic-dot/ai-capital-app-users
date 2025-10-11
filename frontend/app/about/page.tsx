'use client';

import { useRouter } from 'next/navigation';
import { BarChart3, TrendingUp, Shield, Zap } from 'lucide-react';

export default function AboutPage() {
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/pricing')}
                className="text-slate-300 hover:text-white transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold rounded-lg transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero */}
        <div className="text-center mb-20">
          <h1 className="text-6xl font-black text-white mb-6">
            About AI-Capital
          </h1>
          <p className="text-2xl text-slate-400 max-w-3xl mx-auto">
            Professional portfolio management powered by artificial intelligence and real-time market data.
          </p>
        </div>

        {/* Mission */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-white mb-6 text-center">Our Mission</h2>
          <p className="text-lg text-slate-300 leading-relaxed text-center max-w-3xl mx-auto">
            We believe that sophisticated portfolio management tools should be accessible to everyone, 
            not just institutional investors. AI-Capital combines cutting-edge artificial intelligence 
            with real-time market data to help you make smarter investment decisions.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Real-Time Analytics</h3>
            <p className="text-slate-400">
              Access professional-grade analytics with 7/30/60/90-day performance metrics, 
              volatility analysis, and Sharpe ratios calculated from live market data.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">AI-Powered Decisions</h3>
            <p className="text-slate-400">
              Our decision engine analyzes 90 days of historical data, market trends, and volatility 
              to provide actionable BUY/HOLD/SELL recommendations for every stock.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Risk Management</h3>
            <p className="text-slate-400">
              Automatic stop-loss and take-profit tracking, portfolio volatility monitoring, 
              and risk-adjusted returns help you protect your investments.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-700 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Price Alerts</h3>
            <p className="text-slate-400">
              Set custom price alerts on your watchlist and get instant notifications 
              when stocks hit your target prices - never miss an opportunity.
            </p>
          </div>
        </div>

        {/* Technology */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700 mb-20">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Built with Cutting-Edge Technology</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <h4 className="font-bold text-white mb-2">12 API Keys</h4>
              <p className="text-slate-400 text-sm">
                Multi-provider system with automatic failover ensures 99.9% uptime
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">Real-Time Data</h4>
              <p className="text-slate-400 text-sm">
                Live price updates every 30 seconds from Alpha Vantage, Finnhub, and FMP
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">Smart Caching</h4>
              <p className="text-slate-400 text-sm">
                10-minute LRU cache reduces API calls and delivers lightning-fast responses
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            Join thousands of investors making smarter decisions with AI-Capital
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-12 py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-lg font-bold rounded-xl transition-all shadow-2xl shadow-emerald-500/20"
          >
            Start Free Today
          </button>
        </div>
      </div>
    </div>
  );
}

