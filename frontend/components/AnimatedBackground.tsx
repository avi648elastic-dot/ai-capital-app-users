'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function AnimatedBackground() {
  const [isClient, setIsClient] = useState(false);
  const [positions, setPositions] = useState<Record<string, { left: number; top: number }>>({});
  const { theme } = useTheme();

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

  // Game-like stock symbols with up/down indicators
  const stockSymbols = ['↗️', '↘️', '↗️', '↘️', '↗️', '↘️', '↗️', '↘️', '↗️', '↘️', '↗️', '↘️', '↗️', '↘️', '↗️', '↘️', '↗️', '↘️'];

  // Simple financial icons (no text)
  const financialIcons = ['💎', '💰', '🏦', '💼', '🎯', '⚡', '🔥', '⭐', '🌟', '💫', '✨', '🎪'];

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

      {/* Crystal Clear Bubbles with Game-like Presence */}
      {[...Array(30)].map((_, i) => {
        const bubbleType = bubbleGradients[i % bubbleGradients.length];
        const pos = positions[`bubble-${i}`];
        if (!pos) return null;
        
        return (
          <div
            key={i}
            className={`absolute rounded-full ${bubbleType} animate-bubble`}
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              width: `${4 + (i % 4)}rem`, // 4rem, 5rem, 6rem, 7rem
              height: `${4 + (i % 4)}rem`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${6 + (i % 3) * 2}s`,
              filter: 'blur(0px)',
              opacity: 0.9,
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.3),
                0 4px 16px rgba(0, 0, 0, 0.2),
                inset 0 2px 4px rgba(255, 255, 255, 0.3),
                inset 0 -2px 4px rgba(0, 0, 0, 0.1)
              `,
              border: '2px solid rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(2px)'
            }}
          />
        );
      })}

      {/* Game-like Stock Direction Indicators */}
      {stockSymbols.map((direction, i) => {
        const pos = positions[`stock-${i}`];
        if (!pos) return null;
        
        const isUp = direction === '↗️';
        const bgColor = isUp 
          ? (theme === 'light' ? 'bg-green-100/90' : 'bg-green-900/90')
          : (theme === 'light' ? 'bg-red-100/90' : 'bg-red-900/90');
        const borderColor = isUp 
          ? (theme === 'light' ? 'border-green-400' : 'border-green-500')
          : (theme === 'light' ? 'border-red-400' : 'border-red-500');
        
        return (
          <div
            key={`stock-${i}`}
            className={`absolute ${bgColor} ${borderColor} border-2 rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold ${isUp ? 'animate-stock-up' : 'animate-stock-down'} shadow-2xl backdrop-blur-sm`}
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${3 + (i % 2)}s`,
              opacity: 0.95,
              boxShadow: isUp 
                ? '0 4px 20px rgba(34, 197, 94, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
                : '0 4px 20px rgba(239, 68, 68, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
            }}
          >
            {direction}
          </div>
        );
      })}

      {/* Game-like Financial Icons */}
      {financialIcons.map((icon, i) => {
        const pos = positions[`financial-${i}`];
        if (!pos) return null;
        
        const bgColor = theme === 'light' ? 'bg-yellow-100/90' : 'bg-yellow-900/90';
        const borderColor = theme === 'light' ? 'border-yellow-400' : 'border-yellow-500';
        
        return (
          <div
            key={`financial-${i}`}
            className={`absolute ${bgColor} ${borderColor} border-2 rounded-full w-10 h-10 flex items-center justify-center text-lg animate-sparkle shadow-2xl backdrop-blur-sm`}
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${3 + (i % 2)}s`,
              opacity: 0.95,
              boxShadow: '0 4px 20px rgba(234, 179, 8, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
            }}
          >
            {icon}
          </div>
        );
      })}

      {/* Enhanced Market Data Streams */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={`stream-${i}`}
            className="absolute w-2 h-24 bg-gradient-to-b from-transparent via-blue-400/60 to-transparent animate-data-stream opacity-70"
            style={{
              left: `${15 + i * 12}%`,
              top: `${5 + i * 12}%`,
              animationDelay: `${i * 1.5}s`,
              animationDuration: '12s',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
            }}
          />
        ))}
      </div>

      {/* Enhanced Glowing Orbs */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 animate-financial-glow blur-2xl"
            style={{
              left: `${20 + i * 20}%`,
              top: `${15 + i * 15}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: '8s'
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