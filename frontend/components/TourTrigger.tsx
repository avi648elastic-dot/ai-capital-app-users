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
          className={`group relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 ${sizeClasses[size]} ${className} animate-bounce-slow`}
          title={t('common.startTour')}
          style={{
            background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)',
            backgroundSize: '200% 200%',
            animation: 'gradientShift 3s ease infinite',
          }}
        >
          <div className="flex items-center space-x-2 relative z-10">
            <Sparkles className={`${iconSizes[size]} group-hover:animate-spin`} />
            <span className="hidden sm:inline font-semibold">{t('common.startTour')}</span>
          </div>
          
          {/* Enhanced new badge */}
          {!hasSeenTour && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          )}
          
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
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