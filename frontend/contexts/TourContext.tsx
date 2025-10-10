'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLanguage } from './LanguageContext';

export interface TourStep {
  id: string;
  target: string;
  title: string;
  content: string;
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
      const defaultSteps = getDefaultSteps();
      setStepsState(defaultSteps);
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