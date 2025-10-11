'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Crown } from 'lucide-react';
import AcaciaLogo from '@/components/AcaciaLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';
import GoogleLoginButton from '@/components/GoogleLoginButton';

// ✅ All requests will send cookies to other domains (cross-site)
axios.defaults.withCredentials = true;

type MeUser = {
  id: string;
  email: string;
  name: string;
  subscriptionActive: boolean;
};

export default function Page() {
  const { t, isRTL } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      setCheckingToken(false);
      return;
    }

    // ✅ Test token validity
    (async () => {
      try {
        // First test basic connectivity
        const testResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/test`);
        console.log('✅ Backend connectivity test passed:', testResponse.data);

        // Then test user profile with token
        const { data } = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data?.user?.onboardingCompleted) {
          router.replace('/dashboard');
        } else {
          console.log('✅ User authenticated, redirecting to onboarding');
          router.replace('/onboarding');
        }
      } catch (err) {
        console.error('❌ Token check failed:', err);
        Cookies.remove('token');
        setCheckingToken(false);
      }
    })();
  }, [router]);

  /**
   * ✅ Login / Signup
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
          formData
        );

      const token: string | undefined = data?.token;
      if (!token) {
        setError('Unexpected response from server');
        return;
      }

      // ✅ Cookie set correctly for production (https)
      Cookies.set('token', token, {
        expires: 7,
        secure: true,
        sameSite: 'None', // Required in production
      });

      // ✅ Check status again
      const { data: status } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (status?.onboardingCompleted) {
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Circuit Board Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Floating Stock Symbols & Market Markers */}
        {['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX', 'BTC', 'ETH', 'SPY', 'QQQ', 'IWM', 'VIX', 'GOLD', 'OIL', 'EUR/USD', 'GBP/USD'].map((symbol, index) => (
          <div
            key={symbol}
            className="absolute text-xs font-mono text-slate-400/70 opacity-50 animate-float-enhanced bg-slate-800/30 px-2 py-1 rounded backdrop-blur-sm border border-blue-500/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${index * 0.5}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)'
            }}
          >
            {symbol}
          </div>
        ))}

        {/* Market Exchange Symbols */}
        {['NYSE', 'NASDAQ', 'TSX', 'LSE', 'HKEX', 'TSE', 'SSE', 'BSE'].map((exchange, index) => (
          <div
            key={`exchange-${exchange}`}
            className="absolute text-xs font-bold text-emerald-400/60 opacity-40 animate-float bg-slate-900/40 px-2 py-1 rounded-full border border-emerald-500/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${index * 0.7}s`,
              animationDuration: `${12 + Math.random() * 8}s`,
              fontSize: '10px'
            }}
          >
            {exchange}
          </div>
        ))}

        {/* Financial Market Icons */}
        {['📊', '📈', '📉', '💰', '💎', '🏦', '🏛️', '📋', '🔍', '⚡', '🎯', '📱', '💼', '🔄', '📌'].map((icon, index) => (
          <div
            key={`icon-${icon}`}
            className="absolute text-lg opacity-30 animate-float-delayed"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${index * 0.3}s`,
              animationDuration: `${8 + Math.random() * 6}s`,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }}
          >
            {icon}
          </div>
        ))}

        {/* Market Data Bubbles */}
        {[...Array(20)].map((_, i) => {
          const isPositive = Math.random() > 0.5;
          const percentage = (Math.random() * 20).toFixed(1);
          const price = (Math.random() * 500 + 50).toFixed(2);
          
          return (
            <div
              key={`market-data-${i}`}
              className={`absolute text-xs font-mono animate-bubble-drift bg-slate-800/40 px-2 py-1 rounded-full border backdrop-blur-sm ${
                isPositive 
                  ? 'text-emerald-400/70 border-emerald-500/30' 
                  : 'text-red-400/70 border-red-500/30'
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${10 + Math.random() * 8}s`,
                boxShadow: `0 2px 6px ${isPositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
              }}
            >
              {isPositive ? '+' : '-'}{percentage}% ${price}
            </div>
          );
        })}

        {/* Crypto & Forex Markers */}
        {['BTC', 'ETH', 'ADA', 'SOL', 'MATIC', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'].map((symbol, index) => (
          <div
            key={`crypto-${symbol}`}
            className="absolute text-xs font-bold text-purple-400/60 opacity-45 animate-float bg-slate-900/50 px-2 py-1 rounded-lg border border-purple-500/25"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${index * 0.6}s`,
              animationDuration: `${9 + Math.random() * 7}s`,
              fontSize: '11px',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)'
            }}
          >
            {symbol}
          </div>
        ))}

        {/* Market Sector Markers */}
        {['TECH', 'HEALTH', 'ENERGY', 'FINANCE', 'REAL', 'CONSUMER', 'INDUSTRIAL', 'UTILITIES'].map((sector, index) => (
          <div
            key={`sector-${sector}`}
            className="absolute text-xs font-bold text-orange-400/50 opacity-35 animate-float bg-slate-900/60 px-2 py-1 rounded-lg border border-orange-500/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${index * 0.8}s`,
              animationDuration: `${11 + Math.random() * 9}s`,
              fontSize: '10px',
              textTransform: 'uppercase'
            }}
          >
            {sector}
          </div>
        ))}

        {/* Floating Financial Elements */}
        <div className="absolute top-20 left-10 animate-float text-4xl opacity-20">
          📈
        </div>
        <div className="absolute top-32 right-20 animate-float-delayed text-3xl opacity-15">
          💰
        </div>
        <div className="absolute bottom-40 left-20 animate-float-slow text-5xl opacity-10">
          🏦
        </div>
        <div className="absolute bottom-20 right-10 animate-float text-4xl opacity-20">
          📊
        </div>
        <div className="absolute top-60 left-1/2 animate-float-delayed text-3xl opacity-15">
          💎
        </div>
        <div className="absolute bottom-60 right-1/3 animate-float-slow text-4xl opacity-10">
          🚀
        </div>

        {/* Additional Market Icons */}
        <div className="absolute top-1/4 right-1/4 animate-float text-2xl opacity-25">
          🎯
        </div>
        <div className="absolute bottom-1/3 left-1/3 animate-float-delayed text-3xl opacity-20">
          ⚡
        </div>
        <div className="absolute top-2/3 right-1/3 animate-float-slow text-2xl opacity-15">
          🔍
        </div>
        <div className="absolute bottom-1/4 left-1/4 animate-float text-3xl opacity-25">
          📋
        </div>

        {/* Animated Bubbles - Multiple Types (Mobile Optimized) */}
        {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 12 : 25)].map((_, i) => {
          const bubbleTypes = [
            'bg-gradient-to-r from-blue-500/30 to-cyan-500/20',
            'bg-gradient-to-r from-purple-500/30 to-pink-500/20', 
            'bg-gradient-to-r from-emerald-500/30 to-green-500/20',
            'bg-gradient-to-r from-orange-500/30 to-red-500/20',
            'bg-gradient-to-r from-indigo-500/30 to-blue-500/20'
          ];
          const bubbleType = bubbleTypes[i % bubbleTypes.length];
          
          return (
            <div
              key={i}
              className={`absolute rounded-full ${bubbleType} animate-bubble shadow-lg hidden md:block`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 6 + 2}rem`,
                height: `${Math.random() * 6 + 2}rem`,
                animationDelay: `${Math.random() * 15}s`,
                animationDuration: `${12 + Math.random() * 8}s`,
                filter: 'blur(1px)'
              }}
            />
          );
        })}

        {/* Mobile-optimized bubbles */}
        {[...Array(8)].map((_, i) => {
          const bubbleTypes = [
            'bg-gradient-to-r from-blue-500/20 to-cyan-500/15',
            'bg-gradient-to-r from-purple-500/20 to-pink-500/15'
          ];
          const bubbleType = bubbleTypes[i % bubbleTypes.length];
          
          return (
            <div
              key={`mobile-bubble-${i}`}
              className={`absolute rounded-full ${bubbleType} animate-bubble md:hidden`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 1}rem`,
                height: `${Math.random() * 4 + 1}rem`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${10 + Math.random() * 5}s`,
                filter: 'blur(0.5px)'
              }}
            />
          );
        })}

        {/* Floating Particles (Mobile Optimized) */}
        {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 15 : 30)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-1 h-1 bg-white/40 rounded-full animate-ping hidden md:block"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}

        {/* Mobile particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`mobile-particle-${i}`}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-ping md:hidden"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 1}s`
            }}
          />
        ))}

        {/* Glowing Orbs */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 8 + 4}rem`,
              height: `${Math.random() * 8 + 4}rem`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${20 + Math.random() * 10}s`,
              filter: 'blur(2px)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
            }}
          />
        ))}

        {/* Small Drifting Bubbles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`drift-${i}`}
            className="absolute rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 animate-bubble-drift"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}rem`,
              height: `${Math.random() * 3 + 1}rem`,
              animationDelay: `${Math.random() * 12}s`,
              animationDuration: `${10 + Math.random() * 8}s`,
              filter: 'blur(0.5px)'
            }}
          />
        ))}

        {/* Large Floating Circles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`circle-${i}`}
            className="absolute rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-float-slow border border-purple-500/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 12 + 8}rem`,
              height: `${Math.random() * 12 + 8}rem`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${25 + Math.random() * 15}s`,
              filter: 'blur(3px)'
            }}
          />
        ))}

        {/* Price Tickers */}
        <div className="absolute top-10 left-0 w-full overflow-hidden">
          <div className="flex animate-ticker">
            {[
              'AAPL +2.5%', 'GOOGL -1.2%', 'MSFT +0.8%', 'TSLA +5.3%', 
              'AMZN -0.5%', 'META +3.1%', 'NVDA +4.2%', 'NFLX -2.1%'
            ].map((ticker, index) => (
              <span key={index} className="text-xs font-mono text-slate-400 whitespace-nowrap mx-8">
                {ticker}
              </span>
            ))}
          </div>
        </div>

        {/* Data Stream Lines */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent animate-data-stream"></div>
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent animate-data-stream" style={{animationDelay: '5s'}}></div>
          <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent animate-data-stream" style={{animationDelay: '10s'}}></div>
        </div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 40% 60%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)
            `
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <AcaciaLogo size={48} className="text-white" />
              <div className="flex items-center space-x-4">
                <LanguageSelector />
              </div>
            </div>
            <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                AI-Capital
              </h1>
            </div>
            <p className="text-lg text-slate-300 mb-2">
              {t('auth.professionalPortfolioManagement')}
            </p>
            <p className="text-sm text-slate-400">
              🚀 {t('auth.aiPoweredDescription')}
            </p>
          </div>

          {/* Form Container */}
          <div className="card p-8 relative backdrop-blur-xl bg-slate-900/80 border border-slate-700/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
            {/* Animated Border */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 p-[1px] animate-gradient-x">
              <div className="w-full h-full rounded-xl bg-slate-900/90"></div>
            </div>
            
            {/* Glass Effect Overlay */}
            <div 
              className="absolute inset-0 rounded-xl opacity-20 animate-pulse"
              style={{
                background: `
                  linear-gradient(45deg, rgba(16, 185, 129, 0.3) 25%, transparent 25%),
                  linear-gradient(-45deg, rgba(59, 130, 246, 0.3) 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, rgba(139, 92, 246, 0.3) 75%),
                  linear-gradient(-45deg, transparent 75%, rgba(245, 158, 11, 0.3) 75%)
                `,
                backgroundSize: '20px 20px'
              }}
            />

            {/* Floating Particles Inside Card */}
            <div className="absolute inset-0 overflow-hidden rounded-xl">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-blue-400/30 rounded-full animate-ping"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
            
            <div className="relative z-10">
              {/* Tab Navigation */}
              <div className="flex mb-6 bg-slate-800/50 rounded-lg p-1">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    isLogin 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t('auth.login')}
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    !isLogin 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t('auth.signup')}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {t('auth.fullName')}
                    </label>
                    <input
                      type="text"
                      required={!isLogin}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      placeholder={t('auth.fullName')}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    placeholder={t('auth.email')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('auth.password')}
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field"
                    placeholder={t('auth.password')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{isLogin ? t('auth.login') : t('auth.createAccount')}</span>
                  )}
                </button>
              </form>

              {/* Google Login */}
              <GoogleLoginButton 
                onSuccess={() => {
                  // Success handled in GoogleLoginButton component
                }}
                onError={(error) => {
                  setError(error);
                }}
              />

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-xs text-slate-500">
                  {isLogin ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    {isLogin ? t('auth.signup') : t('auth.login')}
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex justify-center space-x-6 text-xs text-slate-400">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{t('auth.secure')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>{t('auth.fast')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>{t('auth.accurate')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}