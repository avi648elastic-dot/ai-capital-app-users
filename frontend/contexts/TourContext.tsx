'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLanguage } from './LanguageContext';

export interface TourStep {
  id: string;
  target: string;
  title: string;
  content: string;
  sectionDescription?: string; // NEW: Short description of which section this is
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'scroll';
  nextAction?: 'navigate' | 'wait' | 'continue';
  highlight?: boolean;
  skipable?: boolean;
  delay?: number;
  interactive?: boolean;
  feature?: string;
}

export interface TourContextType {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  endTour: () => void;
  setSteps: (steps: TourStep[]) => void;
  hasSeenTour: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

interface TourProviderProps {
  children: ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setStepsState] = useState<TourStep[]>([]);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const { t } = useLanguage();

  // Check if user has seen the tour before
  useEffect(() => {
    try {
      const seenTour = localStorage.getItem('aicapital-tour-seen');
      setHasSeenTour(seenTour === 'true');
    } catch (error) {
      console.warn('Failed to check tour status:', error);
      setHasSeenTour(false);
    }
  }, []);

  // Page-specific tour steps based on current URL
  const getPageSpecificSteps = (pathname: string): TourStep[] => {
    if (pathname === '/dashboard') {
      return getDashboardSteps();
    } else if (pathname === '/analytics/portfolio-analysis') {
      return getPortfolioAnalysisSteps();
    } else if (pathname === '/analytics/performance') {
      return getPerformanceSteps();
    } else if (pathname === '/watchlist') {
      return getWatchlistSteps();
    } else if (pathname === '/risk-management') {
      return getRiskManagementSteps();
    } else if (pathname === '/subscription') {
      return getSubscriptionSteps();
    } else {
      return getDefaultSteps();
    }
  };

  // Dashboard tour steps
  const getDashboardSteps = (): TourStep[] => {
    return [
      {
        id: 'dashboard-welcome',
        target: 'body',
        title: '🏠 Dashboard Overview',
        content: 'Welcome to your AI-Capital Dashboard! This is your command center where you can see your portfolio performance, add new investments, and get AI-powered recommendations.',
        sectionDescription: 'Main control panel for your entire investment portfolio',
        position: 'center',
        highlight: true,
        skipable: false
      },
      {
        id: 'portfolio-metrics',
        target: '.financial-metric',
        title: '💰 Portfolio Performance',
        content: 'These cards show your real-time portfolio metrics: Total Value, P&L, and Performance. These numbers update automatically as stock prices change throughout the day.',
        sectionDescription: 'Top-level financial metrics showing total value and returns',
        position: 'bottom',
        highlight: true
      },
      {
        id: 'add-stock-button',
        target: '.btn-primary',
        title: '➕ Add New Stock',
        content: 'Click here to add new stocks to your portfolio. Our intelligent form will help you set entry prices, stop-losses, and take-profit levels with AI recommendations.',
        sectionDescription: 'Action button to add new positions to your portfolio',
        position: 'top',
        highlight: true,
        action: 'click'
      },
      {
        id: 'portfolio-table',
        target: 'table',
        title: '📊 Your Holdings & AI Recommendations',
        content: 'This table shows all your stock holdings with AI-generated BUY/SELL/HOLD recommendations. Each recommendation is based on 90 days of market data analysis.',
        sectionDescription: 'Complete list of all your stock positions and AI signals',
        position: 'top',
        highlight: true
      },
      {
        id: 'navigation',
        target: 'nav',
        title: '🧭 Navigation Menu',
        content: 'Use this sidebar to navigate between different features: Analytics, Performance Analysis, Watchlist, Risk Management, and more.',
        sectionDescription: 'Sidebar navigation to access all features',
        position: 'right',
        highlight: true
      }
    ];
  };

  // Portfolio Analysis tour steps
  const getPortfolioAnalysisSteps = (): TourStep[] => {
    return [
      {
        id: 'portfolio-analysis-welcome',
        target: 'body',
        title: '📈 Portfolio Analysis Dashboard',
        content: 'This is your comprehensive portfolio analysis page! Here you can see detailed performance metrics, sector allocation, risk assessment, and AI-powered insights.',
        sectionDescription: 'Advanced portfolio analysis and performance tracking',
        position: 'center',
        highlight: true,
        skipable: false
      },
      {
        id: 'performance-metrics',
        target: '.card',
        title: '📊 Performance Metrics',
        content: 'These cards show key performance indicators: Total Return, Volatility, Sharpe Ratio, and Max Drawdown. All calculated using 90-day Google Finance data.',
        sectionDescription: 'Key performance indicators dashboard cards',
        position: 'bottom',
        highlight: true
      },
      {
        id: 'time-period-selector',
        target: 'select',
        title: '⏰ Time Period Analysis',
        content: 'Use this dropdown to analyze your portfolio performance over different time periods: 7 days, 30 days, 60 days, or 90 days.',
        sectionDescription: 'Time range selector for performance analysis',
        position: 'top',
        highlight: true
      },
      {
        id: 'individual-stocks',
        target: 'table',
        title: '📋 Individual Stock Performance',
        content: 'This table shows detailed performance for each stock in your portfolio, including returns, volatility, and AI recommendations based on recent market data.',
        sectionDescription: 'Detailed stock-by-stock performance breakdown',
        position: 'top',
        highlight: true
      },
      {
        id: 'refresh-data',
        target: 'button',
        title: '🔄 Refresh Data',
        content: 'Click this button to refresh all data and get the latest stock prices and AI recommendations.',
        sectionDescription: 'Data refresh and update button',
        position: 'top',
        highlight: true
      }
    ];
  };

