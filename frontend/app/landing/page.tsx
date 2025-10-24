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
  Play
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
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/')}
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
        <div className="max-w-6xl mx-auto text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-white mb-8">
              AI-Powered
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Investing
              </span>
            </h1>
            <p className="text-2xl text-slate-300 mb-12 max-w-4xl mx-auto">
              Smart portfolio management with AI that actually works
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={() => router.push('/')}
                className="px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl font-bold rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-2xl"
              >
                Start Free Trial
                <ArrowRight className="w-6 h-6 ml-3 inline" />
              </button>
              <button
                onClick={() => router.push('/demo')}
                className="px-12 py-6 border-2 border-blue-400 text-blue-400 text-xl font-bold rounded-2xl hover:bg-blue-400 hover:text-white transition-all flex items-center"
              >
                <Play className="w-6 h-6 mr-3" />
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-6">
              Everything You Need
            </h2>
            <p className="text-xl text-slate-300">
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

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-6">
              Simple Pricing
            </h2>
            <p className="text-xl text-slate-300">
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to Start?
          </h2>
          <p className="text-2xl text-blue-100 mb-12">
            Join thousands of investors using AI to grow their wealth
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-12 py-6 bg-white text-blue-600 text-xl font-bold rounded-2xl hover:bg-blue-50 transition-all transform hover:scale-105"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => router.push('/demo')}
              className="px-12 py-6 border-2 border-white text-white text-xl font-bold rounded-2xl hover:bg-white hover:text-blue-600 transition-all"
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
