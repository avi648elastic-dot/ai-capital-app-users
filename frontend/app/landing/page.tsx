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
  PieChart,
  LineChart,
  Activity,
  DollarSign,
  Users,
  Award,
  CheckCircle,
  ArrowRight,
  Star,
  Brain,
  Smartphone,
  Globe,
  Lock,
  Rocket,
  Crown,
  Briefcase,
  TrendingDown,
  AlertTriangle,
  Settings,
  Database,
  Cloud,
  Cpu,
  Network
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
      icon: <Brain className="w-8 h-8" />,
      title: t('landing.features.aiPortfolio.title'),
      description: t('landing.features.aiPortfolio.description'),
      status: "active",
      benefits: ["Smart stock selection", "Risk assessment", "Auto-rebalancing", "Performance optimization"]
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: t('landing.features.watchlist.title'),
      description: t('landing.features.watchlist.description'),
      status: "active",
      benefits: ["Live price tracking", "Custom alerts", "Market notifications", "Portfolio monitoring"]
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: t('landing.features.analytics.title'),
      description: t('landing.features.analytics.description'),
      status: "active",
      benefits: ["Performance analytics", "Risk metrics", "Market insights", "Historical data"]
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: t('landing.features.expert.title'),
      description: t('landing.features.expert.description'),
      status: "active",
      benefits: ["Expert strategies", "AI recommendations", "Backtesting", "Strategy optimization"]
    },
    {
      icon: <Bell className="w-8 h-8" />,
      title: t('landing.features.notifications.title'),
      description: t('landing.features.notifications.description'),
      status: "active",
      benefits: ["Price alerts", "News notifications", "Market updates", "Custom triggers"]
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: t('landing.features.risk.title'),
      description: t('landing.features.risk.description'),
      status: "active",
      benefits: ["Risk scoring", "Stop-loss automation", "Portfolio protection", "Volatility analysis"]
    }
  ];

  const analyticsPages = [
    {
      title: "Performance Analytics",
      icon: <LineChart className="w-6 h-6" />,
      description: "Track portfolio performance with detailed metrics and visualizations",
      features: ["Return analysis", "Benchmark comparison", "Risk-adjusted returns", "Performance attribution"]
    },
    {
      title: "Portfolio Analysis",
      icon: <PieChart className="w-6 h-6" />,
      description: "Deep dive into portfolio composition and allocation analysis",
      features: ["Asset allocation", "Sector analysis", "Geographic distribution", "Concentration risk"]
    },
    {
      title: "Watchlist Management",
      icon: <Eye className="w-6 h-6" />,
      description: "Advanced stock screening and watchlist management tools",
      features: ["Custom filters", "Price alerts", "News tracking", "Technical indicators"]
    },
    {
      title: "Risk Management",
      icon: <Shield className="w-6 h-6" />,
      description: "Comprehensive risk assessment and mitigation strategies",
      features: ["VaR analysis", "Stress testing", "Correlation analysis", "Risk budgeting"]
    },
    {
      title: "Market Reports",
      icon: <BarChart3 className="w-6 h-6" />,
      description: "Detailed market analysis and investment reports",
      features: ["Market overview", "Sector analysis", "Economic indicators", "Investment insights"],
      status: "coming-soon"
    },
    {
      title: "Transaction History",
      icon: <Database className="w-6 h-6" />,
      description: "Complete trading history and transaction analytics",
      features: ["Trade history", "Profit/loss analysis", "Tax reporting", "Performance tracking"]
    }
  ];

  const subscriptionTiers = [
    {
      name: t('landing.pricing.free'),
      price: "$0",
      period: t('landing.pricing.forever'),
      icon: <Users className="w-8 h-8" />,
      features: [
        "Up to 5 stocks in watchlist",
        "Basic portfolio tracking",
        "AI recommendations",
        "Real-time price updates"
      ],
      limits: {
        portfolios: 1,
        stocks: 5,
        watchlist: 5
      }
    },
    {
      name: t('landing.pricing.premium'),
      price: "$9.99",
      period: t('landing.pricing.month'),
      icon: <Crown className="w-8 h-8" />,
      features: [
        "Up to 15 stocks per portfolio",
        "Advanced analytics",
        "Risk management tools",
        "Priority support",
        "All Free features"
      ],
      limits: {
        portfolios: 3,
        stocks: 15,
        watchlist: 15
      },
      popular: true
    },
    {
      name: t('landing.pricing.premiumPlus'),
      price: "$19.99",
      period: t('landing.pricing.month'),
      icon: <Rocket className="w-8 h-8" />,
      features: [
        "Unlimited stocks",
        "Advanced risk analysis",
        "Multi-portfolio management",
        "Custom alerts",
        "API access",
        "All Premium features"
      ],
      limits: {
        portfolios: "Unlimited",
        stocks: "Unlimited",
        watchlist: "Unlimited"
      }
    }
  ];

  const competitiveAdvantages = [
    {
      title: "AI-Powered Intelligence",
      description: "Unlike competitors who rely on basic charts, we use advanced AI to analyze market patterns and optimize your investments",
      icon: <Brain className="w-12 h-12" />
    },
    {
      title: "Comprehensive Analytics",
      description: "Most platforms show basic reports. We provide deep analytics, risk management, and actionable insights",
      icon: <BarChart3 className="w-12 h-12" />
    },
    {
      title: "Expert Strategies",
      description: "Access proven investment strategies from financial experts, not just generic recommendations",
      icon: <Target className="w-12 h-12" />
    },
    {
      title: "Real-Time Everything",
      description: "Live price tracking, instant alerts, and real-time portfolio updates - not delayed or limited data",
      icon: <Zap className="w-12 h-12" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900/90 backdrop-blur-md border-b border-blue-500/20 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">AiCapital</span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <div className="relative">
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as 'en' | 'ar' | 'he')}
                  className="bg-slate-800 text-slate-300 border border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                  <option value="he">עברית</option>
                </select>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
              {t('landing.hero.title')}
            </h1>
            <p className="text-xl sm:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              {t('landing.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => router.push('/signup')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-2xl"
              >
                {t('landing.hero.startJourney')}
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </button>
              <button
                onClick={() => router.push('/demo')}
                className="px-8 py-4 border-2 border-blue-400 text-blue-400 text-lg font-semibold rounded-xl hover:bg-blue-400 hover:text-white transition-all"
              >
                {t('landing.hero.viewDemo')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border border-blue-500/20 hover:border-blue-400/40 transition-all hover:shadow-2xl hover:shadow-blue-500/10"
              >
                <div className="text-blue-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-300 mb-4">{feature.description}</p>
                <div className="flex flex-wrap gap-2">
                  {feature.benefits.map((benefit, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full border border-blue-500/30"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center text-green-400">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Active & Available</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Pages Showcase */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Comprehensive Analytics Suite
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Deep insights and analysis tools that go beyond basic charts and reports
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyticsPages.map((page, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-6 rounded-xl border border-slate-700/50 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-center mb-4">
                  <div className="text-blue-400 mr-3">{page.icon}</div>
                  <h3 className="text-lg font-bold text-white">{page.title}</h3>
                </div>
                <p className="text-slate-300 text-sm mb-4">{page.description}</p>
                <div className="space-y-2">
                  {page.features.map((feature, i) => (
                    <div key={i} className="flex items-center text-slate-400 text-sm">
                      <CheckCircle className="w-3 h-3 mr-2 text-green-400" />
                      {feature}
                    </div>
                  ))}
                </div>
                {page.status === 'coming-soon' && (
                  <div className="mt-4 px-3 py-1 bg-orange-500/20 text-orange-300 text-xs rounded-full border border-orange-500/30 inline-block">
                    Coming Soon
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Advantages */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Why We're Different
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              While competitors show basic charts and reports, we provide comprehensive AI-powered investment intelligence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {competitiveAdvantages.map((advantage, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border border-blue-500/20"
              >
                <div className="text-blue-400 mb-4">{advantage.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-4">{advantage.title}</h3>
                <p className="text-slate-300 text-lg">{advantage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              {t('landing.pricing.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {subscriptionTiers.map((tier, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border transition-all ${
                  tier.popular 
                    ? 'border-blue-500 shadow-2xl shadow-blue-500/20 scale-105' 
                    : 'border-slate-700 hover:border-blue-500/50'
                }`}
              >
                {tier.popular && (
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold px-4 py-2 rounded-full text-center mb-6">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <div className="text-blue-400 mx-auto mb-4">{tier.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                  <div className="text-4xl font-bold text-white mb-1">
                    {tier.price}
                    <span className="text-lg text-slate-400">/{tier.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-slate-300">
                      <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => tier.name === t('landing.pricing.free') ? router.push('/signup') : router.push('/upgrade')}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    tier.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                      : 'border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white'
                  }`}
                >
                  {tier.name === t('landing.pricing.free') ? t('landing.pricing.getStarted') : t('landing.pricing.upgradeNow')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {t('landing.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/signup')}
              className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:bg-blue-50 transition-all transform hover:scale-105"
            >
              {t('landing.cta.startFree')}
            </button>
            <button
              onClick={() => router.push('/demo')}
              className="px-8 py-4 border-2 border-white text-white text-lg font-semibold rounded-xl hover:bg-white hover:text-blue-600 transition-all"
            >
              {t('landing.cta.viewDemo')}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">AiCapital</span>
              </div>
              <p className="text-slate-400">
                The future of AI-powered investment management
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('landing.footer.features')}</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => router.push('/demo')} className="hover:text-white transition-colors">{t('landing.footer.portfolioManagement')}</button></li>
                <li><button onClick={() => router.push('/demo')} className="hover:text-white transition-colors">{t('landing.footer.analyticsDashboard')}</button></li>
                <li><button onClick={() => router.push('/demo')} className="hover:text-white transition-colors">{t('landing.footer.watchlistTracking')}</button></li>
                <li><button onClick={() => router.push('/demo')} className="hover:text-white transition-colors">{t('landing.footer.expertStrategies')}</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('landing.footer.support')}</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => router.push('/demo')} className="hover:text-white transition-colors">{t('landing.footer.helpCenter')}</button></li>
                <li><button onClick={() => router.push('/demo')} className="hover:text-white transition-colors">{t('landing.footer.contactUs')}</button></li>
                <li><button onClick={() => router.push('/pricing')} className="hover:text-white transition-colors">{t('landing.footer.pricing')}</button></li>
                <li><button onClick={() => router.push('/demo')} className="hover:text-white transition-colors">{t('landing.footer.demo')}</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('landing.footer.legal')}</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => router.push('/privacy')} className="hover:text-white transition-colors">{t('landing.footer.privacyPolicy')}</button></li>
                <li><button onClick={() => router.push('/legal/terms')} className="hover:text-white transition-colors">{t('landing.footer.termsOfService')}</button></li>
                <li><button onClick={() => router.push('/privacy')} className="hover:text-white transition-colors">{t('landing.footer.cookiePolicy')}</button></li>
                <li><button onClick={() => router.push('/about')} className="hover:text-white transition-colors">{t('landing.footer.about')}</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 AiCapital. {t('landing.footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
