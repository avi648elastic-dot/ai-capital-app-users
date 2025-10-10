'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Simple language types
export type Locale = 'en' | 'ar' | 'he';

// Simple translations
const translations = {
  en: {
    common: {
      hello: 'Hello',
      dashboard: 'Dashboard',
      portfolio: 'Portfolio',
      analytics: 'Analytics',
      riskManagement: 'Risk Management',
      reports: 'Reports',
      settings: 'Settings',
      admin: 'Admin',
      notifications: 'Notifications'
    },
    auth: {
      login: 'Login',
      signup: 'Sign Up',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      fullName: 'Full Name',
      forgotPassword: 'Forgot Password?',
      createAccount: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      loginToAiCapital: 'Login to AI-Capital',
      createYourAccount: 'Create Your Account',
      processing: 'Processing...',
      secure: 'Secure',
      fast: 'Fast',
      accurate: 'Accurate',
      professionalPortfolioManagement: 'Professional Portfolio Management V2',
      aiPoweredDescription: 'AI-Powered Trading Decisions & Real-Time Analytics'
    }
  },
  ar: {
    common: {
      hello: 'مرحباً',
      dashboard: 'لوحة القيادة',
      portfolio: 'المحفظة',
      analytics: 'التحليلات',
      riskManagement: 'إدارة المخاطر',
      reports: 'التقارير',
      settings: 'الإعدادات',
      admin: 'الإدارة',
      notifications: 'الإشعارات'
    },
    auth: {
      login: 'تسجيل الدخول',
      signup: 'إنشاء حساب',
      logout: 'تسجيل الخروج',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      fullName: 'الاسم الكامل',
      forgotPassword: 'نسيت كلمة المرور؟',
      createAccount: 'إنشاء حساب',
      alreadyHaveAccount: 'هل لديك حساب بالفعل؟',
      dontHaveAccount: 'ليس لديك حساب؟',
      loginToAiCapital: 'تسجيل الدخول إلى AI-Capital',
      createYourAccount: 'إنشاء حسابك',
      processing: 'جار المعالجة...',
      secure: 'آمن',
      fast: 'سريع',
      accurate: 'دقيق',
      professionalPortfolioManagement: 'إدارة المحافظ المهنية V2',
      aiPoweredDescription: 'قرارات تداول مدعومة بالذكاء الاصطناعي وتحليلات في الوقت الفعلي'
    }
  },
  he: {
    common: {
      hello: 'שלום',
      dashboard: 'לוח מחוונים',
      portfolio: 'תיק השקעות',
      analytics: 'אנליטיקה',
      riskManagement: 'ניהול סיכונים',
      reports: 'דוחות',
      settings: 'הגדרות',
      admin: 'מנהל',
      notifications: 'התראות'
    },
    auth: {
      login: 'התחברות',
      signup: 'הרשמה',
      logout: 'התנתקות',
      email: 'אימייל',
      password: 'סיסמה',
      fullName: 'שם מלא',
      forgotPassword: 'שכחת סיסמה?',
      createAccount: 'יצירת חשבון',
      alreadyHaveAccount: 'יש לך כבר חשבון?',
      dontHaveAccount: 'אין לך חשבון?',
      loginToAiCapital: 'התחברות ל-AI-Capital',
      createYourAccount: 'צור את החשבון שלך',
      processing: 'מעבד...',
      secure: 'מאובטח',
      fast: 'מהיר',
      accurate: 'מדויק',
      professionalPortfolioManagement: 'ניהול תיקים מקצועי V2',
      aiPoweredDescription: 'החלטות מסחר מבוססות בינה מלאכותית ואנליטיקה בזמן אמת'
    }
  }
};

export type TranslationKeys = keyof typeof translations.en.common | keyof typeof translations.en.auth;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKeys, params?: Record<string, string>) => string;
  isRTL: boolean;
  fontClass: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    try {
      // Try to get locale from localStorage, otherwise detect from browser or default to 'en'
      const savedLocale = localStorage.getItem('locale') as Locale;
      if (savedLocale && ['en', 'ar', 'he'].includes(savedLocale)) {
        setLocaleState(savedLocale);
      } else {
        const browserLanguage = navigator.language.split('-')[0];
        if (['ar', 'he'].includes(browserLanguage)) {
          setLocaleState(browserLanguage as Locale);
        }
      }
    } catch (error) {
      console.warn('Failed to load language preference, using English:', error);
      setLocaleState('en');
    }
  }, []);

  useEffect(() => {
    try {
      // Update localStorage and HTML attributes when locale changes
      localStorage.setItem('locale', locale);
      document.documentElement.lang = locale;
      document.documentElement.dir = ['ar', 'he'].includes(locale) ? 'rtl' : 'ltr';
      
      // Apply font class to body
      const fontClass = locale === 'ar' ? 'lang-ar' : locale === 'he' ? 'lang-he' : 'lang-en';
      document.body.className = fontClass;
    } catch (error) {
      console.warn('Failed to apply language styles:', error);
    }
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    try {
      setLocaleState(newLocale);
    } catch (error) {
      console.warn('Failed to set locale:', error);
    }
  };

  const t = (key: TranslationKeys, params?: Record<string, string>) => {
    try {
      const keys = key.split('.');
      let text: any = translations[locale];

      for (const k of keys) {
        if (text && typeof text === 'object' && k in text) {
          text = text[k];
        } else {
          // Fallback to English if key not found in current locale
          text = (translations.en as any)[k] || key; 
          break;
        }
      }

      if (typeof text !== 'string') {
        // Fallback to English if final text is not a string
        text = (translations.en as any)[key] || key;
      }

      // Simple parameter interpolation
      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          text = text.replace(`{{${paramKey}}}`, paramValue);
        }
      }

      return text;
    } catch (error) {
      console.warn('Translation error:', error);
      return key; // Return the key as fallback
    }
  };

  const isRTL = ['ar', 'he'].includes(locale);
  const fontClass = locale === 'ar' ? 'lang-ar' : locale === 'he' ? 'lang-he' : 'lang-en';

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, isRTL, fontClass }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}