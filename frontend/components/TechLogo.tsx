'use client';

import React from 'react';

interface TechLogoProps {
  className?: string;
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
}

const TechLogo: React.FC<TechLogoProps> = ({ className = '', size = 'md' }) => {
  const getSize = () => {
    if (typeof size === 'number') return size;
    const sizeMap = { sm: 24, md: 32, lg: 48, xl: 64 } as const;
    return sizeMap[size];
  };

  const logoSize = getSize();

  return (
    <div className={className} style={{ width: logoSize, height: logoSize }}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="AI Capital Logo"
      >
        <defs>
          <linearGradient id="aicapital-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E5E7EB" />
            <stop offset="100%" stopColor="#9CA3AF" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#60A5FA" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Stylized A mark */}
        <g fill="url(#aicapital-grad)" filter="url(#glow)">
          {/* Left leg */}
          <path d="M20 78 L47 22 C49 18 51 18 53 22 L80 78 L70 78 L50 38 L30 78 Z" />
          {/* Cross bar */}
          <rect x="42" y="56" width="16" height="6" rx="2" />
        </g>
      </svg>
    </div>
  );
};

export default TechLogo;


