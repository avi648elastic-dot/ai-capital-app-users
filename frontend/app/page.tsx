'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Crown } from 'lucide-react';
import AcaciaLogo from '@/components/AcaciaLogo';
// import { useLanguage } from '@/contexts/LanguageContext';

// ✅ All requests will send cookies to other domains (cross-site)
axios.defaults.withCredentials = true;

type MeUser = {
  id: string;
  email: string;
  name: string;
  subscriptionActive: boolean;
};

export default function Page() {
  // const { t } = useLanguage();
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
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Stock Charts */}
        <div className="absolute top-20 left-10 w-16 h-16 opacity-20 animate-pulse">
          <svg viewBox="0 0 100 100" className="w-full h-full text-green-400">
            <path d="M10,80 L20,60 L30,70 L40,40 L50,50 L60,30 L70,45 L80,25 L90,35" 
                  stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="90" cy="35" r="3" fill="currentColor" />
          </svg>
        </div>
        
        <div className="absolute top-40 right-16 w-12 h-12 opacity-15 animate-bounce">
          <svg viewBox="0 0 100 100" className="w-full h-full text-blue-400">
            <path d="M10,70 L25,50 L40,60 L55,30 L70,40 L85,20" 
                  stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="85" cy="20" r="2" fill="currentColor" />
          </svg>
        </div>

        <div className="absolute bottom-32 left-20 w-14 h-14 opacity-25 animate-pulse">
          <svg viewBox="0 0 100 100" className="w-full h-full text-purple-400">
            <path d="M10,75 L30,55 L50,65 L70,35 L90,45" 
                  stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="90" cy="45" r="3" fill="currentColor" />
          </svg>
        </div>

        {/* Floating Financial Icons */}
        <div className="absolute top-32 right-32 w-8 h-8 opacity-30 animate-float">
          <div className="w-full h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
            $
          </div>
        </div>

        <div className="absolute bottom-40 right-24 w-6 h-6 opacity-25 animate-float-delayed">
          <div className="w-full h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
            %
          </div>
        </div>

        <div className="absolute top-60 left-32 w-7 h-7 opacity-20 animate-float-slow">
          <div className="w-full h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
            📈
          </div>
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Subtle Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400 rounded-full opacity-40 animate-ping"></div>
        <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-blue-400 rounded-full opacity-50 animate-ping" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-30 animate-ping" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          {/* AI-Capital Logo and Branding */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-24 h-24 relative">
                <AcaciaLogo size={96} className="w-full h-full" />
              </div>
            </div>
            <h1 className="logo-text text-3xl sm:text-4xl mb-3 font-bold bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI-Capital ✨
            </h1>
            <div className="flex items-center justify-center space-x-1 sm:space-x-2 mb-2">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 animate-pulse" />
              <p className="text-slate-200 text-base sm:text-lg font-semibold text-center">
                Professional Portfolio Management V2
              </p>
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 animate-pulse" />
            </div>
            <p className="text-slate-300 text-sm sm:text-base text-center px-2 font-medium">
              🚀 AI-Powered Trading Decisions & Real-Time Analytics
            </p>
            
            {/* Exciting Features */}
            <div className="mt-6 p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg border border-slate-600/30">
              <p className="text-emerald-300 text-sm font-semibold mb-3 text-center">
                💎 Join 1000+ Successful Traders
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-slate-300">Real-time Data</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  <span className="text-slate-300">AI Analytics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                  <span className="text-slate-300">Smart Alerts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
                  <span className="text-slate-300">Multi-Portfolio</span>
                </div>
              </div>
            </div>

            {/* Success Stats */}
            <div className="mt-4 flex justify-center space-x-6 text-xs text-slate-400">
              <div className="text-center">
                <div className="text-emerald-400 font-bold text-lg">+15.3%</div>
                <div>Avg Returns</div>
              </div>
              <div className="text-center">
                <div className="text-blue-400 font-bold text-lg">24/7</div>
                <div>Monitoring</div>
              </div>
              <div className="text-center">
                <div className="text-purple-400 font-bold text-lg">98%</div>
                <div>Accuracy</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex mb-6 bg-slate-800/50 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${
                isLogin 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${
                !isLogin 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm text-gray-300 mb-2">Full Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-300 mb-2">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-base"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Password</label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-base"
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-900 text-red-300 px-3 py-2 rounded">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing…</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>{isLogin ? '🚀 Login' : '✨ Create Account'}</span>
                </div>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary-400 hover:text-primary-300 font-medium"
              >
                {isLogin ? 'Sign up' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
