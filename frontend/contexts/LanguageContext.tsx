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
      watchlistTitle: 'Watchlist',
      watchlistSubtitle: 'Track your favorite stocks and get real-time price alerts',
      addStock: 'Add Stock to Watchlist',
      enterSymbol: 'Enter stock symbol (e.g., AAPL)',
      adding: 'Adding...',
      addButton: 'Add Stock',
      emptyTitle: 'Your Watchlist is Empty',
      emptyDescription: 'Add stocks you want to track and get notified about price changes.',
      currentPrice: 'Current Price',
      priceChange: 'Price Change',
      notifications: 'Notifications',
      notificationsEnabled: 'Notifications enabled',
      notificationsDisabled: 'Notifications disabled',
      setPriceAlert: 'Set price alert',
      removeStock: 'Remove from watchlist',
      addedDate: 'Added',
      trackingStocks: 'You\'re tracking',
      of: 'of',
      stocks: 'stocks',
      upgradeMessage: 'Upgrade to Premium+ to track up to 20 stocks!',
      priceAlertTitle: 'Set Price Alert',
      alertType: 'Alert Type',
      highOnly: 'High Only',
      lowOnly: 'Low Only',
      both: 'Both',
      highPriceLabel: 'High Price Alert (When price goes above)',
      lowPriceLabel: 'Low Price Alert (When price goes below)',
      smartMonitoring: 'Smart Monitoring',
      smartMonitoringDesc: 'Our system automatically checks prices every 5 minutes and sends you instant notifications when your targets are reached.',
      priceAlertActive: 'Price Alert Active',
      high: 'High',
      low: 'Low',
      triggered: 'Triggered',
      time: 'time',
      times: 'times',
      removeAlert: 'Remove alert',
      removeAlertConfirm: 'Are you sure you want to remove this price alert?',
      removeStockConfirm: 'Are you sure you want to remove this stock from your watchlist?',
      alertSetSuccess: 'Price alert set successfully!',
      stockAdded: 'added to watchlist!',
      validHighPrice: 'Please enter a valid high price',
      validLowPrice: 'Please enter a valid low price',
      lowLessThanHigh: 'Low price must be less than high price',
      failedToAdd: 'Failed to add stock to watchlist',
      failedToRemove: 'Failed to remove stock from watchlist',
      failedToUpdate: 'Failed to update notifications',
      failedToSetAlert: 'Failed to set price alert',
      failedToRemoveAlert: 'Failed to remove price alert',
      riskManagement: 'Risk Management',
      reports: 'Reports',
      subscription: 'Subscription',
      settings: 'Settings',
      adminPanel: 'Admin Panel',
      adminDashboard: 'Admin Dashboard',
      adminNotifications: 'Notifications'
    },
    portfolio: {
      exchange: 'Exchange',
      ticker: 'Ticker',
      shares: 'Shares',
      entry: 'Entry',
      current: 'Current',
      cost: 'Cost',
      value: 'Value',
      pnl: 'P&L',
      stopLoss: 'Stop Loss',
      takeProfit: 'Take Profit',
      action: 'Action',
      date: 'Date',
      actions: 'Actions',
      noStocks: 'No stocks in this portfolio',
      addStocksPrompt: 'Add some stocks to get started with AI-powered portfolio management',
      editStockDetails: 'Edit stock details',
      deleteStock: 'Delete stock'
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
      notifications: 'الإشعارات',
      loading: 'جار التحميل...',
      error: 'خطأ',
      success: 'نجاح',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      view: 'عرض',
      back: 'رجوع',
      next: 'التالي',
      previous: 'السابق',
      close: 'إغلاق',
      open: 'فتح',
      refresh: 'تحديث',
      search: 'بحث',
      filter: 'تصفية',
      sort: 'ترتيب',
      export: 'تصدير',
      import: 'استيراد',
      addStock: 'إضافة سهم',
      addPortfolio: 'إضافة محفظة',
      deletePortfolio: 'حذف محفظة',
      portfolios: 'المحافظ',
      solid: 'صلب',
      risky: 'محفوف بالمخاطر',
      weekend: 'عطلة نهاية الأسبوع',
      day: 'يوم',
      preMarket: 'قبل السوق',
      afterHours: 'بعد ساعات التداول',
      profile: 'الملف الشخصي',
      logout: 'تسجيل الخروج',
      startTour: 'بدء الجولة'
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
    },
    dashboard: {
      welcomeBack: 'مرحباً بعودتك',
      totalPortfolioValue: 'إجمالي قيمة المحفظة',
      todaysReturn: 'عائد اليوم',
      totalReturn: 'إجمالي العائد',
      portfolioOverview: 'نظرة عامة على المحفظة',
      recentActivity: 'النشاط الأخير',
      marketStatus: 'حالة السوق',
      marketOpen: 'السوق مفتوح',
      marketClosed: 'السوق مغلق',
      closesIn: 'يغلق في',
      opensIn: 'يفتح في',
      singleView: 'عرض فردي',
      multiPortfolio: 'متعدد المحافظ'
    },
    settings: {
      title: 'الإعدادات',
      subtitle: 'تخصيص تجربتك',
      language: 'اللغة',
      appearance: 'المظهر',
      theme: 'السمة',
      dark: 'داكن',
      light: 'فاتح',
      notifications: 'الإشعارات',
      pushNotifications: 'إشعارات الدفع',
      pushNotificationsDesc: 'تلقي إشعارات حول محفظتك',
      emailUpdates: 'تحديثات البريد الإلكتروني',
      emailUpdatesDesc: 'تلقي ملخصات المحفظة الأسبوعية',
      manageProfile: 'إدارة الملف الشخصي',
      updatePersonalInfo: 'تحديث معلوماتك الشخصية',
      subscription: 'الاشتراك',
      manageSubscription: 'إدارة خطة اشتراكك',
      signOut: 'تسجيل الخروج',
      logoutFromAccount: 'تسجيل الخروج من حسابك',
      account: 'الحساب'
    },
    navigation: {
      dashboard: 'لوحة القيادة',
      analytics: 'التحليلات',
      performance: 'الأداء',
      portfolioAnalysis: 'تحليل المحفظة',
      watchlist: 'قائمة المراقبة',
      riskManagement: 'إدارة المخاطر',
      reports: 'التقارير',
      subscription: 'الاشتراك',
      settings: 'الإعدادات',
      adminPanel: 'لوحة الإدارة',
      adminDashboard: 'لوحة الإدارة',
      adminNotifications: 'الإشعارات'
    },
    portfolio: {
      exchange: 'البورصة',
      ticker: 'الرمز',
      shares: 'الأسهم',
      entry: 'الدخول',
      current: 'الحالي',
      cost: 'التكلفة',
      value: 'القيمة',
      pnl: 'الربح/الخسارة',
      stopLoss: 'وقف الخسارة',
      takeProfit: 'جني الأرباح',
      action: 'الإجراء',
      date: 'التاريخ',
      actions: 'الإجراءات',
      noStocks: 'لا توجد أسهم في هذه المحفظة',
      addStocksPrompt: 'أضف بعض الأسهم للبدء في إدارة المحفظة بالذكاء الاصطناعي',
      editStockDetails: 'تعديل تفاصيل السهم',
      deleteStock: 'حذف السهم'
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
    },
    portfolio: {
      exchange: 'בורסה',
      ticker: 'סימול',
      shares: 'מניות',
      entry: 'כניסה',
      current: 'נוכחי',
      cost: 'עלות',
      value: 'ערך',
      pnl: 'רווח/הפסד',
      stopLoss: 'סטופ לוס',
      takeProfit: 'טייק פרופיט',
      action: 'פעולה',
      date: 'תאריך',
      actions: 'פעולות',
      noStocks: 'אין מניות בתיק זה',
      addStocksPrompt: 'הוסף מניות כדי להתחיל בניהול תיק מבוסס בינה מלאכותית',
      editStockDetails: 'ערוך פרטי מניה',
      deleteStock: 'מחק מניה'
    }
  }
};

