'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Crown } from 'lucide-react';
import AcaciaLogo from '@/components/AcaciaLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

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

  /**
   * ✅ On load - if token exists, check onboarding status
   */
  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      setCheckingToken(false);
      return;
    }

    (async () => {
      try {
        console.log('🔍 [FRONTEND] Checking onboarding status for token:', token.substring(0, 10) + '...');
        console.log('🔍 [FRONTEND] API URL:', process.env.NEXT_PUBLIC_API_URL);
        
        // Test backend connectivity first
        try {
          const testResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/test`);
          console.log('✅ [FRONTEND] Backend test successful:', testResponse.data);
        } catch (testError) {
          console.error('❌ [FRONTEND] Backend test failed:', testError);
        }
        
        const { data } = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/status`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log('📊 [FRONTEND] Onboarding status response:', data);

        if (data?.onboardingCompleted) {
          console.log('✅ [FRONTEND] Onboarding completed, redirecting to dashboard');
          router.replace('/dashboard');
        } else {
          console.log('🔄 [FRONTEND] Onboarding not completed, redirecting to onboarding');
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
      console.error('❌ Auth error:', err);
      setError(err?.response?.data?.message || 'Server error — please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  /**
   * ⏳ While checking token - show spinner
   */
  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-primary-500 mx-auto" />
          <p className="mt-4 text-gray-400">Checking session…</p>
        </div>
      </div>
    );
  }

  /**
   * Login/Signup Form
   */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Complex Financial Data Streams */}
        <div className="absolute top-16 left-8 w-20 h-20 opacity-25 animate-pulse">
          <svg viewBox="0 0 120 120" className="w-full h-full text-green-400">
            <defs>
              <linearGradient id="chart1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
            <path d="M10,100 L20,80 L30,90 L40,60 L50,70 L60,40 L70,55 L80,30 L90,45 L100,25 L110,35" 
                  stroke="url(#chart1)" strokeWidth="3" fill="none" />
            <circle cx="110" cy="35" r="4" fill="#10b981" />
            <text x="60" y="15" className="text-xs fill-emerald-300 font-mono">+15.3%</text>
          </svg>
        </div>
        
        <div className="absolute top-36 right-12 w-16 h-16 opacity-20 animate-bounce">
          <svg viewBox="0 0 120 120" className="w-full h-full text-blue-400">
            <defs>
              <linearGradient id="chart2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
            <path d="M10,90 L25,70 L40,80 L55,50 L70,60 L85,30 L100,45" 
                  stroke="url(#chart2)" strokeWidth="3" fill="none" />
            <circle cx="100" cy="45" r="3" fill="#3b82f6" />
            <text x="55" y="15" className="text-xs fill-blue-300 font-mono">AI</text>
          </svg>
        </div>

        <div className="absolute bottom-28 left-16 w-18 h-18 opacity-30 animate-pulse">
          <svg viewBox="0 0 120 120" className="w-full h-full text-purple-400">
            <defs>
              <linearGradient id="chart3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <path d="M10,85 L30,65 L50,75 L70,45 L90,55 L110,35" 
                  stroke="url(#chart3)" strokeWidth="3" fill="none" />
            <circle cx="110" cy="35" r="4" fill="#8b5cf6" />
            <text x="60" y="15" className="text-xs fill-purple-300 font-mono">98%</text>
          </svg>
        </div>

        {/* Enhanced Floating Financial Elements */}
        <div className="absolute top-28 right-28 w-10 h-10 opacity-40 animate-float">
          <div className="w-full h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-black font-bold text-lg shadow-lg">
            💰
          </div>
        </div>

        <div className="absolute bottom-36 right-20 w-8 h-8 opacity-35 animate-float-delayed">
          <div className="w-full h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
            📊
          </div>
        </div>

        <div className="absolute top-56 left-28 w-9 h-9 opacity-30 animate-float-slow">
          <div className="w-full h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
            🚀
          </div>
        </div>

        <div className="absolute top-80 right-40 w-7 h-7 opacity-25 animate-float">
          <div className="w-full h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
            ⚡
          </div>
        </div>

        <div className="absolute bottom-48 left-40 w-6 h-6 opacity-30 animate-float-slow">
          <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
            🎯
          </div>
        </div>

        {/* Advanced Grid Pattern with Financial Theme */}
        <div className="absolute inset-0 opacity-8">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        {/* Enhanced Sparkle Particles */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full opacity-60 animate-ping shadow-lg"></div>
        <div className="absolute top-3/4 right-1/3 w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full opacity-70 animate-ping shadow-lg" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-50 animate-ping shadow-lg" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-80 animate-ping shadow-lg" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-1/3 right-1/2 w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full opacity-45 animate-ping shadow-lg" style={{animationDelay: '4s'}}></div>

        {/* Financial Data Streams */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-64 h-8 opacity-20">
          <div className="flex justify-center space-x-8 text-xs font-mono text-slate-400 animate-pulse">
            <span className="text-green-400">AAPL +2.3%</span>
            <span className="text-blue-400">MSFT +1.8%</span>
            <span className="text-purple-400">GOOGL +3.1%</span>
            <span className="text-yellow-400">TSLA +4.2%</span>
          </div>
        </div>

        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-72 h-8 opacity-15">
          <div className="flex justify-center space-x-6 text-xs font-mono text-slate-400 animate-pulse" style={{animationDelay: '2s'}}>
            <span className="text-emerald-400">$1.2M Portfolio</span>
            <span className="text-cyan-400">+15.3% YTD</span>
            <span className="text-pink-400">98% Accuracy</span>
            <span className="text-orange-400">24/7 AI</span>
          </div>
        </div>

        {/* Circuit Board Pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <defs>
              <pattern id="circuit" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0,20 L40,20 M20,0 L20,40 M10,10 L30,30 M30,10 L10,30" 
                      stroke="rgba(59, 130, 246, 0.3)" strokeWidth="1" fill="none"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)" />
          </svg>
        </div>

        {/* Floating Money Symbols */}
        <div className="absolute top-1/3 left-8 text-2xl text-green-400 opacity-30 animate-float">💎</div>
        <div className="absolute top-2/3 right-8 text-xl text-blue-400 opacity-25 animate-float-delayed">🏆</div>
        <div className="absolute bottom-1/3 left-12 text-lg text-purple-400 opacity-35 animate-float-slow">⚡</div>
        <div className="absolute top-1/2 right-12 text-lg text-yellow-400 opacity-30 animate-float">🎯</div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Language Selector */}
        <div className="absolute top-4 right-4 z-20">
          <LanguageSelector />
        </div>
        
        <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-8 relative overflow-hidden">
          {/* Enhanced Glass Effect with Financial Patterns */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-emerald-900/40 rounded-3xl"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: `
                radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 40% 60%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)
              `
            }}></div>
          </div>
          
          {/* AI-Capital Logo and Enhanced Branding */}
          <div className="text-center mb-8 relative z-10">
            <div className="flex items-center justify-center mb-6 relative">
              <div className="w-28 h-28 relative">
                <AcaciaLogo size={112} className="w-full h-full" />
                {/* Glowing Ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400/20 via-blue-400/20 to-purple-400/20 animate-pulse"></div>
              </div>
              {/* Floating Sparkles around logo */}
              <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full opacity-60 animate-ping"></div>
              <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-emerald-400 rounded-full opacity-50 animate-ping" style={{animationDelay: '1s'}}></div>
            </div>
            
            <h1 className="logo-text text-4xl sm:text-5xl mb-4 font-bold bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent relative">
              AI-Capital ✨
              {/* Text Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-blue-400/20 to-purple-400/20 blur-xl -z-10"></div>
            </h1>
            
            <div className={`flex items-center justify-center space-x-2 sm:space-x-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 animate-pulse" />
              <p className="text-slate-100 text-lg sm:text-xl font-bold text-center bg-gradient-to-r from-slate-200 to-slate-300 bg-clip-text text-transparent">
                {t('auth.professionalPortfolioManagement')}
              </p>
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 animate-pulse" />
            </div>
            
            <p className="text-slate-200 text-sm sm:text-base text-center px-2 font-semibold mb-6">
              🚀 {t('auth.aiPoweredDescription')}
            </p>
            
            {/* Enhanced Features Showcase */}
            <div className="mt-6 p-5 bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-xl border border-slate-600/40 backdrop-blur-sm relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="w-full h-full" style={{
                  backgroundImage: `
                    linear-gradient(45deg, rgba(16, 185, 129, 0.3) 25%, transparent 25%),
                    linear-gradient(-45deg, rgba(59, 130, 246, 0.3) 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, rgba(139, 92, 246, 0.3) 75%),
                    linear-gradient(-45deg, transparent 75%, rgba(245, 158, 11, 0.3) 75%)
                  `,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}></div>
              </div>
              
              <p className="text-emerald-300 text-sm font-bold mb-4 text-center relative z-10">
                💎 Join 1000+ Successful Traders
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs relative z-10">
                <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-800/30 hover:bg-slate-700/40 transition-all duration-200">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                  <span className="text-slate-200 font-medium">Real-time Data</span>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-800/30 hover:bg-slate-700/40 transition-all duration-200">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full animate-pulse shadow-lg" style={{animationDelay: '0.5s'}}></div>
                  <span className="text-slate-200 font-medium">AI Analytics</span>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-800/30 hover:bg-slate-700/40 transition-all duration-200">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-pulse shadow-lg" style={{animationDelay: '1s'}}></div>
                  <span className="text-slate-200 font-medium">Smart Alerts</span>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-800/30 hover:bg-slate-700/40 transition-all duration-200">
                  <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse shadow-lg" style={{animationDelay: '1.5s'}}></div>
                  <span className="text-slate-200 font-medium">Multi-Portfolio</span>
                </div>
              </div>
            </div>

            {/* Enhanced Success Stats with Animations */}
            <div className="mt-6 flex justify-center space-x-8 text-sm text-slate-300">
              <div className="text-center p-3 rounded-lg bg-slate-800/30 hover:bg-slate-700/40 transition-all duration-200">
                <div className="text-emerald-400 font-bold text-xl mb-1">+15.3%</div>
                <div className="text-xs text-slate-400">Avg Returns</div>
                <div className="w-8 h-0.5 bg-emerald-400 mx-auto mt-1 rounded-full"></div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-800/30 hover:bg-slate-700/40 transition-all duration-200">
                <div className="text-blue-400 font-bold text-xl mb-1">24/7</div>
                <div className="text-xs text-slate-400">Monitoring</div>
                <div className="w-8 h-0.5 bg-blue-400 mx-auto mt-1 rounded-full"></div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-800/30 hover:bg-slate-700/40 transition-all duration-200">
                <div className="text-purple-400 font-bold text-xl mb-1">98%</div>
                <div className="text-xs text-slate-400">Accuracy</div>
                <div className="w-8 h-0.5 bg-purple-400 mx-auto mt-1 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Enhanced Tabs */}
          <div className="flex mb-8 bg-slate-800/60 rounded-xl p-1.5 backdrop-blur-sm border border-slate-700/50">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-4 px-6 rounded-lg text-sm font-bold transition-all duration-300 relative overflow-hidden ${
                isLogin 
                  ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-xl transform scale-105' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
              }`}
            >
              {isLogin && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 animate-pulse"></div>
              )}
              <span className="relative z-10 flex items-center justify-center space-x-2">
                <span>🚀</span>
                <span>Login</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-4 px-6 rounded-lg text-sm font-bold transition-all duration-300 relative overflow-hidden ${
                !isLogin 
                  ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-xl transform scale-105' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
              }`}
            >
              {!isLogin && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 animate-pulse"></div>
              )}
              <span className="relative z-10 flex items-center justify-center space-x-2">
                <span>✨</span>
                <span>Sign Up</span>
              </span>
            </button>
          </div>

          {/* Enhanced Form */}
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {!isLogin && (
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-200 mb-3 flex items-center space-x-2">
                  <span>👤</span>
                  <span>Full Name</span>
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-slate-800/80 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300 text-base backdrop-blur-sm hover:bg-slate-800/90 hover:border-slate-500/70"
                  placeholder="Enter your full name"
                  required
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 to-blue-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            )}

            <div className="relative">
              <label className="block text-sm font-semibold text-slate-200 mb-3 flex items-center space-x-2">
                <span>📧</span>
                <span>Email</span>
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-slate-800/80 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300 text-base backdrop-blur-sm hover:bg-slate-800/90 hover:border-slate-500/70"
                placeholder="Enter your email"
                required
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 to-blue-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-slate-200 mb-3 flex items-center space-x-2">
                <span>🔒</span>
                <span>Password</span>
              </label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-slate-800/80 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300 text-base backdrop-blur-sm hover:bg-slate-800/90 hover:border-slate-500/70"
                placeholder="Enter your password"
                required
                minLength={6}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 to-blue-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>

            {error && (
              <div className="bg-red-900/80 text-red-200 px-4 py-3 rounded-xl border border-red-700/50 backdrop-blur-sm flex items-center space-x-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 hover:from-emerald-700 hover:via-blue-700 hover:to-purple-700 text-white font-bold py-5 px-8 rounded-xl transition-all duration-300 shadow-2xl hover:shadow-emerald-500/25 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed text-base relative overflow-hidden group"
            >
              {/* Button Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {loading ? (
                <div className="flex items-center justify-center space-x-3 relative z-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span className="font-semibold">Processing…</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3 relative z-10">
                  <span className="text-lg">{isLogin ? '🚀' : '✨'}</span>
                  <span className="font-bold">{isLogin ? 'Login to AI-Capital' : 'Create Your Account'}</span>
                  <span className="text-lg">{isLogin ? '🚀' : '✨'}</span>
                </div>
              )}
            </button>
          </form>

          <div className="mt-8 text-center relative z-10">
            <p className="text-sm text-slate-300 flex items-center justify-center space-x-2">
              <span>{isLogin ? "Don't have an account? " : 'Already have an account? '}</span>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-emerald-400 hover:text-emerald-300 font-semibold transition-all duration-200 hover:underline decoration-emerald-400 underline-offset-2"
              >
                {isLogin ? '✨ Sign up' : '🚀 Login'}
              </button>
            </p>
            
            {/* Additional Trust Indicators */}
            <div className="mt-6 pt-4 border-t border-slate-700/50">
              <div className="flex justify-center items-center space-x-6 text-xs text-slate-400">
                <div className="flex items-center space-x-1">
                  <span className="text-green-400">🔒</span>
                  <span>Secure</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-blue-400">⚡</span>
                  <span>Fast</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-purple-400">🎯</span>
                  <span>Accurate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
