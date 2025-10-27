'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  TrendingUp, 
  BarChart3, 
  Eye, 
  Target, 
  Zap, 
  Shield, 
  Bell, 
  CheckCircle,
  ArrowRight,
  Brain,
  Rocket,
  Crown,
  Users,
  Star,
  Play,
  PieChart,
  FileText
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const { t, isRTL, locale, setLocale } = useLanguage();

  useEffect(() => {
    setIsVisible(true);
    // Mark that user has visited before
    localStorage.setItem('has-visited-before', 'true');
  }, []);

  const features = [
    {
      icon: <Brain className="w-12 h-12" />,
      title: "AI Portfolio",
      description: "Smart investment management",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <BarChart3 className="w-12 h-12" />,
      title: "Analytics",
      description: "Real-time insights",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Eye className="w-12 h-12" />,
      title: "Watchlist",
      description: "Track your stocks",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Shield className="w-12 h-12" />,
      title: "Risk Management",
      description: "Protect your investments",
      color: "from-orange-500 to-red-500"
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      icon: <Users className="w-8 h-8" />,
      features: ["5 stocks", "Basic tracking", "AI tips"],
      popular: false
    },
    {
      name: "Premium",
      price: "$9.99",
      period: "month",
      icon: <Crown className="w-8 h-8" />,
      features: ["15 stocks", "Advanced analytics", "Risk tools"],
      popular: true
    },
    {
      name: "Pro",
      price: "$19.99",
      period: "month",
      icon: <Rocket className="w-8 h-8" />,
      features: ["Unlimited", "All features", "API access"],
      popular: false
    }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation - Mobile Responsive */}
      <nav className="fixed top-0 w-full bg-slate-900/90 backdrop-blur-md border-b border-blue-500/20 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2 sm:py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-2xl font-bold text-white">AiCapital</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => router.push('/')}
                className="px-2 sm:px-4 py-1.5 sm:py-2 text-blue-400 hover:text-blue-300 transition-colors text-sm sm:text-base"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-3 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all text-sm sm:text-base"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 px-4">
              AI-Powered
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Investing
              </span>
            </h1>
            <p className="text-base sm:text-xl lg:text-2xl text-slate-300 mb-8 sm:mb-12 max-w-4xl mx-auto px-4">
              Smart portfolio management with AI that actually works
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4">
              <button
                onClick={() => router.push('/')}
                className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg sm:text-xl font-bold rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-2xl flex items-center justify-center"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3" />
              </button>
              <button
                onClick={() => router.push('/expert-portfolio')}
                className="px-8 sm:px-12 py-4 sm:py-6 border-2 border-blue-400 text-blue-400 text-lg sm:text-xl font-bold rounded-2xl hover:bg-blue-400 hover:text-white transition-all flex items-center mx-auto sm:mx-0"
              >
                <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                <span className="hidden sm:inline">Watch Demo</span>
                <span className="sm:hidden">Demo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Expert Portfolio Performance - Most Important Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-y border-green-500/30">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-16 px-4">
            <div className="inline-flex items-center bg-green-500/20 text-green-300 px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 border border-green-500/30">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Expert Portfolio Results
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              Real Profits, Real Results
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-4xl mx-auto">
              Our expert AI portfolios have generated consistent profits for thousands of investors
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Top Performer */}
            <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-8 rounded-3xl text-white shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Tech Growth Portfolio</h3>
                <div className="text-4xl font-bold mb-2">+47.3%</div>
                <div className="text-green-100 mb-4">12-month return</div>
                <div className="text-sm text-green-100">
                  $10,000 → $14,730
                </div>
              </div>
            </div>

            {/* Conservative Performer */}
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-8 rounded-3xl text-white shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Balanced Portfolio</h3>
                <div className="text-4xl font-bold mb-2">+28.7%</div>
                <div className="text-blue-100 mb-4">12-month return</div>
                <div className="text-sm text-blue-100">
                  $10,000 → $12,870
                </div>
              </div>
            </div>

            {/* Aggressive Performer */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-8 rounded-3xl text-white shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Growth Portfolio</h3>
                <div className="text-4xl font-bold mb-2">+62.1%</div>
                <div className="text-purple-100 mb-4">12-month return</div>
                <div className="text-sm text-purple-100">
                  $10,000 → $16,210
                </div>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">94%</div>
              <div className="text-slate-300">Success Rate</div>
              <div className="text-sm text-slate-400">Profitable portfolios</div>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">+31.2%</div>
              <div className="text-slate-300">Average Return</div>
              <div className="text-sm text-slate-400">Last 12 months</div>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">15,000+</div>
              <div className="text-slate-300">Active Users</div>
              <div className="text-sm text-slate-400">Growing portfolios</div>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">$2.4M+</div>
              <div className="text-slate-300">Total Profits</div>
              <div className="text-sm text-slate-400">Generated for users</div>
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => router.push('/expert-portfolio')}
              className="px-8 sm:px-12 py-4 sm:py-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg sm:text-xl font-bold rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-2xl flex items-center justify-center mx-auto"
            >
              <span>See Live Performance</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-16 px-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              Everything You Need
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-300">
              AI that makes investing simple and profitable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-slate-700 hover:border-blue-500/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 mx-auto`}>
                  <div className="text-white">{feature.icon}</div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 text-center">{feature.title}</h3>
                <p className="text-slate-300 text-center">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Engines Explanation */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-16 px-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              How Our AI Works
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-300">
              Four powerful engines working together to optimize your investments
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            {/* Portfolio Building Engine */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-blue-500/20">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Portfolio Building Engine</h3>
                  <p className="text-slate-300">Creates your optimal portfolio</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Market Analysis</h4>
                    <p className="text-slate-300 text-sm">Analyzes 10,000+ stocks across all sectors using real-time data</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Risk Assessment</h4>
                    <p className="text-slate-300 text-sm">Calculates optimal risk-return balance based on your profile</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Diversification</h4>
                    <p className="text-slate-300 text-sm">Automatically spreads investments across sectors and regions</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Optimization</h4>
                    <p className="text-slate-300 text-sm">Uses advanced algorithms to maximize returns while minimizing risk</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decision Engine */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-purple-500/20">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Decision Engine</h3>
                  <p className="text-slate-300">Tells you what actions to take</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Buy/Sell Signals</h4>
                    <p className="text-slate-300 text-sm">Analyzes market conditions to recommend when to buy or sell</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Rebalancing</h4>
                    <p className="text-slate-300 text-sm">Monitors portfolio drift and suggests rebalancing when needed</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Risk Alerts</h4>
                    <p className="text-slate-300 text-sm">Warns you about potential risks and market changes</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Opportunity Detection</h4>
                    <p className="text-slate-300 text-sm">Identifies new investment opportunities as they arise</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Engines Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            {/* Portfolio Analysis Engine */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-green-500/20">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mr-4">
                  <PieChart className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Portfolio Analysis Engine</h3>
                  <p className="text-slate-300">Deep dive into performance</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Sector Performance</h4>
                    <p className="text-slate-300 text-sm">Track 30-day performance across all portfolio sectors</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Risk Assessment</h4>
                    <p className="text-slate-300 text-sm">Measure volatility, drawdowns, and risk metrics</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Performance Trends</h4>
                    <p className="text-slate-300 text-sm">Visualize portfolio growth over time with detailed charts</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Automatic Sector Mapping</h4>
                    <p className="text-slate-300 text-sm">AI automatically classifies stocks into sectors (Technology, Healthcare, etc.)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reports Analysis Engine */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-orange-500/20">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mr-4">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Reports Engine</h3>
                  <p className="text-slate-300">Stay informed with smart insights</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Live News Feed</h4>
                    <p className="text-slate-300 text-sm">Real-time news from Finnhub and Alpha Vantage</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Earnings Calendar</h4>
                    <p className="text-slate-300 text-sm">Track upcoming earnings for your portfolio stocks</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Sentiment Analysis</h4>
                    <p className="text-slate-300 text-sm">Positive, neutral, and negative news filtering</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3"></div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Portfolio Summary</h4>
                    <p className="text-slate-300 text-sm">Quick overview of total value, P&L, and stock count</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">How They Work Together</h3>
              <p className="text-lg text-slate-300 max-w-4xl mx-auto">
                The Portfolio Building Engine creates your initial strategy. The Decision Engine monitors and adjusts in real-time. The Portfolio Analysis Engine provides deep insights into performance and sectors. The Reports Engine keeps you informed with news and earnings. Together, they create a complete AI-powered investment system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-16 px-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              Simple Pricing
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-300">
              Start free, upgrade when you're ready
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border transition-all ${
                  plan.popular 
                    ? 'border-blue-500 shadow-2xl shadow-blue-500/20 scale-105' 
                    : 'border-slate-700 hover:border-blue-500/50'
                }`}
              >
                {plan.popular && (
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold px-4 py-2 rounded-full text-center mb-6">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-8">
                  <div className="text-blue-400 mx-auto mb-4">{plan.icon}</div>
                  <h3 className="text-3xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="text-5xl font-bold text-white mb-2">
                    {plan.price}
                    <span className="text-lg text-slate-400">/{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-slate-300 text-lg">
                      <CheckCircle className="w-6 h-6 mr-3 text-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push('/')}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                      : 'border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white'
                  }`}
                >
                  {plan.name === 'Free' ? 'Get Started' : 'Upgrade Now'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Ready to Start?
          </h2>
          <p className="text-base sm:text-lg lg:text-2xl text-blue-100 mb-8 sm:mb-12">
            Join thousands of investors using AI to grow their wealth
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-8 sm:px-12 py-4 sm:py-6 bg-white text-blue-600 text-lg sm:text-xl font-bold rounded-2xl hover:bg-blue-50 transition-all transform hover:scale-105"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => router.push('/expert-portfolio')}
              className="px-8 sm:px-12 py-4 sm:py-6 border-2 border-white text-white text-lg sm:text-xl font-bold rounded-2xl hover:bg-white hover:text-blue-600 transition-all"
            >
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">AiCapital</span>
          </div>
          <p className="text-slate-400 text-lg mb-8">
            The future of AI-powered investment management
          </p>
          <div className="border-t border-slate-800 pt-8 text-slate-400">
            <p>&copy; 2024 AiCapital. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
