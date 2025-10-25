'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function AnimatedBackground() {
  const [isClient, setIsClient] = useState(false);
  const [icTreeOpacity, setIcTreeOpacity] = useState(0.05);
  const { theme } = useTheme();

  useEffect(() => {
    setIsClient(true);

    // IC Tree pulsing animation
    const interval = setInterval(() => {
      setIcTreeOpacity(prev => {
        if (prev <= 0.05) return 0.25;
        if (prev >= 0.25) return 0.05;
        return prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* IC Tree Logo - Subtle Pulsing Effect */}
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ 
          opacity: icTreeOpacity,
          transition: 'opacity 2s ease-in-out'
        }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Tree with IC letters - Metallic gold */}
          <g fill="#D4AF37">
            {/* IC Letters */}
            <text x="52" y="62" fontFamily="serif" fontSize="18" fontWeight="bold" textAnchor="middle" fill="#D4AF37">IC</text>
            
            {/* Simplified Tree Branches */}
            <path d="M35 55 Q40 35 45 55 Q50 30 55 55 Q60 25 65 55 Q70 30 75 55 Q80 35 85 55" stroke="#D4AF37" strokeWidth="2" fill="none" opacity="0.6"/>
            
            {/* Simplified Tree Roots */}
            <path d="M35 65 Q40 85 45 65 Q50 90 55 65 Q60 95 65 65 Q70 90 75 65 Q80 85 85 65" stroke="#D4AF37" strokeWidth="2" fill="none" opacity="0.6"/>
          </g>
        </svg>
      </div>
    </div>
  );
}