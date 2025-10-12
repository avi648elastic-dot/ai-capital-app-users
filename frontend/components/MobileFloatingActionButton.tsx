'use client';

import React, { useState } from 'react';
import { Plus, TrendingUp, Target, Zap } from 'lucide-react';
import MobileAddInterface from './MobileAddInterface';

interface MobileFloatingActionButtonProps {
  userTier: 'free' | 'premium' | 'premium+' | 'enterprise';
  onSuccess?: () => void;
  className?: string;
}

export default function MobileFloatingActionButton({ 
  userTier, 
  onSuccess,
  className = '' 
}: MobileFloatingActionButtonProps) {
  const [showInterface, setShowInterface] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMainButtonClick = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      setShowInterface(true);
    }
  };

  const handleQuickAction = (action: 'portfolio' | 'stock') => {
    setIsExpanded(false);
    setShowInterface(true);
  };

  return (
    <>
      {/* Main FAB */}
      <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
        {/* Quick Action Buttons */}
        {isExpanded && (
          <div className="absolute bottom-16 right-0 space-y-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
            {/* Add Portfolio */}
            <button
              onClick={() => handleQuickAction('portfolio')}
              className="flex items-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-full shadow-lg transition-all transform hover:scale-105 group"
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold pr-2">New Portfolio</span>
            </button>

            {/* Add Stock */}
            <button
              onClick={() => handleQuickAction('stock')}
              className="flex items-center space-x-3 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-full shadow-lg transition-all transform hover:scale-105 group"
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold pr-2">Add Stock</span>
            </button>
          </div>
        )}

        {/* Main Button */}
        <button
          onClick={handleMainButtonClick}
          className={`w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-xl transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center group ${
            isExpanded ? 'rotate-45' : ''
          }`}
        >
          <Plus className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-45' : ''}`} />
          
          {/* Ripple Effect */}
          <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-active:scale-100 transition-transform duration-150"></div>
          
          {/* Pulse Animation */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping opacity-20"></div>
        </button>

        {/* Tooltip */}
        {!isExpanded && (
          <div className="absolute bottom-16 right-0 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Add to Portfolio
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        )}
      </div>

      {/* Background Overlay for Expanded State */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Mobile Add Interface */}
      <MobileAddInterface
        isVisible={showInterface}
        onClose={() => setShowInterface(false)}
        userTier={userTier}
        onSuccess={() => {
          onSuccess?.();
          setShowInterface(false);
        }}
      />
    </>
  );
}

// Long press functionality is handled within the component
