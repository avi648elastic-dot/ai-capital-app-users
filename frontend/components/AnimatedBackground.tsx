'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { usePathname } from 'next/navigation';

export default function AnimatedBackground() {
  const [isClient, setIsClient] = useState(false);
  const { theme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  // Determine intensity based on page
  const isLoginPage = pathname === '/';
  const isDashboard = pathname === '/dashboard';
  // Reduce login page intensity for faster loading
  const intensity = isLoginPage ? 'medium' : isDashboard ? 'full' : 'subtle';

  // Professional financial symbols (subtle, text-based)
  const stockSymbols = ['$', '€', '₿', '¥', '£', '₹', '₽', '₩', '₪', '₨', '₦', '₡', '₵', '₴', '₸', '₼', '₾', '₿'];
  
  // Professional market indicators
  const financialIcons = ['▲', '▼', '●', '■', '◆', '◊', '◇', '◈', '◉', '◊', '○', '◯'];

  // Market trend indicators
  const marketIndices = ['↗', '↘', '→', '↗', '↘', '→', '↗', '↘'];

  // Professional subtle gradients
  const bubbleGradients = theme === 'light' ? [
    'bg-gradient-to-br from-slate-100/60 to-slate-200/60',
    'bg-gradient-to-br from-blue-100/50 to-blue-200/50', 
    'bg-gradient-to-br from-green-100/50 to-green-200/50',
    'bg-gradient-to-br from-indigo-100/50 to-indigo-200/50',
    'bg-gradient-to-br from-gray-100/60 to-gray-200/60',
    'bg-gradient-to-br from-slate-100/60 to-slate-200/60'
  ] : [
    'bg-gradient-to-br from-slate-800/30 to-slate-900/30',
    'bg-gradient-to-br from-blue-900/25 to-blue-800/25',
    'bg-gradient-to-br from-green-900/25 to-green-800/25', 
    'bg-gradient-to-br from-indigo-900/25 to-indigo-800/25',
    'bg-gradient-to-br from-gray-800/30 to-gray-900/30',
    'bg-gradient-to-br from-slate-800/30 to-slate-900/30'
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Professional Subtle Bubbles */}
      {[...Array(intensity === 'full' ? 20 : intensity === 'medium' ? 12 : 8)].map((_, i) => {
        const bubbleType = bubbleGradients[i % bubbleGradients.length];
        const size = intensity === 'full' ? `${1.5 + (i % 3)}rem` : 
                    intensity === 'medium' ? `${1 + (i % 2)}rem` : 
                    `${0.8 + (i % 2) * 0.4}rem`;
        
        const opacity = intensity === 'full' ? 0.4 : 
                       intensity === 'medium' ? 0.3 : 0.2;
        
        const animationSpeed = intensity === 'full' ? `${15 + (i % 5) * 3}s` :
                              intensity === 'medium' ? `${20 + (i % 3) * 5}s` :
                              `${25 + i * 3}s`;
        
        return (
          <div
            key={`bubble-${i}`}
            className={`absolute rounded-full ${bubbleType} animate-bubble`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: size,
              height: size,
              animationDelay: `${i * 0.8}s`,
              animationDuration: animationSpeed,
              filter: 'blur(1px)',
              opacity: opacity,
              boxShadow: `
                0 2px 8px rgba(0, 0, 0, ${intensity === 'full' ? 0.1 : intensity === 'medium' ? 0.08 : 0.05}),
                0 1px 4px rgba(0, 0, 0, ${intensity === 'full' ? 0.06 : intensity === 'medium' ? 0.04 : 0.02})
              `,
              border: `1px solid rgba(255, 255, 255, ${intensity === 'full' ? 0.1 : intensity === 'medium' ? 0.08 : 0.05})`,
              backdropFilter: 'blur(1px)'
            }}
          />
        );
      })}

      {/* Professional Currency Symbols */}
      {(intensity === 'full' ? stockSymbols.slice(0, 8) : intensity === 'medium' ? stockSymbols.slice(0, 6) : stockSymbols.slice(0, 4)).map((symbol, i) => {
        const bgColor = theme === 'light' ? 'bg-white/80' : 'bg-slate-800/80';
        const borderColor = theme === 'light' ? 'border-slate-300' : 'border-slate-600';
        const textColor = theme === 'light' ? 'text-slate-700' : 'text-slate-300';
        
        const size = intensity === 'full' ? 'w-8 h-8' : 
                    intensity === 'medium' ? 'w-6 h-6' : 'w-5 h-5';
        
        const opacity = intensity === 'full' ? 0.7 : 
                       intensity === 'medium' ? 0.5 : 0.4;
        
        return (
          <div
            key={`stock-${i}`}
            className={`absolute ${bgColor} ${borderColor} ${textColor} border rounded-full ${size} flex items-center justify-center text-sm font-medium animate-float shadow-sm backdrop-blur-sm`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${8 + (i % 3) * 2}s`,
              opacity: opacity,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
          >
            {symbol}
          </div>
        );
      })}

      {/* Professional Trend Indicators */}
      {(intensity === 'full' ? financialIcons : intensity === 'medium' ? financialIcons.slice(0, 8) : financialIcons.slice(0, 6)).map((icon, i) => {
        const isUpTrend = icon === '▲' || icon === '●' || icon === '◆' || icon === '◈' || icon === '◉';
        
        const opacity = intensity === 'full' ? 0.5 : 
                       intensity === 'medium' ? 0.4 : 0.3;
        
        return (
          <div
            key={`financial-${i}`}
            className="absolute text-lg animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${10 + (i % 4) * 2}s`,
              opacity: opacity,
              color: theme === 'light' 
                ? (isUpTrend ? '#10b981' : '#ef4444')
                : (isUpTrend ? '#10b981' : '#ef4444')
            }}
          >
            {icon}
          </div>
        );
      })}

      {/* REMOVED: Blue Spinning Circle - This was the mobile "thinking" animation causing issues */}
    </div>
  );
}