// Translation keys type
export type TranslationKeys = 
  | `common.${keyof typeof translations.en.common}`
  | `auth.${keyof typeof translations.en.auth}`
  | `dashboard.${keyof typeof translations.en.dashboard}`
  | `settings.${keyof typeof translations.en.settings}`
  | `navigation.${keyof typeof translations.en.navigation}`
  | `portfolio.${keyof typeof translations.en.portfolio}`;

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

  // Load locale from localStorage on mount
  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem('locale') as Locale;
      if (savedLocale && ['en', 'ar', 'he'].includes(savedLocale)) {
        setLocaleState(savedLocale);
      }
    } catch (error) {
      console.warn('Failed to load locale from localStorage:', error);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    try {
      setLocaleState(newLocale);
      localStorage.setItem('locale', newLocale);
    } catch (error) {
      console.error('Failed to save locale:', error);
    }
  };

  const t = (key: TranslationKeys, params?: Record<string, string>): string => {
    try {
      const keys = key.split('.');
      let text: any = translations[locale];

      for (const k of keys) {
        if (text && typeof text === 'object' && k in text) {
          text = text[k];
        } else {
          // Fallback to English
          text = translations.en;
          for (const fallbackKey of keys) {
            if (text && typeof text === 'object' && fallbackKey in text) {
              text = text[fallbackKey];
            } else {
              text = key;
              break;
            }
          }
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
    // Keep LTR direction for all languages to maintain English texture
    document.documentElement.setAttribute('dir', 'ltr');
    
    // Apply font class but preserve existing body classes (like theme classes)
    // Don't add RTL class to keep English layout
    const existingClasses = document.body.className.split(' ').filter(cls => 
      !cls.startsWith('lang-') && cls !== 'rtl'
    );
    const classes = [...existingClasses, fontClass];
    document.body.className = classes.join(' ');
  }, [locale, fontClass]);

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

