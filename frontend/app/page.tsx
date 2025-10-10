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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          {/* AI-Capital Logo and Branding */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-24 h-24 relative">
                <AcaciaLogo size={96} className="w-full h-full" />
              </div>
            </div>
            <h1 className="logo-text text-3xl sm:text-4xl mb-3 font-bold">AI-Capital ✨ NEW</h1>
            <div className="flex items-center justify-center space-x-1 sm:space-x-2 mb-2">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              <p className="text-slate-300 text-base sm:text-lg font-semibold text-center">Professional Portfolio Management V2</p>
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            </div>
            <p className="text-slate-400 text-xs sm:text-sm text-center px-2">AI-Powered Trading Decisions & Real-Time Analytics</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs text-slate-500">
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="hidden sm:inline">Real-time Data</span>
                <span className="sm:hidden">Real-time</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="hidden sm:inline">AI Analytics</span>
                <span className="sm:hidden">AI</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="hidden sm:inline">Portfolio Management</span>
                <span className="sm:hidden">Portfolio</span>
              </span>
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
