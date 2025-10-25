'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function AnimatedBackground() {
  const [isClient, setIsClient] = useState(false);
  const [icTreeOpacity, setIcTreeOpacity] = useState(0.3);
  const { theme } = useTheme();

  useEffect(() => {
    setIsClient(true);

    // IC Tree pulsing animation - more visible
    const interval = setInterval(() => {
      setIcTreeOpacity(prev => {
        if (prev <= 0.3) return 0.7;
        if (prev >= 0.7) return 0.3;
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
      {/* Professional Subtle Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/3 via-transparent to-slate-800/3 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tl from-green-900/2 via-transparent to-blue-900/2 pointer-events-none" />
      
      {/* IC Tree Logo - MUCH MORE VISIBLE with larger size */}
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ 
          opacity: icTreeOpacity,
          transition: 'opacity 2s ease-in-out'
        }}
      >
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Tree with IC letters - Metallic gold, much larger */}
          <g fill="#D4AF37">
            {/* IC Letters - Much larger */}
            <text x="95" y="105" fontFamily="serif" fontSize="32" fontWeight="bold" textAnchor="middle" fill="#D4AF37" stroke="#D4AF37" strokeWidth="0.5">IC</text>
            
            {/* Simplified Tree Branches - Much larger */}
            <path d="M60 90 Q70 55 85 90 Q95 45 110 90 Q120 40 135 90 Q145 45 160 90" stroke="#D4AF37" strokeWidth="3" fill="none" opacity="0.8"/>
            
            {/* Simplified Tree Roots - Much larger */}
            <path d="M60 115 Q70 145 85 115 Q95 160 110 115 Q120 165 135 115 Q145 160 160 115" stroke="#D4AF37" strokeWidth="3" fill="none" opacity="0.8"/>
          </g>
        </svg>
      </div>
    </div>
  );
}