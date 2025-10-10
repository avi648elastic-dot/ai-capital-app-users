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
          <div className="card p-8 relative">
            {/* Glass Effect Overlay */}
            <div 
              className="absolute inset-0 rounded-xl opacity-10"
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