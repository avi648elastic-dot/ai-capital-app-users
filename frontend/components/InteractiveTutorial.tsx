'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ArrowLeft
} from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'swipe' | 'type' | 'wait';
  actionText?: string;
  skipable?: boolean;
  required?: boolean;
}

interface InteractiveTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  tutorialId: string;
}

export default function InteractiveTutorial({ 
  isOpen, 
  onClose, 
  onComplete, 
  tutorialId 
}: InteractiveTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Tutorial definitions
  const tutorials: Record<string, TutorialStep[]> = {
    'dashboard-intro': [
      {
        id: 'welcome',
        title: 'Welcome to AiCapital!',
        description: 'Let\'s take a quick tour of your investment dashboard. This will help you get started with managing your portfolio.',
        target: 'body',
        position: 'center',
        actionText: 'Let\'s begin!',
        required: true
      },
      {
        id: 'portfolio-summary',
        title: 'Portfolio Summary',
        description: 'Here you can see your total portfolio value, profit/loss, and key metrics at a glance.',
        target: '[data-tutorial="portfolio-summary"]',
        position: 'bottom',
        action: 'click',
        actionText: 'Click to view details'
      },
      {
        id: 'add-stock',
        title: 'Add New Stock',
        description: 'Click this button to add a new stock to your portfolio. You can track your investments and set stop-loss/take-profit levels.',
        target: '[data-tutorial="add-stock"]',
        position: 'bottom',
        action: 'click',
        actionText: 'Try adding a stock'
      },
      {
        id: 'portfolio-table',
        title: 'Your Portfolio',
        description: 'This table shows all your current stock positions. You can view, edit, or remove stocks from here.',
        target: '[data-tutorial="portfolio-table"]',
        position: 'top',
        action: 'swipe',
        actionText: 'Swipe left on any stock card to see actions'
      },
      {
        id: 'analytics',
        title: 'Analytics & Reports',
        description: 'Access detailed analytics, performance charts, and risk management tools from the navigation menu.',
        target: '[data-tutorial="analytics"]',
        position: 'bottom',
        action: 'click',
        actionText: 'Explore analytics'
      },
      {
        id: 'expert-portfolio',
        title: 'Expert Portfolio',
        description: 'Learn from our expert trader\'s strategies and see their real-time portfolio performance.',
        target: '[data-tutorial="expert-portfolio"]',
        position: 'bottom',
        action: 'click',
        actionText: 'View expert strategies'
      }
    ],
    'mobile-navigation': [
      {
        id: 'mobile-menu',
        title: 'Mobile Navigation',
        description: 'Tap the menu button to access all features. You can also swipe right from the left edge to open the menu.',
        target: '[data-tutorial="mobile-menu"]',
        position: 'bottom',
        action: 'click',
        actionText: 'Open menu'
      },
      {
        id: 'swipe-gestures',
        title: 'Swipe Gestures',
        description: 'On mobile, you can swipe left on portfolio cards to reveal quick actions like edit, view, or delete.',
        target: '[data-tutorial="portfolio-card"]',
        position: 'center',
        action: 'swipe',
        actionText: 'Swipe left on any card'
      },
      {
        id: 'pull-refresh',
        title: 'Pull to Refresh',
        description: 'Pull down from the top to refresh your portfolio data and get the latest prices.',
        target: 'body',
        position: 'top',
        action: 'swipe',
        actionText: 'Pull down to refresh'
      }
    ],
    'portfolio-management': [
      {
        id: 'add-stock-detail',
        title: 'Adding a Stock',
        description: 'When adding a stock, you can set stop-loss and take-profit levels to manage risk automatically.',
        target: '[data-tutorial="stock-form"]',
        position: 'top',
        action: 'type',
        actionText: 'Fill in stock details'
      },
      {
        id: 'risk-management',
        title: 'Risk Management',
        description: 'Always set stop-loss levels to protect your investments. This helps limit potential losses.',
        target: '[data-tutorial="stop-loss"]',
        position: 'right',
        action: 'click',
        actionText: 'Set stop-loss level'
      },
      {
        id: 'portfolio-diversification',
        title: 'Portfolio Diversification',
        description: 'Spread your investments across different sectors and asset types to reduce risk.',
        target: '[data-tutorial="portfolio-analysis"]',
        position: 'bottom',
        action: 'click',
        actionText: 'Analyze your portfolio'
      }
    ]
  };

  const steps = tutorials[tutorialId] || [];
  const currentStepData = steps[currentStep];

  // Highlight target element
  useEffect(() => {
    if (!isOpen || !currentStepData?.target) return;

    const element = document.querySelector(currentStepData.target) as HTMLElement;
    if (element) {
      setHighlightedElement(element);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return () => {
      setHighlightedElement(null);
    };
  }, [isOpen, currentStep, currentStepData]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || !isOpen) return;

    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setIsPlaying(false);
        onComplete();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, steps.length, onComplete, isOpen]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skipTutorial = () => {
    onClose();
  };

  const resetTutorial = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (!isOpen || !currentStepData) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={currentStepData.skipable ? onClose : undefined}
      />

      {/* Highlighted Element Overlay */}
      {highlightedElement && (
        <div
          className="fixed z-40 pointer-events-none"
          style={{
            top: highlightedElement.offsetTop - 4,
            left: highlightedElement.offsetLeft - 4,
            width: highlightedElement.offsetWidth + 8,
            height: highlightedElement.offsetHeight + 8,
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3)',
            animation: 'pulse 2s infinite'
          }}
        />
      )}

      {/* Tutorial Card */}
      <div
        className={`fixed z-50 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 max-w-sm mx-4 ${
          currentStepData.position === 'top' ? 'top-4' :
          currentStepData.position === 'bottom' ? 'bottom-4' :
          currentStepData.position === 'left' ? 'left-4 top-1/2 -translate-y-1/2' :
          currentStepData.position === 'right' ? 'right-4 top-1/2 -translate-y-1/2' :
          'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">{currentStep + 1}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{currentStepData.title}</h3>
              <p className="text-xs text-slate-400">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-all"
            aria-label="Close tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-slate-300 mb-4 leading-relaxed">
            {currentStepData.description}
          </p>

          {/* Action Indicator */}
          {currentStepData.action && (
            <div className="mb-4 p-3 bg-blue-600/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center space-x-2">
                {currentStepData.action === 'click' && <ArrowRight className="w-4 h-4 text-blue-400" />}
                {currentStepData.action === 'swipe' && <ArrowLeft className="w-4 h-4 text-blue-400" />}
                {currentStepData.action === 'type' && <ArrowDown className="w-4 h-4 text-blue-400" />}
                {currentStepData.action === 'wait' && <Circle className="w-4 h-4 text-blue-400" />}
                <span className="text-sm text-blue-400 font-medium">
                  {currentStepData.actionText}
                </span>
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="mb-4">
            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded ${
                    index <= currentStep ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlayPause}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                aria-label={isPlaying ? 'Pause tutorial' : 'Play tutorial'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={resetTutorial}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                aria-label="Reset tutorial"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {currentStepData.skipable && (
                <button
                  onClick={skipTutorial}
                  className="px-3 py-1 text-sm text-slate-400 hover:text-white transition-all"
                >
                  Skip
                </button>
              )}
              
              <button
                onClick={nextStep}
                className="flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
              >
                <span>{currentStep === steps.length - 1 ? 'Finish' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}

// Hook for managing tutorials
export function useTutorial(tutorialId: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  const startTutorial = () => {
    setIsOpen(true);
  };

  const closeTutorial = () => {
    setIsOpen(false);
  };

  const completeTutorial = () => {
    setHasCompleted(true);
    setIsOpen(false);
    // Store completion in localStorage
    localStorage.setItem(`tutorial-${tutorialId}-completed`, 'true');
  };

  // Check if tutorial was completed
  useEffect(() => {
    const completed = localStorage.getItem(`tutorial-${tutorialId}-completed`);
    setHasCompleted(completed === 'true');
  }, [tutorialId]);

  return {
    isOpen,
    hasCompleted,
    startTutorial,
    closeTutorial,
    completeTutorial
  };
}
