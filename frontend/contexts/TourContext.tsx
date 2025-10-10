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
    const seenTour = localStorage.getItem('aicapital-tour-seen');
    setHasSeenTour(seenTour === 'true');
  }, []);

  // Default tour steps
  const defaultSteps: TourStep[] = [
    {
      id: 'welcome',
      target: '.dashboard-welcome',
      title: t('tour.welcome.title'),
      content: t('tour.welcome.content'),
      position: 'center',
      highlight: true,
      skipable: false
    },
    {
      id: 'navigation',
      target: '.navigation-sidebar',
      title: t('tour.navigation.title'),
      content: t('tour.navigation.content'),
      position: 'right',
      action: 'hover',
      highlight: true
    },
    {
      id: 'portfolio-overview',
      target: '.portfolio-overview',
      title: t('tour.portfolioOverview.title'),
      content: t('tour.portfolioOverview.content'),
      position: 'bottom',
      highlight: true
    },
    {
      id: 'market-status',
      target: '.market-status-bar',
      title: t('tour.marketStatus.title'),
      content: t('tour.marketStatus.content'),
      position: 'bottom',
      highlight: true
    },
    {
      id: 'portfolio-table',
      target: '.portfolio-table',
      title: t('tour.portfolioTable.title'),
      content: t('tour.portfolioTable.content'),
      position: 'top',
      highlight: true
    },
    {
      id: 'analytics-button',
      target: '.analytics-nav-item',
      title: t('tour.analyticsButton.title'),
      content: t('tour.analyticsButton.content'),
      position: 'right',
      action: 'click',
      highlight: true
    },
    {
      id: 'premium-features',
      target: '.premium-features',
      title: t('tour.premiumFeatures.title'),
      content: t('tour.premiumFeatures.content'),
      position: 'left',
      highlight: true
    },
    {
      id: 'risk-management',
      target: '.risk-management-nav',
      title: t('tour.riskManagement.title'),
      content: t('tour.riskManagement.content'),
      position: 'right',
      action: 'click',
      highlight: true
    },
    {
      id: 'notifications',
      target: '.notification-center',
      title: t('tour.notifications.title'),
      content: t('tour.notifications.content'),
      position: 'left',
      highlight: true
    },
    {
      id: 'settings',
      target: '.settings-nav-item',
      title: t('tour.settings.title'),
      content: t('tour.settings.content'),
      position: 'right',
      highlight: true
    },
    {
      id: 'upgrade-cta',
      target: '.upgrade-banner',
      title: t('tour.upgradeCta.title'),
      content: t('tour.upgradeCta.content'),
      position: 'center',
      highlight: true,
      skipable: false
    }
  ];

  const startTour = () => {
    setStepsState(defaultSteps);
    setCurrentStep(0);
    setIsActive(true);
    // Add body class to prevent scrolling
    document.body.classList.add('tour-active');
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endTour();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    endTour();
  };

  const endTour = () => {
    setIsActive(false);
    setCurrentStep(0);
    setHasSeenTour(true);
    localStorage.setItem('aicapital-tour-seen', 'true');
    // Remove body class
    document.body.classList.remove('tour-active');
  };

  const setSteps = (newSteps: TourStep[]) => {
    setStepsState(newSteps);
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
