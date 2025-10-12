'use client';

import React, { useState } from 'react';

interface MobileTooltipProps {
  content: string;
  children: React.ReactNode;
  feature?: string;
  disabled?: boolean;
}

const MobileTooltip: React.FC<MobileTooltipProps> = ({ 
  content, 
  children, 
  feature,
  disabled = false 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleLongPress = () => {
    if (disabled) {
      setIsVisible(true);
      // Auto-hide after 3 seconds
      setTimeout(() => setIsVisible(false), 3000);
    }
  };

  const handleTouchEnd = () => {
    // Small delay to distinguish from long press
    setTimeout(() => setIsVisible(false), 100);
  };

  return (
    <div className="relative inline-block">
      <div
        onTouchStart={handleLongPress}
        onTouchEnd={handleTouchEnd}
        onMouseDown={disabled ? handleLongPress : undefined}
        onMouseUp={disabled ? handleTouchEnd : undefined}
        className={disabled ? 'cursor-not-allowed opacity-50' : ''}
      >
        {children}
      </div>
      
      {isVisible && disabled && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64">
          <div className="bg-slate-800 text-white text-sm rounded-lg px-4 py-3 shadow-2xl border border-slate-600">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">🔒</span>
              <span className="font-semibold text-yellow-400">Premium Feature</span>
            </div>
            <p className="text-slate-200 mb-2">{content}</p>
            {feature && (
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span>💡</span>
                <span>Upgrade to access {feature}</span>
              </div>
            )}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileTooltip;
