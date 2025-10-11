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

      {/* Enhanced Diagonal Trend Lines */}
      {[...Array(intensity === 'full' ? 12 : intensity === 'medium' ? 8 : 5)].map((_, i) => {
        const pos = positions[`trend-${i}`] || { left: Math.random() * 90, top: Math.random() * 90 };
        const isUpTrend = i % 3 !== 0; // 2/3 up trends, 1/3 down trends
        const angle = isUpTrend ? (20 + Math.random() * 25) : -(20 + Math.random() * 25);
        const color = isUpTrend ? '#10b981' : '#ef4444';
        const length = 80 + Math.random() * 60;
        
        const opacity = intensity === 'full' ? 0.6 : 
                       intensity === 'medium' ? 0.5 : 0.4;
        
        const animationSpeed = `${6 + Math.random() * 3}s`;
        
        return (
          <div
            key={`trend-${i}`}
            className="absolute"
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              width: `${length}px`,
              height: '3px',
              background: `linear-gradient(90deg, ${color} 0%, ${color}80 50%, transparent 100%)`,
              opacity: opacity,
              transform: `rotate(${angle}deg)`,
              transformOrigin: 'left center',
              animation: `trendPulse ${animationSpeed} ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
              borderRadius: '2px',
              boxShadow: `0 0 8px ${color}60`,
            }}
          />
        );
      })}

      {/* Realistic Candlestick Chart Patterns */}
      {[...Array(intensity === 'full' ? 6 : intensity === 'medium' ? 4 : 3)].map((_, i) => {
        const pos = positions[`chart-${i}`] || { left: Math.random() * 80, top: Math.random() * 80 };
        const chartType = i % 3; // 0: Cup & Handle, 1: Head & Shoulders, 2: Ascending Triangle
        
        const opacity = intensity === 'full' ? 0.5 : 
                       intensity === 'medium' ? 0.4 : 0.3;
        
        const animationSpeed = `${8 + Math.random() * 4}s`;
        
        return (
          <div
            key={`chart-${i}`}
            className="absolute"
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              opacity: opacity,
              animation: `chartPulse ${animationSpeed} ease-in-out infinite`,
              animationDelay: `${i * 1.2}s`,
            }}
          >
            {chartType === 0 && (
              // Cup & Handle Pattern
              <div className="relative">
                {/* Cup */}
                {[...Array(5)].map((_, j) => {
                  const height = j === 2 ? 25 : j === 1 || j === 3 ? 15 : 8;
                  const color = j <= 2 ? '#ef4444' : '#10b981';
                  return (
                    <div
                      key={j}
                      className="absolute"
                      style={{
                        left: `${j * 8}px`,
                        bottom: '0px',
                        width: '6px',
                        height: `${height}px`,
                        background: color,
                        borderRadius: '3px',
                        boxShadow: `0 0 8px ${color}60`,
                      }}
                    />
                  );
                })}
                {/* Handle */}
                {[...Array(3)].map((_, j) => {
                  const height = j === 1 ? 12 : 8;
                  return (
                    <div
                      key={j + 5}
                      className="absolute"
                      style={{
                        left: `${40 + j * 6}px`,
                        bottom: '0px',
                        width: '4px',
                        height: `${height}px`,
                        background: '#ef4444',
                        borderRadius: '2px',
                        boxShadow: '0 0 6px #ef444460',
                      }}
                    />
                  );
                })}
              </div>
            )}
            
            {chartType === 1 && (
              // Head & Shoulders Pattern
              <div className="relative">
                {[...Array(7)].map((_, j) => {
                  let height;
                  if (j === 3) height = 35; // Head
                  else if (j === 1 || j === 5) height = 20; // Shoulders
                  else height = 12; // Others
                  
                  const color = j === 3 ? '#ef4444' : j === 1 || j === 5 ? '#ef4444' : '#10b981';
                  return (
                    <div
                      key={j}
                      className="absolute"
                      style={{
                        left: `${j * 7}px`,
                        bottom: '0px',
                        width: '5px',
                        height: `${height}px`,
                        background: color,
                        borderRadius: '2px',
                        boxShadow: `0 0 6px ${color}60`,
                      }}
                    />
                  );
                })}
              </div>
            )}
            
            {chartType === 2 && (
              // Ascending Triangle Pattern
              <div className="relative">
                {[...Array(6)].map((_, j) => {
                  const height = 15 + (j * 3); // Increasing height
                  const color = '#10b981';
                  return (
                    <div
                      key={j}
                      className="absolute"
                      style={{
                        left: `${j * 8}px`,
                        bottom: '0px',
                        width: '6px',
                        height: `${height}px`,
                        background: color,
                        borderRadius: '3px',
                        boxShadow: `0 0 8px ${color}60`,
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Enhanced Lightning Trend Indicators */}
      {[...Array(intensity === 'full' ? 8 : intensity === 'medium' ? 6 : 4)].map((_, i) => {
        const pos = positions[`lightning-${i}`] || { left: Math.random() * 90, top: Math.random() * 90 };
        const isUpLightning = Math.random() > 0.5;
        const color = isUpLightning ? '#10b981' : '#ef4444';
        
        const opacity = intensity === 'full' ? 0.7 : 
                       intensity === 'medium' ? 0.6 : 0.5;
        
        const animationSpeed = `${3 + Math.random() * 2}s`;
        
        return (
          <div
            key={`lightning-${i}`}
            className="absolute"
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              width: '24px',
              height: '24px',
              opacity: opacity,
              animation: `lightningFlash ${animationSpeed} ease-in-out infinite`,
              animationDelay: `${i * 0.6}s`,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L8 10H12L10 22L16 14H12L14 2Z"
                fill={color}
                style={{
                  filter: `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color}80)`,
                }}
              />
            </svg>
          </div>
        );
      })}

      {/* Professional Subtle Bubbles */}
      {[...Array(intensity === 'full' ? 20 : intensity === 'medium' ? 12 : 8)].map((_, i) => {
        const bubbleType = bubbleGradients[i % bubbleGradients.length];
        const pos = positions[`bubble-${i}`];
        if (!pos) return null;
        
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
            key={i}
            className={`absolute rounded-full ${bubbleType} animate-bubble`}
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
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
        const pos = positions[`stock-${i}`];
        if (!pos) return null;
        
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
              left: `${pos.left}%`,
              top: `${pos.top}%`,
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
        const pos = positions[`financial-${i}`];
        if (!pos) return null;
        
        const isUpTrend = icon === '▲' || icon === '●' || icon === '◆' || icon === '◈' || icon === '◉';
        const isDownTrend = icon === '▼' || icon === '■' || icon === '◊' || icon === '◇';
        
        const bgColor = isUpTrend 
          ? (theme === 'light' ? 'bg-green-100/80' : 'bg-green-900/60')
          : isDownTrend 
          ? (theme === 'light' ? 'bg-red-100/80' : 'bg-red-900/60')
          : (theme === 'light' ? 'bg-slate-100/80' : 'bg-slate-800/60');
          
        const borderColor = isUpTrend 
          ? (theme === 'light' ? 'border-green-400' : 'border-green-500')
          : isDownTrend 
          ? (theme === 'light' ? 'border-red-400' : 'border-red-500')
          : (theme === 'light' ? 'border-slate-300' : 'border-slate-600');
          
        const textColor = isUpTrend 
          ? 'text-green-600'
          : isDownTrend 
          ? 'text-red-600'
          : (theme === 'light' ? 'text-slate-600' : 'text-slate-400');
        
        const size = intensity === 'full' ? 'w-6 h-6' : 
                    intensity === 'medium' ? 'w-5 h-5' : 'w-4 h-4';
        
        const opacity = intensity === 'full' ? 0.8 : 
                       intensity === 'medium' ? 0.6 : 0.4;
        
        return (
          <div
            key={`financial-${i}`}
            className={`absolute ${bgColor} ${borderColor} ${textColor} border rounded-full ${size} flex items-center justify-center text-xs font-bold animate-float shadow-sm backdrop-blur-sm`}
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${6 + (i % 2) * 2}s`,
              opacity: opacity,
              boxShadow: isUpTrend 
                ? '0 2px 8px rgba(34, 197, 94, 0.2)'
                : isDownTrend 
                ? '0 2px 8px rgba(239, 68, 68, 0.2)'
                : '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
          >
            {icon}
          </div>
        );
      })}

      {/* Professional Market Trend Arrows */}
      {(intensity === 'full' ? marketIndices : intensity === 'medium' ? marketIndices.slice(0, 6) : marketIndices.slice(0, 4)).map((index, i) => {
        const pos = positions[`exchange-${i}`];
        if (!pos) return null;
        
        const isUpArrow = index === '↗';
        const isDownArrow = index === '↘';
        const isSideways = index === '→';
        
        const bgColor = isUpArrow 
          ? (theme === 'light' ? 'bg-green-50/90' : 'bg-green-900/70')
          : isDownArrow 
          ? (theme === 'light' ? 'bg-red-50/90' : 'bg-red-900/70')
          : (theme === 'light' ? 'bg-slate-50/90' : 'bg-slate-800/70');
          
        const borderColor = isUpArrow 
          ? (theme === 'light' ? 'border-green-300' : 'border-green-600')
          : isDownArrow 
          ? (theme === 'light' ? 'border-red-300' : 'border-red-600')
          : (theme === 'light' ? 'border-slate-300' : 'border-slate-600');
          
        const textColor = isUpArrow 
          ? 'text-green-600'
          : isDownArrow 
          ? 'text-red-600'
          : (theme === 'light' ? 'text-slate-600' : 'text-slate-400');
        
        const size = intensity === 'full' ? 'w-5 h-5' : 
                    intensity === 'medium' ? 'w-4 h-4' : 'w-3 h-3';
        
        const opacity = intensity === 'full' ? 0.8 : 
                       intensity === 'medium' ? 0.6 : 0.4;
        
        return (
          <div
            key={`index-${i}`}
            className={`absolute ${bgColor} ${borderColor} ${textColor} border rounded-full ${size} flex items-center justify-center text-xs font-bold animate-float-delayed shadow-sm backdrop-blur-sm`}
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${8 + (i % 2) * 2}s`,
              opacity: opacity,
              boxShadow: isUpArrow 
                ? '0 2px 6px rgba(34, 197, 94, 0.2)'
                : isDownArrow 
                ? '0 2px 6px rgba(239, 68, 68, 0.2)'
                : '0 2px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            {index}
          </div>
        );
      })}

      {/* Professional Data Flow Lines */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(intensity === 'full' ? 6 : intensity === 'medium' ? 4 : 3)].map((_, i) => {
          const isGreen = i % 3 === 0; // Every third line is green (positive trend)
          const isRed = i % 3 === 1;   // Every third line is red (negative trend)
          const isNeutral = i % 3 === 2; // Every third line is neutral
          
          const gradientColor = isGreen 
            ? 'from-transparent via-green-400/40 to-transparent'
            : isRed 
            ? 'from-transparent via-red-400/40 to-transparent'
            : 'from-transparent via-slate-400/40 to-transparent';
            
          const shadowColor = isGreen 
            ? 'rgba(34, 197, 94, 0.3)'
            : isRed 
            ? 'rgba(239, 68, 68, 0.3)'
            : 'rgba(100, 116, 139, 0.3)';
          
          return (
            <div
              key={`stream-${i}`}
              className={`absolute w-1 h-20 bg-gradient-to-b ${gradientColor} animate-data-stream`}
              style={{
                left: `${20 + i * 15}%`,
                top: `${10 + i * 20}%`,
                animationDelay: `${i * 2}s`,
                animationDuration: intensity === 'full' ? '15s' : intensity === 'medium' ? '20s' : '25s',
                opacity: intensity === 'full' ? 0.6 : intensity === 'medium' ? 0.4 : 0.3,
                boxShadow: `0 0 8px ${shadowColor}`
              }}
            />
          );
        })}
      </div>

      {/* Professional Ambient Glow */}
      <div className="absolute inset-0">
        {[...Array(intensity === 'full' ? 4 : intensity === 'medium' ? 3 : 2)].map((_, i) => {
          const isGreen = i % 2 === 0;
          const gradientColor = isGreen 
            ? 'from-green-400/20 to-blue-400/20'
            : 'from-slate-400/20 to-gray-400/20';
          
          return (
            <div
              key={`orb-${i}`}
              className={`absolute rounded-full bg-gradient-to-r ${gradientColor} animate-financial-glow blur-3xl`}
              style={{
                left: `${25 + i * 30}%`,
                top: `${20 + i * 25}%`,
                animationDelay: `${i * 3}s`,
                animationDuration: intensity === 'full' ? '20s' : intensity === 'medium' ? '25s' : '30s',
                width: intensity === 'full' ? '120px' : intensity === 'medium' ? '80px' : '60px',
                height: intensity === 'full' ? '120px' : intensity === 'medium' ? '80px' : '60px',
                opacity: intensity === 'full' ? 0.15 : intensity === 'medium' ? 0.1 : 0.05
              }}
            />
          );
        })}
      </div>

      {/* Professional Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/3 via-transparent to-slate-800/3 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tl from-green-900/2 via-transparent to-blue-900/2 pointer-events-none" />
    </div>
  );
}