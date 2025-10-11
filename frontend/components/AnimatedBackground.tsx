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

  // Stock symbols with clear markers
  const stockSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX', 'AMD', 'CRM', 'ADBE', 'PYPL', 'INTC', 'ORCL', 'CSCO', 'IBM', 'QCOM', 'AVGO'];

  // Exchange symbols
  const exchangeSymbols = ['NYSE', 'NASDAQ', 'S&P500', 'DOW', 'FTSE', 'DAX', 'NIKKEI', 'HANG SENG'];

  // Financial icons
  const financialIcons = ['$', '€', '¥', '£', '₿', '💎', '📈', '📊', '💰', '🏦', '💼', '📉'];

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

      {/* Beautiful Bubbles with Markers */}
      {[...Array(25)].map((_, i) => {
        const bubbleType = bubbleGradients[i % bubbleGradients.length];
        const pos = positions[`bubble-${i}`];
        if (!pos) return null;
        
        return (
          <div
            key={i}
            className={`absolute rounded-full ${bubbleType} animate-bubble shadow-lg border border-white/20`}
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              width: `${3 + (i % 3)}rem`, // 3rem, 4rem, 5rem
              height: `${3 + (i % 3)}rem`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${8 + (i % 4) * 2}s`,
              filter: 'blur(0px)',
              opacity: 0.8
            }}
          >
            {/* Marker inside bubble */}
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg">
              {i % 3 === 0 ? '$' : i % 3 === 1 ? '📈' : '💰'}
            </div>
          </div>
        );
      })}

      {/* Stock Symbols with Clear Text */}
      {stockSymbols.map((symbol, i) => {
        const pos = positions[`stock-${i}`];
        if (!pos) return null;
        
        const bgColor = theme === 'light' ? 'bg-blue-100/80' : 'bg-blue-900/80';
        const textColor = theme === 'light' ? 'text-blue-800' : 'text-blue-200';
        const borderColor = theme === 'light' ? 'border-blue-300' : 'border-blue-600';
        
        return (
          <div
            key={`stock-${i}`}
            className={`absolute ${bgColor} ${textColor} ${borderColor} border-2 rounded-lg px-2 py-1 text-xs font-bold animate-float shadow-lg backdrop-blur-sm`}
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${6 + (i % 3)}s`,
              opacity: 0.9
            }}
          >
            {symbol}
          </div>
        );
      })}

      {/* Exchange Symbols */}
      {exchangeSymbols.map((exchange, i) => {
        const pos = positions[`exchange-${i}`];
        if (!pos) return null;
        
        const bgColor = theme === 'light' ? 'bg-green-100/80' : 'bg-green-900/80';
        const textColor = theme === 'light' ? 'text-green-800' : 'text-green-200';
        const borderColor = theme === 'light' ? 'border-green-300' : 'border-green-600';
        
        return (
          <div
            key={`exchange-${i}`}
            className={`absolute ${bgColor} ${textColor} ${borderColor} border-2 rounded-lg px-2 py-1 text-xs font-bold animate-float-delayed shadow-lg backdrop-blur-sm`}
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${8 + (i % 2)}s`,
              opacity: 0.9
            }}
          >
            {exchange}
          </div>
        );
      })}

      {/* Financial Icons */}
      {financialIcons.map((icon, i) => {
        const pos = positions[`financial-${i}`];
        if (!pos) return null;
        
        const bgColor = theme === 'light' ? 'bg-purple-100/80' : 'bg-purple-900/80';
        const textColor = theme === 'light' ? 'text-purple-800' : 'text-purple-200';
        const borderColor = theme === 'light' ? 'border-purple-300' : 'border-purple-600';
        
        return (
          <div
            key={`financial-${i}`}
            className={`absolute ${bgColor} ${textColor} ${borderColor} border-2 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold animate-sparkle shadow-lg backdrop-blur-sm`}
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${4 + (i % 3)}s`,
              opacity: 0.9
            }}
          >
            {icon}
          </div>
        );
      })}

      {/* Market Data Streams */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={`stream-${i}`}
            className="absolute w-1 h-20 bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-data-stream opacity-60"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + i * 15}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: '15s'
            }}
          />
        ))}
      </div>

      {/* Glowing Orbs */}
      <div className="absolute inset-0">
        {[...Array(4)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-financial-glow blur-xl"
            style={{
              left: `${25 + i * 25}%`,
              top: `${20 + i * 20}%`,
              animationDelay: `${i * 1.5}s`,
              animationDuration: '6s'
            }}
          />
        ))}
      </div>

      {/* Price Ticker */}
      <div className="absolute top-10 left-0 right-0 overflow-hidden h-8 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 backdrop-blur-sm">
        <div className="flex animate-ticker text-sm font-mono text-blue-300 whitespace-nowrap">
          <span className="mx-8">AAPL $245.27 ↗️</span>
          <span className="mx-8">GOOGL $142.85 ↗️</span>
          <span className="mx-8">MSFT $378.91 ↗️</span>
          <span className="mx-8">TSLA $248.50 ↘️</span>
          <span className="mx-8">AMZN $155.20 ↗️</span>
          <span className="mx-8">META $498.30 ↗️</span>
          <span className="mx-8">NVDA $875.60 ↗️</span>
          <span className="mx-8">NFLX $485.90 ↘️</span>
        </div>
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 via-transparent to-purple-900/5 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tl from-green-900/5 via-transparent to-pink-900/5 pointer-events-none" />
    </div>
  );
}