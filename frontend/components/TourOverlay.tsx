'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTour } from '@/contexts/TourContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, ChevronLeft, ChevronRight, Play, Info, Crown, Sparkles } from 'lucide-react';

export default function TourOverlay() {
  const { isActive, currentStep, steps, nextStep, previousStep, skipTour, endTour } = useTour();
  const { t } = useLanguage();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || steps.length === 0) return;

    try {
      const step = steps[currentStep];
      const element = document.querySelector(step.target) as HTMLElement;
      
      if (element) {
        setTargetElement(element);
        updateOverlayStyles(element, step);
        scrollToElement(element);
      }
    } catch (error) {
      console.error('Tour step error:', error);
      endTour();
    }
  }, [isActive, currentStep, steps, endTour]);

  const updateOverlayStyles = (element: HTMLElement, step: any) => {
    try {
      const rect = element.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      // Much lighter overlay
      setOverlayStyle({
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9998,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(1px)'
      });

      // Enhanced tooltip positioning
      let tooltipPosition = calculateTooltipPosition(rect, step);
      setTooltipStyle({
        ...tooltipPosition,
        zIndex: 10000,
        animation: 'tourPulse 2s infinite'
      });

    } catch (error) {
      console.error('Error updating overlay styles:', error);
    }
  };

  const calculateTooltipPosition = (rect: DOMRect, step: any) => {
    // Responsive tooltip dimensions
    const isMobile = window.innerWidth < 768;
    const tooltipWidth = isMobile ? Math.min(320, window.innerWidth - 40) : 400;
    const tooltipHeight = isMobile ? Math.min(400, window.innerHeight - 100) : 300;
    const margin = isMobile ? 10 : 20;

    let top = rect.bottom + margin;
    let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);

    // Adjust based on position preference
    switch (step.position) {
      case 'top':
        top = rect.top - tooltipHeight - margin;
        break;
      case 'bottom':
        top = rect.bottom + margin;
        break;
      case 'left':
        left = rect.left - tooltipWidth - margin;
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        break;
      case 'right':
        left = rect.right + margin;
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        break;
      case 'center':
        top = window.innerHeight / 2 - tooltipHeight / 2;
        left = window.innerWidth / 2 - tooltipWidth / 2;
        break;
    }

    // Keep tooltip within viewport - strict bounds for mobile
    const maxLeft = window.innerWidth - tooltipWidth - margin;
    const maxTop = window.innerHeight - tooltipHeight - margin;
    
    if (left < margin) left = margin;
    if (left > maxLeft) left = maxLeft;
    if (top < margin) top = margin;
    if (top > maxTop) top = maxTop;
    
    // On mobile, prefer center positioning if element is not visible
    if (isMobile && (rect.top < 0 || rect.bottom > window.innerHeight)) {
      top = margin;
      left = margin;
    }

    return { top, left };
  };

  const scrollToElement = (element: HTMLElement) => {
    try {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      });
    } catch (error) {
      console.error('Error scrolling to element:', error);
    }
  };

  const handleNext = () => {
    setIsAnimating(true);
    setTimeout(() => {
      nextStep();
      setIsAnimating(false);
    }, 200);
  };

  const handlePrevious = () => {
    setIsAnimating(true);
    setTimeout(() => {
      previousStep();
      setIsAnimating(false);
    }, 200);
  };

  if (!isActive || steps.length === 0 || currentStep >= steps.length) {
    return null;
  }

  const step = steps[currentStep];

  return (
    <>
      {/* Minimal Overlay - Much Less Shaded */}
      <div 
        style={overlayStyle}
        onClick={handleNext}
      ></div>

      {/* Enhanced Spotlight Effect */}
      {targetElement && (
        <div
          className="fixed inset-0 pointer-events-none z-[9999]"
          style={{
            clipPath: `polygon(
              0% 0%,
              0% 100%,
              ${targetElement.getBoundingClientRect().left}px 100%,
              ${targetElement.getBoundingClientRect().left}px ${targetElement.getBoundingClientRect().top}px,
              ${targetElement.getBoundingClientRect().right}px ${targetElement.getBoundingClientRect().top}px,
              ${targetElement.getBoundingClientRect().right}px ${targetElement.getBoundingClientRect().bottom}px,
              ${targetElement.getBoundingClientRect().left}px ${targetElement.getBoundingClientRect().bottom}px,
              ${targetElement.getBoundingClientRect().left}px 100%,
              100% 100%,
              100% 0%
            )`,
          }}
        >
          <div
            className="absolute animate-pulse"
            style={{
              top: targetElement.getBoundingClientRect().top - 4,
              left: targetElement.getBoundingClientRect().left - 4,
              width: targetElement.getBoundingClientRect().width + 8,
              height: targetElement.getBoundingClientRect().height + 8,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              border: '3px solid #3b82f6',
              background: 'rgba(59, 130, 246, 0.1)',
            }}
          ></div>
        </div>
      )}

      {/* Exciting Tooltip Design */}
      <div
        ref={tooltipRef}
        className="tour-tooltip"
        style={{
          ...tooltipStyle,
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          border: '2px solid #3b82f6',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(59, 130, 246, 0.3)',
          backdropFilter: 'blur(20px)',
          maxWidth: window.innerWidth < 768 ? `${window.innerWidth - 40}px` : '400px',
          width: window.innerWidth < 768 ? `${window.innerWidth - 40}px` : 'auto',
          padding: window.innerWidth < 768 ? '16px' : '24px',
          color: 'white',
          maxHeight: window.innerWidth < 768 ? `${window.innerHeight - 100}px` : 'auto',
          overflowY: window.innerWidth < 768 ? 'auto' : 'visible',
        }}
      >
        {/* Header with Gradient */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {step.title}
          </h3>
          <button 
            onClick={skipTour} 
            className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-500/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content with Better Typography */}
        <div className="mb-6">
          <p className="text-slate-200 text-base leading-relaxed">
            {step.content}
          </p>
        </div>

        {/* Action Indicators */}
        {step.action && (
          <div className="flex items-center text-blue-400 text-sm mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Info size={18} className="mr-2" />
            <span className="font-medium">
              {step.action === 'click' && '👆 Click this element to continue'}
              {step.action === 'hover' && '👋 Hover over this element'}
              {step.action === 'scroll' && '📜 Scroll to see more'}
            </span>
          </div>
        )}

        {/* Premium Feature Indicator */}
        {(step as any).isPremiumFeature && (
          <div className="flex items-center text-yellow-400 text-sm mb-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <Crown size={18} className="mr-2" />
            <span className="font-medium">👑 Premium Feature</span>
          </div>
        )}

        {/* Progress and Navigation */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-20 bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
          
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <button 
                onClick={handlePrevious} 
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <ChevronLeft size={16} />
                <span className="text-sm font-medium">Back</span>
              </button>
            )}
            {currentStep < steps.length - 1 ? (
              <button 
                onClick={handleNext} 
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg"
              >
                <span className="text-sm font-medium">Next</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                onClick={endTour} 
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg"
              >
                <span className="text-sm font-medium">Finish Tour</span>
                <Play size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes tourPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </>
  );
}