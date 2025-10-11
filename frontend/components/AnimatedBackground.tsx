'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { usePathname } from 'next/navigation';

export default function AnimatedBackground() {
  const [isClient, setIsClient] = useState(false);
  const [positions, setPositions] = useState<Record<string, { left: number; top: number }>>({});
  const { theme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
    
    // Generate stable random positions for all elements
    const newPositions: Record<string, { left: number; top: number }> = {};
    
    // Generate positions for bubbles
    for (let i = 0; i < 25; i++) {
      newPositions[`bubble-${i}`] = {
        left: Math.random() * 100,
        top: Math.random() * 100
      };
    }
    
    // Generate positions for stock symbols
    for (let i = 0; i < 18; i++) {
      newPositions[`stock-${i}`] = {
        left: Math.random() * 100,
        top: Math.random() * 100
      };
    }
    
    // Generate positions for exchange symbols
    for (let i = 0; i < 8; i++) {
      newPositions[`exchange-${i}`] = {
        left: Math.random() * 100,
        top: Math.random() * 100
      };
    }
    
    // Generate positions for financial icons
    for (let i = 0; i < 12; i++) {
      newPositions[`financial-${i}`] = {
        left: Math.random() * 100,
        top: Math.random() * 100
      };
    }
    
    setPositions(newPositions);
  }, []);

  if (!isClient) {
    return null;
  }

  // Determine intensity based on page
  const isLoginPage = pathname === '/';
  const isDashboard = pathname === '/dashboard';
  const intensity = isLoginPage ? 'full' : isDashboard ? 'medium' : 'subtle';

  // Stock market focused symbols
  const stockSymbols = ['$', '€', '₿', '💎', '📈', '📊', '💰', '🏆', '⚡', '🔥', '💵', '💎', '📈', '💰', '⚡', '🔥', '💎', '📊'];
  
  // Money-making focused icons
  const financialIcons = ['💸', '💳', '🏦', '💼', '🎯', '⭐', '🌟', '💫', '✨', '🎪', '🚀', '💎'];

  // Stock market indices
  const marketIndices = ['📊', '📈', '💹', '📉', '💹', '📊', '📈', '📉'];

  // Theme-aware bubble gradients
  const bubbleGradients = theme === 'light' ? [
    'bg-gradient-to-br from-blue-200 to-purple-300',
    'bg-gradient-to-br from-green-200 to-blue-300', 
    'bg-gradient-to-br from-purple-200 to-pink-300',
    'bg-gradient-to-br from-yellow-200 to-orange-300',
    'bg-gradient-to-br from-pink-200 to-red-300',
    'bg-gradient-to-br from-indigo-200 to-purple-300'
  ] : [
    'bg-gradient-to-br from-blue-500 to-purple-600',
    'bg-gradient-to-br from-green-500 to-blue-600',
    'bg-gradient-to-br from-purple-500 to-pink-600', 
    'bg-gradient-to-br from-yellow-500 to-orange-600',
    'bg-gradient-to-br from-pink-500 to-red-600',
    'bg-gradient-to-br from-indigo-500 to-purple-600'
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
      {/* Circuit Board Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Stock Market Bubbles with Intensity Control */}
      {[...Array(intensity === 'full' ? 40 : intensity === 'medium' ? 25 : 15)].map((_, i) => {
        const bubbleType = bubbleGradients[i % bubbleGradients.length];
        const pos = positions[`bubble-${i}`];
        if (!pos) return null;
        
        const size = intensity === 'full' ? `${3 + (i % 5)}rem` : 
                    intensity === 'medium' ? `${2.5 + (i % 4)}rem` : 
                    `${2 + (i % 3)}rem`;
        
        const opacity = intensity === 'full' ? 0.9 : 
                       intensity === 'medium' ? 0.7 : 0.5;
        
        const animationSpeed = intensity === 'full' ? `${6 + (i % 3) * 2}s` :
                              intensity === 'medium' ? `${8 + (i % 2) * 3}s` :
                              `${12 + i * 2}s`;
        
        return (
          <div
            key={i}
            className={`absolute rounded-full ${bubbleType} animate-bubble`}
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              width: size,
              height: size,
              animationDelay: `${i * 0.4}s`,
              animationDuration: animationSpeed,
              filter: 'blur(0px)',
              opacity: opacity,
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, ${intensity === 'full' ? 0.3 : intensity === 'medium' ? 0.2 : 0.1}),
                0 4px 16px rgba(0, 0, 0, ${intensity === 'full' ? 0.2 : intensity === 'medium' ? 0.15 : 0.08}),
                inset 0 2px 4px rgba(255, 255, 255, 0.3),
                inset 0 -2px 4px rgba(0, 0, 0, 0.1)
              `,
              border: `2px solid rgba(255, 255, 255, ${intensity === 'full' ? 0.4 : intensity === 'medium' ? 0.3 : 0.2})`,
              backdropFilter: 'blur(2px)'
            }}
          />
        );
      })}

      {/* Stock Market Symbols with Intensity Control */}
      {(intensity === 'full' ? stockSymbols : intensity === 'medium' ? stockSymbols.slice(0, 12) : stockSymbols.slice(0, 8)).map((symbol, i) => {
        const pos = positions[`stock-${i}`];
        if (!pos) return null;
        
        const isMoneySymbol = symbol === '$' || symbol === '€' || symbol === '₿' || symbol === '💎' || symbol === '💰';
        const bgColor = isMoneySymbol 
          ? (theme === 'light' ? 'bg-green-100/90' : 'bg-green-900/90')
          : (theme === 'light' ? 'bg-blue-100/90' : 'bg-blue-900/90');
        const borderColor = isMoneySymbol 
          ? (theme === 'light' ? 'border-green-400' : 'border-green-500')
          : (theme === 'light' ? 'border-blue-400' : 'border-blue-500');
        
        const size = intensity === 'full' ? 'w-12 h-12' : 
                    intensity === 'medium' ? 'w-10 h-10' : 'w-8 h-8';
        
        const opacity = intensity === 'full' ? 0.95 : 
                       intensity === 'medium' ? 0.8 : 0.6;
        
        return (
          <div
            key={`stock-${i}`}
            className={`absolute ${bgColor} ${borderColor} border-2 rounded-full ${size} flex items-center justify-center text-lg font-bold animate-float shadow-2xl backdrop-blur-sm`}
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${4 + (i % 3)}s`,
              opacity: opacity,
              boxShadow: isMoneySymbol 
                ? '0 4px 20px rgba(34, 197, 94, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
                : '0 4px 20px rgba(59, 130, 246, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
            }}
          >
            {symbol}
          </div>
        );
      })}

      {/* Money-Making Financial Icons */}
      {(intensity === 'full' ? financialIcons : intensity === 'medium' ? financialIcons.slice(0, 8) : financialIcons.slice(0, 6)).map((icon, i) => {
        const pos = positions[`financial-${i}`];
        if (!pos) return null;
        
        const isHighValue = icon === '💎' || icon === '💰' || icon === '🚀' || icon === '💸';
        const bgColor = isHighValue 
          ? (theme === 'light' ? 'bg-purple-100/90' : 'bg-purple-900/90')
          : (theme === 'light' ? 'bg-yellow-100/90' : 'bg-yellow-900/90');
        const borderColor = isHighValue 
          ? (theme === 'light' ? 'border-purple-400' : 'border-purple-500')
          : (theme === 'light' ? 'border-yellow-400' : 'border-yellow-500');
        
        const size = intensity === 'full' ? 'w-10 h-10' : 
                    intensity === 'medium' ? 'w-8 h-8' : 'w-6 h-6';
        
        const opacity = intensity === 'full' ? 0.95 : 
                       intensity === 'medium' ? 0.8 : 0.6;
        
        return (
          <div
            key={`financial-${i}`}
            className={`absolute ${bgColor} ${borderColor} border-2 rounded-full ${size} flex items-center justify-center text-lg animate-sparkle shadow-2xl backdrop-blur-sm`}
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${3 + (i % 2)}s`,
              opacity: opacity,
              boxShadow: isHighValue 
                ? '0 4px 20px rgba(147, 51, 234, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
                : '0 4px 20px rgba(234, 179, 8, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
            }}
          >
            {icon}
          </div>
        );
      })}

      {/* Market Index Indicators */}
      {(intensity === 'full' ? marketIndices : intensity === 'medium' ? marketIndices.slice(0, 6) : marketIndices.slice(0, 4)).map((index, i) => {
        const pos = positions[`exchange-${i}`];
        if (!pos) return null;
        
        const bgColor = theme === 'light' ? 'bg-emerald-100/90' : 'bg-emerald-900/90';
        const borderColor = theme === 'light' ? 'border-emerald-400' : 'border-emerald-500';
        
        const size = intensity === 'full' ? 'w-8 h-8' : 
                    intensity === 'medium' ? 'w-6 h-6' : 'w-5 h-5';
        
        const opacity = intensity === 'full' ? 0.9 : 
                       intensity === 'medium' ? 0.7 : 0.5;
        
        return (
          <div
            key={`index-${i}`}
            className={`absolute ${bgColor} ${borderColor} border-2 rounded-full ${size} flex items-center justify-center text-sm animate-float-delayed shadow-xl backdrop-blur-sm`}
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${6 + (i % 2)}s`,
              opacity: opacity,
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
            }}
          >
            {index}
          </div>
        );
      })}

      {/* Market Data Streams with Intensity Control */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(intensity === 'full' ? 10 : intensity === 'medium' ? 6 : 4)].map((_, i) => (
          <div
            key={`stream-${i}`}
            className="absolute w-2 h-24 bg-gradient-to-b from-transparent via-blue-400/60 to-transparent animate-data-stream"
            style={{
              left: `${15 + i * 12}%`,
              top: `${5 + i * 12}%`,
              animationDelay: `${i * 1.5}s`,
              animationDuration: intensity === 'full' ? '12s' : intensity === 'medium' ? '15s' : '20s',
              opacity: intensity === 'full' ? 0.7 : intensity === 'medium' ? 0.5 : 0.3,
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
            }}
          />
        ))}
      </div>

      {/* Money-Making Glowing Orbs */}
      <div className="absolute inset-0">
        {[...Array(intensity === 'full' ? 8 : intensity === 'medium' ? 5 : 3)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className="absolute rounded-full bg-gradient-to-r from-green-400/30 to-blue-400/30 animate-financial-glow blur-2xl"
            style={{
              left: `${20 + i * 20}%`,
              top: `${15 + i * 15}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: intensity === 'full' ? '8s' : intensity === 'medium' ? '10s' : '12s',
              width: intensity === 'full' ? '160px' : intensity === 'medium' ? '120px' : '80px',
              height: intensity === 'full' ? '160px' : intensity === 'medium' ? '120px' : '80px',
              opacity: intensity === 'full' ? 0.3 : intensity === 'medium' ? 0.2 : 0.1
            }}
          />
        ))}
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 via-transparent to-purple-900/5 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tl from-green-900/5 via-transparent to-pink-900/5 pointer-events-none" />
    </div>
  );
}