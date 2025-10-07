'use client';

import { useState } from 'react';
import { ArrowRight, Globe, Palette } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

interface Step0Props {
  onComplete: (data: any) => void;
}

export default function Step0({ onComplete }: Step0Props) {
  const { setLanguage, t } = useLanguage();
  const { setTheme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'light'>('dark');
  const [loading, setLoading] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', native: 'English' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', native: 'Arabic' },
    { code: 'he', name: 'עברית', flag: '🇮🇱', native: 'Hebrew' },
  ];

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setLanguage(lang); // Force immediate change
  };

  const handleThemeChange = (theme: string) => {
    setSelectedTheme(theme as 'dark' | 'light');
    setTheme(theme); // Force immediate change
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
        <h2 className="text-2xl font-bold text-white mb-2">{t('chooseLanguage')}</h2>
        <p className="text-gray-400 mb-6">{t('selectLanguageExperience')}</p>
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
        <h3 className="text-lg font-semibold text-white mb-2">{t('chooseTheme')}</h3>
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

      <div className="mt-8">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary flex items-center space-x-2 mx-auto"
        >
          <span>{t('continue')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {loading && (
        <div className="mt-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-gray-400 mt-2 text-sm">{t('savingPreferences')}</p>
        </div>
      )}
    </div>
  );
}