  // Performance Analytics tour steps
  const getPerformanceSteps = (): TourStep[] => {
    return [
      {
        id: 'performance-welcome',
        target: 'body',
        title: '📊 Performance Analytics',
        content: 'Welcome to the Performance Analytics page! Here you can analyze your portfolio\'s historical performance with detailed charts and metrics.',
        position: 'center',
        highlight: true,
        skipable: false
      },
      {
        id: 'performance-chart',
        target: '.chart',
        title: '📈 Performance Chart',
        content: 'This interactive chart shows your portfolio value over time. You can hover over data points to see exact values and dates.',
        position: 'bottom',
        highlight: true
      },
      {
        id: 'performance-metrics',
        target: '.metric-card',
        title: '📊 Key Metrics',
        content: 'These cards display important performance metrics like total return, volatility, and risk-adjusted returns.',
        position: 'top',
        highlight: true
      }
    ];
  };

  // Watchlist tour steps
  const getWatchlistSteps = (): TourStep[] => {
    return [
      {
        id: 'watchlist-welcome',
        target: 'body',
        title: '👁️ Watchlist Manager',
        content: 'Your watchlist lets you track stocks you\'re interested in before adding them to your portfolio. Get real-time price alerts and AI recommendations.',
        position: 'center',
        highlight: true,
        skipable: false
      },
      {
        id: 'add-to-watchlist',
        target: '.add-watchlist-btn',
        title: '➕ Add to Watchlist',
        content: 'Click here to add new stocks to your watchlist. You\'ll get notifications when they reach your target prices.',
        position: 'top',
        highlight: true
      },
      {
        id: 'watchlist-table',
        target: 'table',
        title: '📋 Your Watchlist',
        content: 'This table shows all stocks you\'re watching, their current prices, target prices, and AI recommendations.',
        position: 'top',
        highlight: true
      }
    ];
  };

  // Risk Management tour steps
  const getRiskManagementSteps = (): TourStep[] => {
    return [
      {
        id: 'risk-welcome',
        target: 'body',
        title: '🛡️ Risk Management Center',
        content: 'This is your risk management dashboard where you can monitor portfolio risk, set stop-losses, and get risk alerts.',
        position: 'center',
        highlight: true,
        skipable: false
      },
      {
        id: 'risk-metrics',
        target: '.risk-card',
        title: '⚠️ Risk Metrics',
        content: 'These cards show your portfolio\'s risk metrics: Value at Risk (VaR), Maximum Drawdown, and Risk Score.',
        position: 'bottom',
        highlight: true
      },
      {
        id: 'risk-alerts',
        target: '.alert-panel',
        title: '🚨 Risk Alerts',
        content: 'This panel shows any active risk alerts for your portfolio. You\'ll be notified when stocks approach your risk thresholds.',
        position: 'top',
        highlight: true
      }
    ];
  };

  // Subscription tour steps
  const getSubscriptionSteps = (): TourStep[] => {
    return [
      {
        id: 'subscription-welcome',
        target: 'body',
        title: '💎 Subscription Plans',
        content: 'Here you can view and upgrade your subscription plan to unlock premium features like advanced analytics and AI recommendations.',
        position: 'center',
        highlight: true,
        skipable: false
      },
      {
        id: 'current-plan',
        target: '.current-plan',
        title: '📋 Your Current Plan',
        content: 'This shows your current subscription plan and its features. Premium plans include advanced AI analysis and priority support.',
        position: 'bottom',
        highlight: true
      },
      {
        id: 'upgrade-options',
        target: '.upgrade-card',
        title: '🚀 Upgrade Options',
        content: 'Click on any plan card to upgrade and unlock more features. Premium+ includes unlimited stocks and advanced risk management.',
        position: 'top',
        highlight: true
      }
    ];
  };

