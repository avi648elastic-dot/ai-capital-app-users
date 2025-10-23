'use client';

import { useRouter } from 'next/navigation';
import { BarChart3, TrendingUp, Shield, Zap, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AboutPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              AI-Capital
            </h1>
            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as 'en' | 'ar' | 'he')}
                className="bg-slate-800 text-slate-300 border border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="he">עברית</option>
              </select>
              <button
                onClick={() => router.push('/pricing')}
                className="text-slate-300 hover:text-white transition-colors"
              >
                {t('landing.footer.pricing')}
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold rounded-lg transition-all"
              >
                {t('about.getStarted')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero */}
        <div className="text-center mb-20">
          <h1 className="text-6xl font-black text-white mb-6">
            {t('about.title')}
          </h1>
          <p className="text-2xl text-slate-400 max-w-3xl mx-auto">
            {t('about.subtitle')}
          </p>
        </div>

        {/* Mission */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-white mb-6 text-center">{t('about.missionTitle')}</h2>
          <p className="text-lg text-slate-300 leading-relaxed text-center max-w-3xl mx-auto">
            {t('about.missionText')}
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{t('about.realtimeTitle')}</h3>
            <p className="text-slate-400">
              {t('about.realtimeDesc')}
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{t('about.aiTitle')}</h3>
            <p className="text-slate-400">
              {t('about.aiDesc')}
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{t('about.riskTitle')}</h3>
            <p className="text-slate-400">
              {t('about.riskDesc')}
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-700 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{t('about.alertsTitle')}</h3>
            <p className="text-slate-400">
              {t('about.alertsDesc')}
            </p>
          </div>
        </div>

        {/* Technology */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700 mb-20">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">{t('about.techTitle')}</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <h4 className="font-bold text-white mb-2">{t('about.apiKeys')}</h4>
              <p className="text-slate-400 text-sm">
                {t('about.apiKeysDesc')}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">{t('about.realtimeData')}</h4>
              <p className="text-slate-400 text-sm">
                {t('about.realtimeDataDesc')}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">{t('about.smartCaching')}</h4>
              <p className="text-slate-400 text-sm">
                {t('about.smartCachingDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            {t('about.ctaTitle')}
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            {t('about.ctaSubtitle')}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-12 py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-lg font-bold rounded-xl transition-all shadow-2xl shadow-emerald-500/20"
          >
            {t('about.startFree')}
          </button>
        </div>
      </div>
    </div>
  );
}
