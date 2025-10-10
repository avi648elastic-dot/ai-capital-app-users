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
  highlight?: boolean;
  skipable?: boolean;
  delay?: number;
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
          title: 'Welcome to AI-Capital! 🚀',
          content: 'Let me show you around our powerful AI-driven portfolio management platform. This tour will highlight all the key features that can help you make smarter investment decisions.',
          position: 'center',
          highlight: true,
          skipable: false
        },
        {
          id: 'navigation',
          target: 'nav',
          title: 'Navigation Menu',
          content: 'Here you can access all the main features: Dashboard, Portfolios, Analytics, Risk Management, and more. Premium+ users get access to advanced features like Risk Management and Reports.',
          position: 'right',
          action: 'hover',
          highlight: true
        },
        {
          id: 'portfolio-overview',
          target: '.financial-metric',
          title: 'Portfolio Overview',
          content: 'This shows your total portfolio value, today\'s returns, and key performance metrics. Watch how these numbers update in real-time as markets move!',
          position: 'bottom',
          highlight: true
        },
        {
          id: 'market-status',
          target: '.bg-slate-900',
          title: 'Live Market Status',
          content: 'This bar shows real-time market status with your local time. The animated indicator shows market activity - green when open, gray when closed.',
          position: 'bottom',
          highlight: true
        },
        {
          id: 'portfolio-table',
          target: '.card',
          title: 'Your Portfolio Holdings',
          content: 'Here you can see all your stocks with AI-generated BUY/SELL/HOLD recommendations. Our algorithm analyzes 90 days of data to give you the best advice!',
          position: 'top',
          highlight: true
        },
        {
          id: 'upgrade-cta',
          target: 'body',
          title: 'Ready to Upgrade? 💎',
          content: 'You\'ve seen the power of AI-Capital! Upgrade to Premium+ to unlock advanced analytics, risk management tools, multi-portfolio support, and priority features. Start your journey to smarter investing today!',
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