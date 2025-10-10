'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTour } from '@/contexts/TourContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, ChevronLeft, ChevronRight, Play, SkipForward } from 'lucide-react';

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

    const step = steps[currentStep];
    const element = document.querySelector(step.target) as HTMLElement;
    
    if (element) {
      setTargetElement(element);
      updateOverlayStyles(element, step);
      scrollToElement(element);
    }
  }, [isActive, currentStep, steps]);

  const updateOverlayStyles = (element: HTMLElement, step: TourStep) => {
    const rect = element.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Create overlay that covers everything except the target element
    setOverlayStyle({
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9998,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(2px)'
    });

    // Position tooltip based on step position
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const padding = 20;

    let tooltipTop = 0;
    let tooltipLeft = 0;

    switch (step.position) {
      case 'top':
        tooltipTop = rect.top + scrollY - tooltipHeight - padding;
        tooltipLeft = rect.left + scrollX + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        tooltipTop = rect.bottom + scrollY + padding;
        tooltipLeft = rect.left + scrollX + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        tooltipTop = rect.top + scrollY + (rect.height / 2) - (tooltipHeight / 2);
        tooltipLeft = rect.left + scrollX - tooltipWidth - padding;
        break;
      case 'right':
        tooltipTop = rect.top + scrollY + (rect.height / 2) - (tooltipHeight / 2);
        tooltipLeft = rect.right + scrollX + padding;
        break;
      case 'center':
      default:
        tooltipTop = window.innerHeight / 2 - tooltipHeight / 2;
        tooltipLeft = window.innerWidth / 2 - tooltipWidth / 2;
        break;
    }

    // Ensure tooltip stays within viewport
    tooltipLeft = Math.max(padding, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - padding));
    tooltipTop = Math.max(padding, Math.min(tooltipTop, window.innerHeight - tooltipHeight - padding));

    setTooltipStyle({
      position: 'fixed',
      top: tooltipTop,
      left: tooltipLeft,
      width: tooltipWidth,
      zIndex: 9999,
      transform: 'translateY(-10px)',
      opacity: 0,
      transition: 'all 0.3s ease-out'
    });

    // Animate tooltip in
    setTimeout(() => {
      setTooltipStyle(prev => ({
        ...prev,
        transform: 'translateY(0)',
        opacity: 1
      }));
    }, 100);
  };

  const scrollToElement = (element: HTMLElement) => {
    setIsAnimating(true);
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 1000);
  };

  const handleNext = () => {
    setIsAnimating(true);
    setTimeout(() => {
      nextStep();
      setIsAnimating(false);
    }, 300);
  };

  const handlePrevious = () => {
    setIsAnimating(true);
    setTimeout(() => {
      previousStep();
      setIsAnimating(false);
    }, 300);
  };

  const handleSkip = () => {
    setIsAnimating(true);
    setTimeout(() => {
      skipTour();
      setIsAnimating(false);
    }, 300);
  };

  if (!isActive || steps.length === 0) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div style={overlayStyle}>
        {/* Spotlight effect on target element */}
        {targetElement && (
          <div
            style={{
              position: 'absolute',
              top: targetElement.getBoundingClientRect().top - 10,
              left: targetElement.getBoundingClientRect().left - 10,
              width: targetElement.getBoundingClientRect().width + 20,
              height: targetElement.getBoundingClientRect().height + 20,
              borderRadius: '12px',
              boxShadow: step.highlight 
                ? '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 4px #3b82f6, 0 0 20px rgba(59, 130, 246, 0.5)'
                : '0 0 0 9999px rgba(0, 0, 0, 0.7)',
              pointerEvents: 'none',
              transition: 'all 0.3s ease-out'
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Play className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {step.title}
              </h3>
              <div className="text-xs text-slate-400">
                {currentStep + 1} of {steps.length}
              </div>
            </div>
          </div>
          <button
            onClick={endTour}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-slate-200 text-sm leading-relaxed mb-4">
            {step.content}
          </p>

          {/* Progress bar */}
          <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Action hint */}
          {step.action && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2 text-blue-300 text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <span>
                  {step.action === 'click' && t('tour.actionHint.click')}
                  {step.action === 'hover' && t('tour.actionHint.hover')}
                  {step.action === 'scroll' && t('tour.actionHint.scroll')}
                </span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm">{t('tour.previous')}</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {step.skipable !== false && (
                <button
                  onClick={handleSkip}
                  className="flex items-center space-x-1 px-3 py-2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                  <span className="text-sm">{t('tour.skip')}</span>
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all"
              >
                <span className="text-sm">
                  {currentStep === steps.length - 1 ? t('tour.finish') : t('tour.next')}
                </span>
                {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animation overlay */}
      {isAnimating && (
        <div className="fixed inset-0 z-[10000] pointer-events-none">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        </div>
      )}
    </>
  );
}
