'use client';

import { useState } from 'react';
import { ArrowRight, Globe, Palette, X } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
// import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface Step0Props {
  onComplete: (data: any) => void;
}

export default function Step0({ onComplete }: Step0Props) {
  // const { setLanguage, t } = useLanguage();
  const { setTheme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'light'>('dark');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', native: 'English' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', native: 'Arabic' },
    { code: 'he', name: 'עברית', flag: '🇮🇱', native: 'Hebrew' },
  ];

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const handleThemeChange = (theme: string) => {
    setSelectedTheme(theme as 'dark' | 'light');
    setTheme(theme as 'dark' | 'light');
    localStorage.setItem('theme', theme);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('token');
      if (!token) {
        alert('Please sign up or login first!');
        window.location.href = '/';
        return;
      }

      // Save language and theme to user profile
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/update-profile`,
        { language: selectedLanguage, theme: selectedTheme },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Store preferences locally for immediate use
      localStorage.setItem('language', selectedLanguage);
      localStorage.setItem('theme', selectedTheme);
      
      onComplete({ language: selectedLanguage, theme: selectedTheme });

    } catch (error: unknown) {
      console.error('Error saving language preference:', error);
      
      // Even if API fails, continue with selected preferences
      localStorage.setItem('language', selectedLanguage);
      localStorage.setItem('theme', selectedTheme);
      onComplete({ language: selectedLanguage, theme: selectedTheme });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Globe className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Language</h2>
        <p className="text-gray-400 mb-6">Select your preferred language for the best experience</p>
      </div>

      <div className="max-w-md mx-auto space-y-3">
        {languages.map((lang) => (
               <button
                 key={lang.code}
                 onClick={() => handleLanguageChange(lang.code)}
                 className={`w-full p-4 rounded-lg border text-left transition-colors flex items-center space-x-4 ${
                   selectedLanguage === lang.code
                     ? 'border-primary-500 bg-primary-500/10'
                     : 'border-slate-700 hover:border-slate-600'
                 }`}
               >
            <span className="text-2xl">{lang.flag}</span>
            <div className="flex-1">
              <div className="text-white font-medium">{lang.name}</div>
              <div className="text-sm text-slate-400">{lang.native}</div>
            </div>
            {selectedLanguage === lang.code && (
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Theme selection */}
      <div className="mt-8">
        <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
          <Palette className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Choose Theme</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { id: 'dark', name: 'Dark', description: 'Default dark theme' },
            { id: 'light', name: 'Light', description: 'Clean light theme' },
          ].map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`p-4 rounded-lg border text-left transition-colors ${
                selectedTheme === theme.id
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="text-white font-medium">{theme.name}</div>
              <div className="text-sm text-slate-400">{theme.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Terms and Privacy Acceptance - REQUIRED */}
      <div className="mt-8 max-w-md mx-auto">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-4">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-red-500 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-red-100 flex-1">
              I have read and accept the{' '}
              <button 
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-red-300 underline hover:text-red-200 font-semibold"
              >
                Terms of Service
              </button>
              {' '}and{' '}
              <button 
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="text-red-300 underline hover:text-red-200 font-semibold"
              >
                Privacy Policy
              </button>. 
              I understand that AiCapital does NOT provide financial advice and I am solely responsible for my investment decisions.
            </span>
          </label>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={loading || !acceptedTerms}
          className="btn-primary flex items-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        
        {!acceptedTerms && (
          <p className="text-xs text-red-400 mt-2 text-center">
            You must accept the terms to continue
          </p>
        )}
      </div>

      {loading && (
        <div className="mt-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-gray-400 mt-2 text-sm">Saving preferences...</p>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg max-w-4xl w-full h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
              <h1 className="text-xl font-bold text-white">Terms of Service</h1>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
                <h2 className="text-red-300 text-lg font-semibold mb-2">⚠️ IMPORTANT LEGAL DISCLAIMER</h2>
                <p className="text-red-100">
                  <strong>AiCapital does NOT provide financial advice.</strong> All information, analysis, and recommendations 
                  are for educational and informational purposes only. You are solely responsible for your investment decisions.
                </p>
              </div>
              <section className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
                <p className="text-slate-300 leading-relaxed">
                  By accessing and using AiCapital ("Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>
              <section className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-3">2. Investment Disclaimers</h2>
                <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
                  <p className="text-yellow-100 font-semibold">
                    NOT FINANCIAL ADVICE: Nothing on this platform constitutes financial, investment, or trading advice.
                  </p>
                </div>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                  <li>Past performance does not guarantee future results</li>
                  <li>All investments carry risk of loss</li>
                  <li>You should consult with qualified financial advisors before making investment decisions</li>
                  <li>We are not registered investment advisors</li>
                </ul>
              </section>
              <section className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-3">3. Limitation of Liability</h2>
                <p className="text-slate-300 leading-relaxed">
                  To the fullest extent permitted by law, AiCapital shall not be liable for any direct, indirect, incidental, 
                  special, consequential, or punitive damages, including but not limited to, loss of profits, data, use, 
                  goodwill, or other intangible losses, resulting from your use of the service.
                </p>
              </section>
            </div>
            <div className="p-4 border-t border-slate-700 flex-shrink-0">
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                I Understand and Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg max-w-4xl w-full h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
              <h1 className="text-xl font-bold text-white">Privacy Policy</h1>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 mb-6">
                <h2 className="text-blue-300 text-lg font-semibold mb-2">🔒 GDPR Compliant</h2>
                <p className="text-blue-100">
                  This Privacy Policy complies with the General Data Protection Regulation (GDPR) and other applicable privacy laws.
                  We are committed to protecting your personal data and respecting your privacy rights.
                </p>
              </div>
              <section className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
                <div className="bg-slate-800 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-medium text-white mb-2">Personal Information:</h3>
                  <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                    <li>Name and email address (for account creation)</li>
                    <li>Portfolio data and investment preferences</li>
                    <li>Usage analytics and app interactions</li>
                    <li>Device information and IP address</li>
                  </ul>
                </div>
              </section>
              <section className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-3">2. Your Rights (GDPR)</h2>
                <p className="text-slate-300 leading-relaxed mb-3">
                  Under GDPR, you have the following rights regarding your personal data:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-800 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-2">Access & Portability</h3>
                    <p className="text-slate-300 text-sm">Request copies of your data and receive it in a portable format</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-2">Erasure</h3>
                    <p className="text-slate-300 text-sm">Request deletion of your personal data</p>
                  </div>
                </div>
              </section>
              <section className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-3">3. Data Security</h2>
                <p className="text-slate-300 leading-relaxed mb-3">
                  We implement industry-standard security measures to protect your data:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                  <li>End-to-end encryption for sensitive data transmission</li>
                  <li>Secure data storage with regular backups</li>
                  <li>Multi-factor authentication for account access</li>
                  <li>Regular security audits and updates</li>
                </ul>
              </section>
            </div>
            <div className="p-4 border-t border-slate-700 flex-shrink-0">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                I Understand and Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
