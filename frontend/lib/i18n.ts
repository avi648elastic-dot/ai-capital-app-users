/**
 * 🌍 AI-Capital Internationalization (i18n) Framework
 * Smart, scalable language system for Arabic, Hebrew, and future languages
 */

export type SupportedLanguage = 'en' | 'ar' | 'he';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
  fontFamily: string;
}

export const LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    flag: '🇺🇸',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    flag: '🇸🇦',
    fontFamily: 'Cairo, Amiri, Arial, sans-serif'
  },
  he: {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    direction: 'rtl',
    flag: '🇮🇱',
    fontFamily: 'Heebo, David, Arial, sans-serif'
  }
};

// Translation keys type - will be auto-generated from translations
export type TranslationKey = string;

export interface Translations {
  [key: string]: string | Translations;
}

// Translation namespace structure
export interface TranslationNamespaces {
  common: Translations;
  navigation: Translations;
  portfolio: Translations;
  analytics: Translations;
  settings: Translations;
  auth: Translations;
  dashboard: Translations;
  notifications: Translations;
  admin: Translations;
  market: Translations;
  onboarding: Translations;
}

// Language context type
export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  direction: 'ltr' | 'rtl';
  isRTL: boolean;
  fontFamily: string;
}

// Utility functions
export const getLanguageConfig = (code: SupportedLanguage): LanguageConfig => {
  return LANGUAGES[code];
};

export const isRTL = (code: SupportedLanguage): boolean => {
  return LANGUAGES[code].direction === 'rtl';
};

export const getFontFamily = (code: SupportedLanguage): string => {
  return LANGUAGES[code].fontFamily;
};

// Default language detection
export const detectUserLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return 'en';
  
  // Check localStorage first
  const saved = localStorage.getItem('aicapital-language') as SupportedLanguage;
  if (saved && LANGUAGES[saved]) return saved;
  
  // Check browser language
  const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
  if (browserLang && LANGUAGES[browserLang]) return browserLang;
  
  // Check browser languages array
  for (const lang of navigator.languages) {
    const code = lang.split('-')[0] as SupportedLanguage;
    if (code && LANGUAGES[code]) return code;
  }
  
  return 'en';
};

// Translation interpolation
export const interpolate = (
  template: string, 
  params: Record<string, string | number> = {}
): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
};

// RTL text direction utilities
export const getTextAlign = (code: SupportedLanguage): 'left' | 'right' => {
  return isRTL(code) ? 'right' : 'left';
};

export const getFlexDirection = (code: SupportedLanguage): 'row' | 'row-reverse' => {
  return isRTL(code) ? 'row-reverse' : 'row';
};

export const getMarginDirection = (code: SupportedLanguage): 'ml' | 'mr' => {
  return isRTL(code) ? 'mr' : 'ml';
};

export const getPaddingDirection = (code: SupportedLanguage): 'pl' | 'pr' => {
  return isRTL(code) ? 'pr' : 'pl';
};

// Number formatting for different locales
export const formatNumber = (value: number, code: SupportedLanguage): string => {
  const locale = code === 'en' ? 'en-US' : 
                code === 'ar' ? 'ar-SA' : 
                code === 'he' ? 'he-IL' : 'en-US';
  
  return new Intl.NumberFormat(locale).format(value);
};

// Currency formatting
export const formatCurrency = (value: number, code: SupportedLanguage): string => {
  const locale = code === 'en' ? 'en-US' : 
                code === 'ar' ? 'ar-SA' : 
                code === 'he' ? 'he-IL' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

// Date formatting
export const formatDate = (date: Date, code: SupportedLanguage): string => {
  const locale = code === 'en' ? 'en-US' : 
                code === 'ar' ? 'ar-SA' : 
                code === 'he' ? 'he-IL' : 'en-US';
  
  return new Intl.DateTimeFormat(locale).format(date);
};

// Time formatting
export const formatTime = (date: Date, code: SupportedLanguage): string => {
  const locale = code === 'en' ? 'en-US' : 
                code === 'ar' ? 'ar-SA' : 
                code === 'he' ? 'he-IL' : 'en-US';
  
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: code === 'en' // 12-hour format for English, 24-hour for Arabic/Hebrew
  }).format(date);
};
