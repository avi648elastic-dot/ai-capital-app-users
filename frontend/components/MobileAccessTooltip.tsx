'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Crown, Lock, Star, Zap, TrendingUp, BarChart3, Shield, Eye } from 'lucide-react';

interface TooltipContent {
  title: string;
  description: string;
  image?: string;
  features: string[];
  requiredTier: 'premium' | 'premium+' | 'enterprise';
  upgradeText: string;
}

interface MobileAccessTooltipProps {
  children: React.ReactNode;
  content: TooltipContent;
  userTier: 'free' | 'premium' | 'premium+' | 'enterprise';
  disabled?: boolean;
  className?: string;
}

const TIER_COLORS = {
  premium: 'from-emerald-500 to-emerald-600',
  'premium+': 'from-purple-500 to-purple-600',
  enterprise: 'from-blue-500 to-blue-600'
};

const TIER_ICONS = {
  premium: Star,
  'premium+': Crown,
  enterprise: Shield
};

export default function MobileAccessTooltip({ 
  children, 
  content, 
  userTier, 
  disabled = false,
  className = '' 
}: MobileAccessTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Check if user has access
  const hasAccess = () => {
    if (disabled) return true;
    
    const tierLevels = { free: 0, premium: 1, 'premium+': 2, enterprise: 3 };
    return tierLevels[userTier] >= tierLevels[content.requiredTier];
  };

  // Handle long press start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (hasAccess()) return;
    
    const touch = e.touches[0];
    setPosition({ x: touch.clientX, y: touch.clientY });
    
    const timer = setTimeout(() => {
      setShowTooltip(true);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long press
    
    setLongPressTimer(timer);
  };

  // Handle long press end
  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Handle mouse hover for desktop
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (hasAccess()) return;
    
    setPosition({ x: e.clientX, y: e.clientY });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  // Close tooltip
  const closeTooltip = () => {
    setShowTooltip(false);
  };

  // Handle click on disabled element
  const handleClick = (e: React.MouseEvent) => {
    if (!hasAccess()) {
      e.preventDefault();
      e.stopPropagation();
      setShowTooltip(true);
    }
  };

  // Position tooltip to avoid screen edges
  useEffect(() => {
    if (showTooltip && tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newX = position.x;
      let newY = position.y;
      
      // Adjust horizontal position
      if (newX + rect.width > viewportWidth - 20) {
        newX = viewportWidth - rect.width - 20;
      }
      if (newX < 20) {
        newX = 20;
      }
      
      // Adjust vertical position
      if (newY + rect.height > viewportHeight - 20) {
        newY = position.y - rect.height - 10;
      }
      
      tooltip.style.left = `${newX}px`;
      tooltip.style.top = `${newY}px`;
    }
  }, [showTooltip, position]);

  const TierIcon = TIER_ICONS[content.requiredTier];

  return (
    <>
      <div
        ref={triggerRef}
        className={`relative ${className} ${!hasAccess() ? 'cursor-not-allowed opacity-60' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
        
        {/* Lock overlay for inaccessible items */}
        {!hasAccess() && (
          <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center pointer-events-none">
            <Lock className="w-6 h-6 text-white/80" />
          </div>
        )}
      </div>

      {/* Mobile/Desktop Tooltip */}
      {showTooltip && !hasAccess() && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={closeTooltip}
          />
          
          {/* Tooltip Content */}
          <div
            ref={tooltipRef}
            className={`fixed z-50 w-80 max-w-[90vw] bg-gray-800 rounded-xl shadow-2xl border border-gray-600 overflow-hidden ${
              window.innerWidth < 768 ? 'left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2' : ''
            }`}
            style={window.innerWidth >= 768 ? { left: position.x, top: position.y } : {}}
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${TIER_COLORS[content.requiredTier]} p-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TierIcon className="w-6 h-6 text-white" />
                  <h3 className="text-lg font-bold text-white">{content.title}</h3>
                </div>
                <button
                  onClick={closeTooltip}
                  className="text-white/80 hover:text-white transition-colors md:hidden"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Description */}
              <p className="text-gray-300 text-sm leading-relaxed">
                {content.description}
              </p>

              {/* Preview Image */}
              {content.image && (
                <div className="relative rounded-lg overflow-hidden bg-gray-700">
                  <img 
                    src={content.image} 
                    alt={content.title}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDMyMCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTI4IiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xNDQgNjRMMTUyIDU2TDE2OCA3Mkw2NCA3MkwxNDQgNjRaIiBmaWxsPSIjNkI3Mjg2Ii8+CjxjaXJjbGUgY3g9IjEyOCIgY3k9IjQ4IiByPSI4IiBmaWxsPSIjNkI3Mjg2Ii8+Cjx0ZXh0IHg9IjE2MCIgeT0iNzIiIGZpbGw9IiM5Q0E0QUYiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWkiIGZvbnQtc2l6ZT0iMTIiPkZlYXR1cmUgUHJldmlldyA8L3RleHQ+Cjwvc3ZnPgo=';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-3">
                      <div className="flex items-center space-x-2 text-white">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm font-medium">Feature Preview</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Features List */}
              <div>
                <h4 className="text-white font-semibold mb-2 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-yellow-400" />
                  What you'll get:
                </h4>
                <ul className="space-y-2">
                  {content.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-gray-300">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Upgrade CTA */}
              <div className={`bg-gradient-to-r ${TIER_COLORS[content.requiredTier]} rounded-lg p-3`}>
                <div className="text-center">
                  <p className="text-white font-semibold text-sm mb-2">
                    {content.upgradeText}
                  </p>
                  <button
                    onClick={() => {
                      closeTooltip();
                      // Navigate to upgrade page
                      window.location.href = '/upgrade';
                    }}
                    className="bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors w-full"
                  >
                    Upgrade to {content.requiredTier.charAt(0).toUpperCase() + content.requiredTier.slice(1)}
                  </button>
                </div>
              </div>

              {/* Current Plan Info */}
              <div className="text-center text-xs text-gray-400 border-t border-gray-700 pt-3">
                Current plan: <span className="font-semibold text-gray-300 capitalize">{userTier}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Predefined tooltip contents for common features
export const TOOLTIP_CONTENTS = {
  portfolioAnalysis: {
    title: 'Advanced Portfolio Analysis',
    description: 'Get deep insights into your portfolio performance with advanced analytics, risk assessment, and AI-powered recommendations.',
    image: '/images/portfolio-analysis-preview.png',
    features: [
      'Detailed performance analytics',
      'Risk assessment and scoring',
      'Sector allocation analysis',
      'AI-powered recommendations',
      'Historical performance tracking',
      'Benchmark comparisons'
    ],
    requiredTier: 'premium' as const,
    upgradeText: 'Unlock advanced analytics and make smarter investment decisions!'
  },
  
  riskManagement: {
    title: 'Professional Risk Management',
    description: 'Advanced risk management tools to protect your investments and optimize your portfolio allocation.',
    image: '/images/risk-management-preview.png',
    features: [
      'Real-time risk monitoring',
      'Stop-loss automation',
      'Position sizing calculator',
      'Volatility analysis',
      'Correlation matrix',
      'Risk-adjusted returns'
    ],
    requiredTier: 'premium+' as const,
    upgradeText: 'Protect your investments with professional risk management tools!'
  },
  
  multiplePortfolios: {
    title: 'Multiple Portfolios',
    description: 'Create and manage multiple portfolios for different strategies, risk levels, and investment goals.',
    image: '/images/multiple-portfolios-preview.png',
    features: [
      'Up to 10 different portfolios',
      'Custom portfolio strategies',
      'Individual performance tracking',
      'Portfolio comparison tools',
      'Separate risk management',
      'Strategy backtesting'
    ],
    requiredTier: 'premium+' as const,
    upgradeText: 'Diversify your strategies with multiple portfolios!'
  },
  
  advancedAlerts: {
    title: 'Advanced Price Alerts',
    description: 'Set sophisticated price alerts with multiple conditions, technical indicators, and smart notifications.',
    image: '/images/advanced-alerts-preview.png',
    features: [
      'Technical indicator alerts',
      'Multi-condition triggers',
      'SMS and email notifications',
      'Smart alert management',
      'Alert history and analytics',
      'Custom alert templates'
    ],
    requiredTier: 'premium' as const,
    upgradeText: 'Never miss important market movements again!'
  },
  
  realTimeData: {
    title: 'Real-Time Market Data',
    description: 'Access live market data with minimal delay, real-time price updates, and instant notifications.',
    image: '/images/realtime-data-preview.png',
    features: [
      'Live price updates',
      'Real-time market data',
      'Instant notifications',
      'Level 2 market data',
      'After-hours trading data',
      'Global market coverage'
    ],
    requiredTier: 'premium' as const,
    upgradeText: 'Get the edge with real-time market data!'
  }
};

export { MobileAccessTooltip };
