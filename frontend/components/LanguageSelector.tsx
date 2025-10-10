'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Locale } from '@/contexts/LanguageContext';

const LanguageSelector: React.FC = () => {
  const { locale, setLocale } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      setLocale(e.target.value as Locale);
    } catch (error) {
      console.warn('Failed to change language:', error);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <select
        value={locale}
        onChange={handleChange}
        className="appearance-none bg-slate-800/70 border border-slate-600/50 text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 pr-8 transition-all duration-200 cursor-pointer hover:bg-slate-700/70"
      >
        <option value="en">🇬🇧 English</option>
        <option value="ar">🇸🇦 العربية</option>
        <option value="he">🇮🇱 עברית</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </div>
  );
};

export default LanguageSelector;