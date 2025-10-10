'use client';

import React from 'react';
import { useTour } from '@/contexts/TourContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles, HelpCircle } from 'lucide-react';

interface TourTriggerProps {
  variant?: 'button' | 'icon' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function TourTrigger({ 
  variant = 'button', 
  size = 'md',
  className = '' 
}: TourTriggerProps) {
  const { t } = useLanguage();
  const { startTour, hasSeenTour } = useTour();

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleStartTour = () => {
    try {
      startTour();
    } catch (error) {
      console.error('Failed to start tour:', error);
    }
  };

  if (variant === 'floating') {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleStartTour}
          className={`group relative bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ${sizeClasses[size]} ${className}`}
          title={t('common.startTour')}
        >
          <div className="flex items-center space-x-2">
            <Sparkles className={`${iconSizes[size]} group-hover:animate-spin`} />
            <span className="hidden sm:inline">{t('common.startTour')}</span>
          </div>
          
          {/* New badge */}
          {!hasSeenTour && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleStartTour}
        className={`text-slate-400 hover:text-blue-400 transition-colors ${className}`}
        title={t('common.startTour')}
      >
        <HelpCircle className={iconSizes[size]} />
      </button>
    );
  }

  return (
    <button
      onClick={handleStartTour}
      className={`inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors ${sizeClasses[size]} ${className}`}
    >
      <Sparkles className={iconSizes[size]} />
      <span>{t('common.startTour')}</span>
      {!hasSeenTour && (
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}