  // Default tour steps with error handling
  const getDefaultSteps = (): TourStep[] => {
    try {
      return [
        {
          id: 'welcome',
          target: 'body',
          title: '🚀 Welcome to AI-Capital - Your Personal Investment Assistant!',
          content: 'I\'m going to show you how to use our AI-powered platform to make smarter investment decisions. We\'ll explore real features, navigate between pages, and I\'ll teach you exactly how everything works!',
          position: 'center',
          highlight: true,
          skipable: false
        },
        {
          id: 'market-status',
          target: '.bg-slate-900',
          title: '📊 Live Market Intelligence',
          content: 'See this? This is your real-time market status bar! It shows if markets are open/closed, countdown timers, and your local time. The animated businessman shows market activity - walking when markets are active, sitting when closed. This updates every second!',
          position: 'bottom',
          highlight: true,
          action: 'click'
        },
        {
          id: 'portfolio-metrics',
          target: '.financial-metric',
          title: '💰 Your Investment Dashboard',
          content: 'These cards show your REAL portfolio performance! Initial Investment (what you put in), Current Value (what it\'s worth now), and P&L (profit/loss). These numbers update in real-time as stock prices change throughout the day!',
          position: 'bottom',
          highlight: true,
          action: 'hover'
        },
        {
          id: 'add-stock-button',
          target: '.btn-primary',
          title: '➕ Add New Investments',
          content: 'This "Add Stock" button lets you add new investments to your portfolio. Click it to see our intelligent stock form that helps you set stop-losses, take-profit levels, and get AI recommendations!',
          position: 'top',
          highlight: true,
          action: 'click'
        },
        {
          id: 'portfolio-table',
          target: '.card table',
          title: '📈 Your Stock Holdings & AI Recommendations',
          content: 'This table shows ALL your stocks with AI-generated BUY/SELL/HOLD recommendations! Each row shows: Ticker, Shares, Entry Price, Current Price, P&L, and our AI\'s recommendation. The algorithm analyzes 90 days of data to give you the best advice!',
          position: 'top',
          highlight: true,
          action: 'scroll'
        },
        {
          id: 'navigation-sidebar',
          target: 'nav',
          title: '🧭 Navigate to Advanced Features',
          content: 'This sidebar is your control center! Let\'s explore what each section does: Dashboard (where we are), Analytics (detailed performance charts), Risk Management (for Premium+ users), and more. Click any item to navigate there!',
          position: 'right',
          highlight: true,
          action: 'click'
        },
        {
          id: 'analytics-preview',
          target: 'nav a[href*="analytics"]',
          title: '📊 Let\'s Explore Analytics!',
          content: 'Ready to see advanced analytics? Click "Analytics" in the sidebar to see detailed performance charts, volatility analysis, and risk metrics. This is where the real magic happens!',
          position: 'right',
          highlight: true,
          action: 'click',
          nextAction: 'navigate'
        },
        {
          id: 'settings-access',
          target: 'nav a[href*="settings"], button[onClick*="settings"]',
          title: '⚙️ Customize Your Experience',
          content: 'Click "Settings" to customize your experience! You can change themes (light/dark), languages (English/Hebrew/Arabic), notifications, and more. Make the platform truly yours!',
          position: 'right',
          highlight: true,
          action: 'click',
          nextAction: 'navigate'
        },
        {
          id: 'premium-features',
          target: '.premium-badge, .crown, [class*="premium"]',
          title: '👑 Premium Features Available',
          content: 'See those crown icons? Those are Premium+ features! Risk Management, Advanced Reports, Multi-Portfolio support, and priority AI recommendations. Upgrade to unlock the full power of AI-Capital!',
          position: 'center',
          highlight: true,
          action: 'hover'
        },
        {
          id: 'tour-completion',
          target: 'body',
          title: '🎉 You\'re Ready to Invest Smart!',
          content: 'Congratulations! You now know how to use AI-Capital like a pro. Add stocks, monitor performance, use AI recommendations, and explore advanced features. Remember: this platform updates in real-time, so check back regularly for new investment opportunities!',
          position: 'center',
          highlight: true,
          skipable: false
        }
      ];
    } catch (error) {
      console.warn('Failed to create tour steps:', error);
      return [];
    }
  };

  const startTour = () => {
    try {
      // Get page-specific tour steps based on current URL
      const currentPath = window.location.pathname;
      const pageSpecificSteps = getPageSpecificSteps(currentPath);
      
      setStepsState(pageSpecificSteps);
      setCurrentStep(0);
      setIsActive(true);
      // Add body class to prevent scrolling
      document.body.classList.add('tour-active');
    } catch (error) {
      console.error('Failed to start tour:', error);
    }
  };

  const nextStep = () => {
    try {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        endTour();
      }
    } catch (error) {
      console.error('Failed to go to next step:', error);
      endTour();
    }
  };

  const previousStep = () => {
    try {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    } catch (error) {
      console.error('Failed to go to previous step:', error);
    }
  };

  const skipTour = () => {
    try {
      endTour();
    } catch (error) {
      console.error('Failed to skip tour:', error);
      endTour();
    }
  };

  const endTour = () => {
    try {
      setIsActive(false);
      setCurrentStep(0);
      setHasSeenTour(true);
      localStorage.setItem('aicapital-tour-seen', 'true');
      // Remove body class
      document.body.classList.remove('tour-active');
    } catch (error) {
      console.error('Failed to end tour:', error);
      setIsActive(false);
    }
  };

  const setSteps = (newSteps: TourStep[]) => {
    try {
      setStepsState(newSteps);
    } catch (error) {
      console.error('Failed to set tour steps:', error);
    }
  };

  const contextValue: TourContextType = {
    isActive,
    currentStep,
    steps,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    endTour,
    setSteps,
    hasSeenTour
  };

  return (
    <TourContext.Provider value={contextValue}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour(): TourContextType {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}