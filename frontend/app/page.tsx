'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';

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

  // ✅ בטעינה: אם יש טוקן – מחליטים לפי /api/onboarding/status
  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      setCheckingToken(false);
      return;
    }

    (async () => {
      try {
        const { data } = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/status`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data?.onboardingCompleted) {
          router.replace('/dashboard');
        } else {
          router.replace('/onboarding');
        }
      } catch (e) {
        // אם נפל – מנקים טוקן ונשארים במסך ההתחברות
        Cookies.remove('token');
        setCheckingToken(false);
      }
    })();
  }, [router]);

  // ✅ התחברות/הרשמה -> שמירת טוקן -> החלטה לפי /api/onboarding/status
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

      Cookies.set('token', token, { expires: 7 });

      // ההכרעה הסופית – רק לפי סטטוס ה-Onboarding
      const { data: status } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (status?.onboardingCompleted) {
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Server error — please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // בזמן בדיקת הטוקן – ספינר קצר כדי לא להבהב בין מסכים
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="card p-8">
          <h1 className="text-3xl font-bold text-center text-white mb-2">AiCapital</h1>
          <p className="text-center text-gray-400 mb-6">Professional Portfolio Management</p>

          {/* Tabs */}
          <div className="flex mb-6 bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isLogin ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isLogin ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'
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
