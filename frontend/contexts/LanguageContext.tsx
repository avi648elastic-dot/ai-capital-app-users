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
      notifications: 'Notifications',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      open: 'Open',
      refresh: 'Refresh',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      export: 'Export',
      import: 'Import',
      addStock: 'Add Stock',
      addPortfolio: 'Add Portfolio',
      deletePortfolio: 'Delete Portfolio',
      portfolios: 'Portfolios',
      solid: 'solid',
      risky: 'risky',
      weekend: 'Weekend',
      day: 'day',
      preMarket: 'Pre-Market',
      afterHours: 'After Hours',
      profile: 'Profile',
      logout: 'Logout',
      startTour: 'Start Tour'
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
    },
    dashboard: {
      welcomeBack: 'Welcome Back',
      totalPortfolioValue: 'Total Portfolio Value',
      todaysReturn: "Today's Return",
      totalReturn: 'Total Return',
      portfolioOverview: 'Portfolio Overview',
      recentActivity: 'Recent Activity',
      marketStatus: 'Market Status',
      marketOpen: 'Market is Open',
      marketClosed: 'Market is Closed',
      closesIn: 'Closes in',
      opensIn: 'Opens in',
      singleView: 'Single View',
      multiPortfolio: 'Multi-Portfolio'
    },
    settings: {
      title: 'Settings',
      subtitle: 'Customize your experience',
      language: 'Language',
      appearance: 'Appearance',
      theme: 'Theme',
      dark: 'Dark',
      light: 'Light',
      notifications: 'Notifications',
      pushNotifications: 'Push Notifications',
      pushNotificationsDesc: 'Receive notifications about your portfolio',
      emailUpdates: 'Email Updates',
      emailUpdatesDesc: 'Receive weekly portfolio summaries',
      manageProfile: 'Manage Profile',
      updatePersonalInfo: 'Update your personal information',
      subscription: 'Subscription',
      manageSubscription: 'Manage your subscription plan',
      signOut: 'Sign Out',
      logoutFromAccount: 'Logout from your account',
      account: 'Account'
    },
    navigation: {
      dashboard: 'Dashboard',
      analytics: 'Analytics',
      performance: 'Performance',
      portfolioAnalysis: 'Portfolio Analysis',
      watchlist: 'Watchlist',
      riskManagement: 'Risk Management',
      reports: 'Reports',
      subscription: 'Subscription',
      settings: 'Settings',
      adminPanel: 'Admin Panel',
      adminDashboard: 'Admin Dashboard',
      adminNotifications: 'Notifications'
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
      notifications: 'התראות',
      loading: 'טוען...',
      error: 'שגיאה',
      success: 'הצלחה',
      save: 'שמור',
      cancel: 'בטל',
      delete: 'מחק',
      edit: 'ערוך',
      view: 'צפה',
      back: 'חזור',
      next: 'הבא',
      previous: 'הקודם',
      close: 'סגור',
      open: 'פתח',
      refresh: 'רענן',
      search: 'חפש',
      filter: 'סנן',
      sort: 'מיין',
      export: 'ייצא',
      import: 'ייבא',
      addStock: 'הוסף מניה',
      addPortfolio: 'הוסף תיק',
      deletePortfolio: 'מחק תיק',
      portfolios: 'תיקים',
      solid: 'יציב',
      risky: 'מסוכן',
      weekend: 'סוף שבוע',
      day: 'יום',
      preMarket: 'לפני השוק',
      afterHours: 'אחרי השוק',
      profile: 'פרופיל',
      logout: 'התנתק',
      startTour: 'התחל סיור'
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
    },
    dashboard: {
      welcomeBack: 'ברוך הבא',
      totalPortfolioValue: 'ערך תיק כולל',
      todaysReturn: 'תשואה היום',
      totalReturn: 'תשואה כוללת',
      portfolioOverview: 'סקירת תיק',
      recentActivity: 'פעילות אחרונה',
      marketStatus: 'סטטוס שוק',
      marketOpen: 'השוק פתוח',
      marketClosed: 'השוק סגור',
      closesIn: 'נסגר בעוד',
      opensIn: 'נפתח בעוד',
      singleView: 'תצוגה יחידה',
      multiPortfolio: 'תיקים מרובים'
    },
    settings: {
      title: 'הגדרות',
      subtitle: 'התאם את החוויה שלך',
      language: 'שפה',
      appearance: 'מראה',
      theme: 'ערכת נושא',
      dark: 'כהה',
      light: 'בהירה',
      notifications: 'התראות',
      pushNotifications: 'התראות דחיפה',
      pushNotificationsDesc: 'קבל התראות על התיק שלך',
      emailUpdates: 'עדכוני אימייל',
      emailUpdatesDesc: 'קבל סיכומי תיק שבועיים',
      manageProfile: 'נהל פרופיל',
      updatePersonalInfo: 'עדכן את המידע האישי שלך',
      subscription: 'מנוי',
      manageSubscription: 'נהל את תוכנית המנוי שלך',
      signOut: 'התנתק',
      logoutFromAccount: 'התנתק מהחשבון שלך',
      account: 'חשבון'
    },
    navigation: {
      dashboard: 'לוח מחוונים',
      analytics: 'אנליטיקה',
      performance: 'ביצועים',
      portfolioAnalysis: 'ניתוח תיק',
      watchlist: 'רשימת מעקב',
      riskManagement: 'ניהול סיכונים',
      reports: 'דוחות',
      subscription: 'מנוי',
      settings: 'הגדרות',
      adminPanel: 'לוח ניהול',
      adminDashboard: 'לוח ניהול',
      adminNotifications: 'התראות'
    }
  }
};

export type TranslationKeys = 
  | keyof typeof translations.en.common 
  | keyof typeof translations.en.auth
  | keyof typeof translations.en.dashboard
  | keyof typeof translations.en.settings
  | keyof typeof translations.en.navigation;

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

  // Apply language changes to document
  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.body.className = isRTL ? 'rtl' : '';
  }, [locale, isRTL]);

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