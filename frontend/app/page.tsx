'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Crown } from 'lucide-react';

// ✅ כל הבקשות ישלחו קובצי cookie גם לדומיין אחר (cross-site)
axios.defaults.withCredentials = true;

type MeUser = {
  id: string;
  email: string;
  name: string;
  subscriptionActive: boolean;
};

export default function Page() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  /**
   * ✅ בטעינה — אם יש token נבדוק סטטוס onboarding
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
   * ✅ התחברות / הרשמה
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

      // ✅ cookie מוגדר נכון לפרודקשן (https)
      Cookies.set('token', token, {
        expires: 7,
        secure: true,
        sameSite: 'None', // חובה בפרודקשן
      });

      // ✅ נבדוק שוב את הסטטוס
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
   * ⏳ בזמן בדיקה של הטוקן – נציג ספינר
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
   * 🧠 טופס התחברות / הרשמה
   */
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="card p-8">
          {/* AI-Capital Logo and Branding */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-24 h-24 relative">
                <img 
                  src="/logo.png" 
                  alt="AiCapital Logo" 
                  className="w-full h-full object-contain" 
                  style={{
                    filter: 'drop-shadow(0 0 0 transparent)',
                    background: 'transparent',
                    mixBlendMode: 'normal'
                  }}
                />
              </div>
            </div>
            <h1 className="logo-text text-4xl mb-3 font-bold">AI-Capital</h1>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <p className="text-slate-300 text-lg font-semibold">Professional Portfolio Management</p>
              <Crown className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-slate-400 text-sm">AI-Powered Trading Decisions & Real-Time Analytics</p>
            <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-slate-500">
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Real-time Data</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>AI Analytics</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Portfolio Management</span>
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
                <label className="block text-sm text-gray-300 mb-1">Full Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-300 mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Password</label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
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
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing…' : isLogin ? 'Login' : 'Create Account'}
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
