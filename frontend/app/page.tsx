'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  name: string;
  subscriptionActive: boolean;
  onboardingCompleted?: boolean;
}

export default function Page() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  /**
   * ✅ אם יש טוקן קיים – לבדוק את הסטטוס של המשתמש
   * ולהחליט האם לשלוח ל-onboarding או ל-dashboard
   */
  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) return;

    (async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = res.data?.user;
        console.log('🔹 useEffect user:', user);

        if (!user) {
          Cookies.remove('token');
          return;
        }

        // אם המשתמש לא השלים Onboarding – נשלח ל-onboarding
        if (!user.onboardingCompleted || user.onboardingCompleted === false) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('❌ Error fetching user:', err);
        Cookies.remove('token');
      }
    })();
  }, [router]);

  /**
   * ✅ התחברות או הרשמה
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

      if (!data?.token) {
        setError('Unexpected response from server');
        return;
      }

      Cookies.set('token', data.token, { expires: 7 });

      // 🔹 נבדוק את סטטוס המשתמש לפי ה-token
      const { data: me } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
        {
          headers: { Authorization: `Bearer ${data.token}` },
        }
      );

      const user = me?.user;
      console.log('🚀 USER FROM /api/auth/me:', user);

      if (!user) {
        setError('Failed to load user data');
        return;
      }

      // 🔹 נוודא הפניה נכונה
      if (!user.onboardingCompleted || user.onboardingCompleted === false) {
        console.log('🧭 Redirecting to /onboarding ...');
        router.push('/onboarding');
      } else {
        console.log('🧭 Redirecting to /dashboard ...');
        router.push('/dashboard');
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Server error — please try again';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * ✅ ממשק משתמש
   */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="card p-8">
          {/* כותרת */}
          <h1 className="text-3xl font-bold text-center text-white mb-6">
            AiCapital
          </h1>
          <p className="text-center text-gray-400 mb-6">
            Professional Portfolio Management
          </p>

          {/* טאבים Login / Sign Up */}
          <div className="flex mb-6 bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isLogin
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isLogin
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* טופס */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Full Name
                </label>
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
              <label className="block text-sm text-gray-300 mb-1">
                Email
              </label>
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
              <label className="block text-sm text-gray-300 mb-1">
                Password
              </label>
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
              <div className="bg-red-900 text-red-300 px-3 py-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Processing...'
                : isLogin
                ? 'Login'
                : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {isLogin
                ? "Don't have an account? "
                : 'Already have an account? '}
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
