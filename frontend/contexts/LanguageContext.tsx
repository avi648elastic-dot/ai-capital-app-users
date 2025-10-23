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
    },
    landing: {
      hero: {
        title: 'The Future of Investment',
        subtitle: 'AI-powered portfolio management, real-time analytics, and expert strategies in one comprehensive platform',
        startJourney: 'Start Your Journey',
        viewDemo: 'View Demo'
      },
      features: {
        title: 'Why Choose AiCapital?',
        subtitle: 'We combine cutting-edge AI technology with proven investment strategies to give you an edge in the market',
        aiPortfolio: {
          title: 'AI-Powered Portfolio Management',
          description: 'Advanced artificial intelligence analyzes market trends and builds optimized portfolios automatically'
        },
        watchlist: {
          title: 'Real-Time Watchlist & Tracking',
          description: 'Monitor your favorite stocks with instant price alerts and market updates'
        },
        analytics: {
          title: 'Advanced Analytics Dashboard',
          description: 'Comprehensive analytics with performance metrics, risk analysis, and market insights'
        },
        expert: {
          title: 'Expert Portfolio Strategies',
          description: 'Access proven investment strategies from financial experts and AI algorithms'
        },
        notifications: {
          title: 'Smart Notifications & Alerts',
          description: 'Never miss important market movements with intelligent price and news alerts'
        },
        risk: {
          title: 'Risk Management Tools',
          description: 'Advanced risk assessment and portfolio protection features'
        }
      },
      analytics: {
        title: 'Comprehensive Analytics Suite',
        subtitle: 'Deep insights and analysis tools that go beyond basic charts and reports',
        performance: 'Performance Analytics',
        portfolio: 'Portfolio Analysis',
        watchlist: 'Watchlist Management',
        risk: 'Risk Management',
        reports: 'Market Reports',
        transactions: 'Transaction History'
      },
      competitive: {
        title: 'Why We\'re Different',
        subtitle: 'While competitors show basic charts and reports, we provide comprehensive AI-powered investment intelligence',
        ai: {
          title: 'AI-Powered Intelligence',
          description: 'Unlike competitors who rely on basic charts, we use advanced AI to analyze market patterns and optimize your investments'
        },
        analytics: {
          title: 'Comprehensive Analytics',
          description: 'Most platforms show basic reports. We provide deep analytics, risk management, and actionable insights'
        },
        expert: {
          title: 'Expert Strategies',
          description: 'Access proven investment strategies from financial experts, not just generic recommendations'
        },
        realtime: {
          title: 'Real-Time Everything',
          description: 'Live price tracking, instant alerts, and real-time portfolio updates - not delayed or limited data'
        }
      },
      pricing: {
        title: 'Choose Your Plan',
        subtitle: 'Start free and upgrade as you grow. All plans include core features with additional benefits at higher tiers',
        free: 'Free',
        premium: 'Premium',
        premiumPlus: 'Premium+',
        forever: 'forever',
        month: 'month',
        getStarted: 'Get Started Free',
        upgradeNow: 'Upgrade Now',
        mostPopular: 'Most Popular'
      },
      cta: {
        title: 'Ready to Transform Your Investing?',
        subtitle: 'Join thousands of investors who are already using AI to optimize their portfolios and maximize returns',
        startFree: 'Start Free',
        viewDemo: 'View Demo'
      },
      footer: {
        features: 'Features',
        support: 'Support',
        legal: 'Legal',
        portfolioManagement: 'Portfolio Management',
        analyticsDashboard: 'Analytics Dashboard',
        watchlistTracking: 'Watchlist Tracking',
        expertStrategies: 'Expert Strategies',
        helpCenter: 'Help Center',
        contactUs: 'Contact Us',
        pricing: 'Pricing',
        demo: 'Demo',
        privacyPolicy: 'Privacy Policy',
        termsOfService: 'Terms of Service',
        cookiePolicy: 'Cookie Policy',
        about: 'About',
        copyright: 'All rights reserved.'
      }
    },
    about: {
      title: 'About AI-Capital',
      subtitle: 'Professional portfolio management powered by artificial intelligence and real-time market data.',
      missionTitle: 'Our Mission',
      missionText: 'We believe that sophisticated portfolio management tools should be accessible to everyone, not just institutional investors. AI-Capital combines cutting-edge artificial intelligence with real-time market data to help you make smarter investment decisions.',
      realtimeTitle: 'Real-Time Analytics',
      realtimeDesc: 'Access professional-grade analytics with 7/30/60/90-day performance metrics, volatility analysis, and Sharpe ratios calculated from live market data.',
      aiTitle: 'AI-Powered Decisions',
      aiDesc: 'Our decision engine analyzes 90 days of historical data, market trends, and volatility to provide actionable BUY/HOLD/SELL recommendations for every stock.',
      riskTitle: 'Risk Management',
      riskDesc: 'Automatic stop-loss and take-profit tracking, portfolio volatility monitoring, and risk-adjusted returns help you protect your investments.',
      alertsTitle: 'Price Alerts',
      alertsDesc: 'Set custom price alerts on your watchlist and get instant notifications when stocks hit your target prices - never miss an opportunity.',
      techTitle: 'Built with Cutting-Edge Technology',
      apiKeys: '12 API Keys',
      apiKeysDesc: 'Multi-provider system with automatic failover ensures 99.9% uptime',
      realtimeData: 'Real-Time Data',
      realtimeDataDesc: 'Live price updates every 30 seconds from Alpha Vantage, Finnhub, and FMP',
      smartCaching: 'Smart Caching',
      smartCachingDesc: '10-minute LRU cache reduces API calls and delivers lightning-fast responses',
      ctaTitle: 'Ready to Get Started?',
      ctaSubtitle: 'Join thousands of investors making smarter decisions with AI-Capital',
      startFree: 'Start Free Today',
      getStarted: 'Get Started'
    },
    demo: {
      title: 'Interactive Demo',
      subtitle: 'Experience the power of AI-Capital with live demonstrations',
      backToHome: 'Back to Home',
      tryItNow: 'Try It Now',
      signUp: 'Sign Up Free'
    },
    pricing: {
      title: 'Simple, Transparent Pricing',
      subtitle: 'Choose the plan that works best for you',
      monthly: 'Monthly',
      yearly: 'Yearly',
      save25: 'Save 25%',
      perMonth: '/month',
      perYear: '/year',
      billedMonthly: 'Billed monthly',
      billedYearly: 'Billed yearly',
      choosePlan: 'Choose Plan',
      currentPlan: 'Current Plan',
      features: 'Features',
      allFeaturesInclude: 'All plans include',
      support: '24/7 Support',
      updates: 'Regular updates',
      security: 'Bank-level security'
    },
    onboarding: {
      step: 'Step',
      of: 'of',
      loading: 'Loading onboarding...',
      welcome: 'Welcome to AI-Capital',
      letsGetStarted: "Let's get you started with intelligent portfolio management"
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
    },
    landing: {
      hero: {
        title: 'مستقبل الاستثمار',
        subtitle: 'إدارة المحافظ المدعومة بالذكاء الاصطناعي، والتحليلات في الوقت الفعلي، والاستراتيجيات المتخصصة في منصة شاملة واحدة',
        startJourney: 'ابدأ رحلتك',
        viewDemo: 'عرض العرض التوضيحي'
      },
      features: {
        title: 'لماذا تختار AiCapital؟',
        subtitle: 'نحن نجمع بين تكنولوجيا الذكاء الاصطناعي المتطورة واستراتيجيات الاستثمار المجربة لمنحك ميزة في السوق',
        aiPortfolio: {
          title: 'إدارة المحافظ المدعومة بالذكاء الاصطناعي',
          description: 'الذكاء الاصطناعي المتقدم يحلل اتجاهات السوق ويبني محافظ محسنة تلقائياً'
        },
        watchlist: {
          title: 'قائمة المراقبة والتتبع في الوقت الفعلي',
          description: 'راقب أسهمك المفضلة مع تنبيهات الأسعار الفورية وتحديثات السوق'
        },
        analytics: {
          title: 'لوحة التحليلات المتقدمة',
          description: 'تحليلات شاملة مع مقاييس الأداء وتحليل المخاطر ورؤى السوق'
        },
        expert: {
          title: 'استراتيجيات المحافظ المتخصصة',
          description: 'الوصول إلى استراتيجيات الاستثمار المجربة من الخبراء الماليين وخوارزميات الذكاء الاصطناعي'
        },
        notifications: {
          title: 'التنبيهات والتنبيهات الذكية',
          description: 'لا تفوت حركات السوق المهمة مع تنبيهات الأسعار والأخبار الذكية'
        },
        risk: {
          title: 'أدوات إدارة المخاطر',
          description: 'تقييم المخاطر المتقدم وميزات حماية المحفظة'
        }
      },
      analytics: {
        title: 'مجموعة التحليلات الشاملة',
        subtitle: 'رؤى عميقة وأدوات تحليل تتجاوز المخططات والتقارير الأساسية',
        performance: 'تحليلات الأداء',
        portfolio: 'تحليل المحفظة',
        watchlist: 'إدارة قائمة المراقبة',
        risk: 'إدارة المخاطر',
        reports: 'تقارير السوق',
        transactions: 'تاريخ المعاملات'
      },
      competitive: {
        title: 'لماذا نحن مختلفون',
        subtitle: 'بينما يظهر المنافسون مخططات وتقارير أساسية، نحن نقدم ذكاء استثماري شامل مدعوم بالذكاء الاصطناعي',
        ai: {
          title: 'الذكاء المدعوم بالذكاء الاصطناعي',
          description: 'على عكس المنافسين الذين يعتمدون على المخططات الأساسية، نحن نستخدم الذكاء الاصطناعي المتقدم لتحليل أنماط السوق وتحسين استثماراتك'
        },
        analytics: {
          title: 'التحليلات الشاملة',
          description: 'معظم المنصات تظهر تقارير أساسية. نحن نقدم تحليلات عميقة وإدارة مخاطر ورؤى قابلة للتنفيذ'
        },
        expert: {
          title: 'الاستراتيجيات المتخصصة',
          description: 'الوصول إلى استراتيجيات الاستثمار المجربة من الخبراء الماليين، وليس مجرد توصيات عامة'
        },
        realtime: {
          title: 'كل شيء في الوقت الفعلي',
          description: 'تتبع الأسعار المباشر والتنبيهات الفورية وتحديثات المحفظة في الوقت الفعلي - وليس بيانات متأخرة أو محدودة'
        }
      },
      pricing: {
        title: 'اختر خطتك',
        subtitle: 'ابدأ مجاناً وارتقِ مع نموك. جميع الخطط تشمل الميزات الأساسية مع فوائد إضافية في المستويات الأعلى',
        free: 'مجاني',
        premium: 'متميز',
        premiumPlus: 'متميز+',
        forever: 'للأبد',
        month: 'شهر',
        getStarted: 'ابدأ مجاناً',
        upgradeNow: 'ارتق الآن',
        mostPopular: 'الأكثر شعبية'
      },
      cta: {
        title: 'مستعد لتحويل استثماراتك؟',
        subtitle: 'انضم إلى آلاف المستثمرين الذين يستخدمون بالفعل الذكاء الاصطناعي لتحسين محافظهم وتعظيم العوائد',
        startFree: 'ابدأ مجاناً',
        viewDemo: 'عرض العرض التوضيحي'
      },
      footer: {
        features: 'الميزات',
        support: 'الدعم',
        legal: 'قانوني',
        portfolioManagement: 'إدارة المحافظ',
        analyticsDashboard: 'لوحة التحليلات',
        watchlistTracking: 'تتبع قائمة المراقبة',
        expertStrategies: 'الاستراتيجيات المتخصصة',
        helpCenter: 'مركز المساعدة',
        contactUs: 'اتصل بنا',
        pricing: 'التسعير',
        demo: 'العرض التوضيحي',
        privacyPolicy: 'سياسة الخصوصية',
        termsOfService: 'شروط الخدمة',
        cookiePolicy: 'سياسة ملفات تعريف الارتباط',
        about: 'حول',
        copyright: 'جميع الحقوق محفوظة.'
      }
    },
    about: {
      title: 'حول AI-Capital',
      subtitle: 'إدارة المحافظ المهنية المدعومة بالذكاء الاصطناعي وبيانات السوق في الوقت الفعلي.',
      missionTitle: 'مهمتنا',
      missionText: 'نحن نؤمن بأن أدوات إدارة المحافظ المتطورة يجب أن تكون متاحة للجميع، وليس فقط للمستثمرين المؤسسيين. يجمع AI-Capital بين الذكاء الاصطناعي المتطور وبيانات السوق في الوقت الفعلي لمساعدتك على اتخاذ قرارات استثمارية أكثر ذكاءً.',
      realtimeTitle: 'التحليلات في الوقت الفعلي',
      realtimeDesc: 'الوصول إلى التحليلات ذات المستوى المهني مع مقاييس الأداء لمدة 7/30/60/90 يومًا، وتحليل التقلبات، ونسب شارب المحسوبة من بيانات السوق المباشرة.',
      aiTitle: 'القرارات المدعومة بالذكاء الاصطناعي',
      aiDesc: 'يقوم محرك القرار لدينا بتحليل 90 يومًا من البيانات التاريخية واتجاهات السوق والتقلبات لتقديم توصيات قابلة للتنفيذ للشراء/الاحتفاظ/البيع لكل سهم.',
      riskTitle: 'إدارة المخاطر',
      riskDesc: 'تتبع تلقائي لوقف الخسارة وجني الأرباح، ومراقبة تقلبات المحفظة، والعوائد المعدلة حسب المخاطر لمساعدتك على حماية استثماراتك.',
      alertsTitle: 'تنبيهات الأسعار',
      alertsDesc: 'قم بتعيين تنبيهات أسعار مخصصة على قائمة المراقبة الخاصة بك واحصل على إشعارات فورية عندما تصل الأسهم إلى أسعارك المستهدفة - لا تفوت أي فرصة.',
      techTitle: 'مبني بتكنولوجيا متطورة',
      apiKeys: '12 مفتاح API',
      apiKeysDesc: 'نظام متعدد المزودين مع التبديل التلقائي يضمن 99.9٪ من وقت التشغيل',
      realtimeData: 'بيانات في الوقت الفعلي',
      realtimeDataDesc: 'تحديثات الأسعار المباشرة كل 30 ثانية من Alpha Vantage و Finnhub و FMP',
      smartCaching: 'التخزين المؤقت الذكي',
      smartCachingDesc: 'ذاكرة التخزين المؤقت LRU لمدة 10 دقائق تقلل من مكالمات API وتقدم استجابات سريعة للغاية',
      ctaTitle: 'مستعد للبدء؟',
      ctaSubtitle: 'انضم إلى آلاف المستثمرين الذين يتخذون قرارات أكثر ذكاءً مع AI-Capital',
      startFree: 'ابدأ مجانًا اليوم',
      getStarted: 'ابدأ'
    },
    demo: {
      title: 'عرض تفاعلي',
      subtitle: 'اختبر قوة AI-Capital مع عروض مباشرة',
      backToHome: 'العودة للرئيسية',
      tryItNow: 'جربه الآن',
      signUp: 'سجل مجانًا'
    },
    pricing: {
      title: 'تسعير بسيط وشفاف',
      subtitle: 'اختر الخطة الأنسب لك',
      monthly: 'شهري',
      yearly: 'سنوي',
      save25: 'وفر 25٪',
      perMonth: '/شهر',
      perYear: '/سنة',
      billedMonthly: 'يتم الدفع شهريًا',
      billedYearly: 'يتم الدفع سنويًا',
      choosePlan: 'اختر الخطة',
      currentPlan: 'الخطة الحالية',
      features: 'الميزات',
      allFeaturesInclude: 'تشمل جميع الخطط',
      support: 'دعم 24/7',
      updates: 'تحديثات منتظمة',
      security: 'أمان على مستوى البنوك'
    },
    onboarding: {
      step: 'خطوة',
      of: 'من',
      loading: 'جار تحميل الإعداد...',
      welcome: 'مرحبًا بك في AI-Capital',
      letsGetStarted: 'لنبدأ معًا في إدارة المحفظة الذكية'
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
    },
    landing: {
      hero: {
        title: 'עתיד ההשקעות',
        subtitle: 'ניהול תיקים מבוסס בינה מלאכותית, אנליטיקה בזמן אמת ואסטרטגיות מומחים בפלטפורמה מקיפה אחת',
        startJourney: 'התחל את המסע שלך',
        viewDemo: 'צפה בהדגמה'
      },
      features: {
        title: 'למה לבחור ב-AiCapital?',
        subtitle: 'אנחנו משלבים טכנולוגיית בינה מלאכותית מתקדמת עם אסטרטגיות השקעה מוכחות כדי לתת לך יתרון בשוק',
        aiPortfolio: {
          title: 'ניהול תיקים מבוסס בינה מלאכותית',
          description: 'בינה מלאכותית מתקדמת מנתחת מגמות שוק ובונה תיקים מותאמים אוטומטית'
        },
        watchlist: {
          title: 'רשימת מעקב ומעקב בזמן אמת',
          description: 'עקוב אחר המניות האהובות עליך עם התראות מחירים מיידיות ועדכוני שוק'
        },
        analytics: {
          title: 'לוח אנליטיקה מתקדם',
          description: 'אנליטיקה מקיפה עם מדדי ביצועים, ניתוח סיכונים ותובנות שוק'
        },
        expert: {
          title: 'אסטרטגיות תיק מומחים',
          description: 'גישה לאסטרטגיות השקעה מוכחות ממומחים פיננסיים ואלגוריתמי בינה מלאכותית'
        },
        notifications: {
          title: 'התראות והתראות חכמות',
          description: 'אל תפספס תנועות שוק חשובות עם התראות מחירים וחדשות חכמות'
        },
        risk: {
          title: 'כלי ניהול סיכונים',
          description: 'הערכת סיכונים מתקדמת ותכונות הגנה על התיק'
        }
      },
      analytics: {
        title: 'חבילת אנליטיקה מקיפה',
        subtitle: 'תובנות עמוקות וכלי ניתוח שמעבר לתרשימים ודוחות בסיסיים',
        performance: 'אנליטיקת ביצועים',
        portfolio: 'ניתוח תיק',
        watchlist: 'ניהול רשימת מעקב',
        risk: 'ניהול סיכונים',
        reports: 'דוחות שוק',
        transactions: 'היסטוריית עסקאות'
      },
      competitive: {
        title: 'למה אנחנו שונים',
        subtitle: 'בעוד המתחרים מציגים תרשימים ודוחות בסיסיים, אנחנו מספקים מודיעין השקעות מקיף מבוסס בינה מלאכותית',
        ai: {
          title: 'בינה מלאכותית מתקדמת',
          description: 'בניגוד למתחרים שמסתמכים על תרשימים בסיסיים, אנחנו משתמשים בבינה מלאכותית מתקדמת לניתוח דפוסי שוק ואופטימיזציה של השקעותיך'
        },
        analytics: {
          title: 'אנליטיקה מקיפה',
          description: 'רוב הפלטפורמות מציגות דוחות בסיסיים. אנחנו מספקים אנליטיקה עמוקה, ניהול סיכונים ותובנות ברורות'
        },
        expert: {
          title: 'אסטרטגיות מומחים',
          description: 'גישה לאסטרטגיות השקעה מוכחות ממומחים פיננסיים, לא רק המלצות כלליות'
        },
        realtime: {
          title: 'הכל בזמן אמת',
          description: 'מעקב מחירים חי, התראות מיידיות ועדכוני תיק בזמן אמת - לא נתונים מושהים או מוגבלים'
        }
      },
      pricing: {
        title: 'בחר את התוכנית שלך',
        subtitle: 'התחל בחינם ושדרג ככל שאתה גדל. כל התוכניות כוללות תכונות ליבה עם יתרונות נוספים ברמות הגבוהות יותר',
        free: 'חינם',
        premium: 'פרימיום',
        premiumPlus: 'פרימיום+',
        forever: 'לנצח',
        month: 'חודש',
        getStarted: 'התחל בחינם',
        upgradeNow: 'שדרג עכשיו',
        mostPopular: 'הכי פופולרי'
      },
      cta: {
        title: 'מוכן לשנות את ההשקעות שלך?',
        subtitle: 'הצטרף לאלפי משקיעים שכבר משתמשים בבינה מלאכותית לאופטימיזציה של התיקים שלהם ומקסום התשואות',
        startFree: 'התחל בחינם',
        viewDemo: 'צפה בהדגמה'
      },
      footer: {
        features: 'תכונות',
        support: 'תמיכה',
        legal: 'משפטי',
        portfolioManagement: 'ניהול תיקים',
        analyticsDashboard: 'לוח אנליטיקה',
        watchlistTracking: 'מעקב רשימת מעקב',
        expertStrategies: 'אסטרטגיות מומחים',
        helpCenter: 'מרכז עזרה',
        contactUs: 'צור קשר',
        pricing: 'תמחור',
        demo: 'הדגמה',
        privacyPolicy: 'מדיניות פרטיות',
        termsOfService: 'תנאי שירות',
        cookiePolicy: 'מדיניות עוגיות',
        about: 'אודות',
        copyright: 'כל הזכויות שמורות.'
      }
    },
    about: {
      title: 'אודות AI-Capital',
      subtitle: 'ניהול תיקים מקצועי המופעל על ידי בינה מלאכותית ונתוני שוק בזמן אמת.',
      missionTitle: 'המשימה שלנו',
      missionText: 'אנחנו מאמינים שכלי ניהול תיקים מתוחכמים צריכים להיות נגישים לכולם, לא רק למשקיעים מוסדיים. AI-Capital משלב בינה מלאכותית מתקדמת עם נתוני שוק בזמן אמת כדי לעזור לך לקבל החלטות השקעה חכמות יותר.',
      realtimeTitle: 'אנליטיקה בזמן אמת',
      realtimeDesc: 'גישה לאנליטיקה ברמה מקצועית עם מדדי ביצועים של 7/30/60/90 ימים, ניתוח תנודתיות ויחסי שארפ המחושבים מנתוני שוק חיים.',
      aiTitle: 'החלטות מבוססות בינה מלאכותית',
      aiDesc: 'מנוע ההחלטות שלנו מנתח 90 ימים של נתונים היסטוריים, מגמות שוק ותנודתיות כדי לספק המלצות פעולה לקנייה/החזקה/מכירה עבור כל מניה.',
      riskTitle: 'ניהול סיכונים',
      riskDesc: 'מעקב אוטומטי אחר סטופ-לוס וטייק-פרופיט, ניטור תנודתיות תיק ותשואות מותאמות סיכון עוזרים לך להגן על ההשקעות שלך.',
      alertsTitle: 'התראות מחירים',
      alertsDesc: 'הגדר התראות מחירים מותאמות אישית ברשימת המעקב שלך וקבל התראות מיידיות כאשר מניות מגיעות למחירי היעד שלך - לעולם אל תפספס הזדמנות.',
      techTitle: 'נבנה עם טכנולוגיה מתקדמת',
      apiKeys: '12 מפתחות API',
      apiKeysDesc: 'מערכת רב-ספקים עם כשל אוטומטי מבטיחה זמינות של 99.9%',
      realtimeData: 'נתונים בזמן אמת',
      realtimeDataDesc: 'עדכוני מחירים חיים כל 30 שניות מ-Alpha Vantage, Finnhub ו-FMP',
      smartCaching: 'מטמון חכם',
      smartCachingDesc: 'מטמון LRU של 10 דקות מפחית קריאות API ומספק תגובות מהירות במיוחד',
      ctaTitle: 'מוכן להתחיל?',
      ctaSubtitle: 'הצטרף לאלפי משקיעים המקבלים החלטות חכמות יותר עם AI-Capital',
      startFree: 'התחל בחינם היום',
      getStarted: 'התחל'
    },
    demo: {
      title: 'הדגמה אינטראקטיבית',
      subtitle: 'חווה את העוצמה של AI-Capital עם הדגמות חיות',
      backToHome: 'חזרה לדף הבית',
      tryItNow: 'נסה עכשיו',
      signUp: 'הירשם בחינם'
    },
    pricing: {
      title: 'תמחור פשוט ושקוף',
      subtitle: 'בחר את התוכנית שמתאימה לך',
      monthly: 'חודשי',
      yearly: 'שנתי',
      save25: 'חסוך 25%',
      perMonth: '/חודש',
      perYear: '/שנה',
      billedMonthly: 'חיוב חודשי',
      billedYearly: 'חיוב שנתי',
      choosePlan: 'בחר תוכנית',
      currentPlan: 'תוכנית נוכחית',
      features: 'תכונות',
      allFeaturesInclude: 'כל התוכניות כוללות',
      support: 'תמיכה 24/7',
      updates: 'עדכונים קבועים',
      security: 'אבטחה ברמת בנק'
    },
    onboarding: {
      step: 'שלב',
      of: 'מתוך',
      loading: 'טוען התחלה...',
      welcome: 'ברוך הבא ל-AI-Capital',
      letsGetStarted: 'בואו נתחיל עם ניהול תיק השקעות חכם'
    }
  }
};

// Translation keys type - using string to support nested objects
export type TranslationKeys = string;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
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

  const t = (key: string, params?: Record<string, string>): string => {
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

