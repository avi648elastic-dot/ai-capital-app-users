'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function AnimatedBackground() {
  const [isClient, setIsClient] = useState(false);
  const [positions, setPositions] = useState<{[key: string]: {left: number, top: number}}>({});
  const { theme } = useTheme();

  useEffect(() => {
    setIsClient(true);
    
    // Generate stable positions for animations
    const generatePositions = () => {
      const newPositions: {[key: string]: {left: number, top: number}} = {};
      
      // Generate positions for stock symbols
      ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX', 'BTC', 'ETH', 'SPY', 'QQQ', 'IWM', 'VIX', 'GOLD', 'OIL', 'EUR/USD', 'GBP/USD'].forEach(symbol => {
        newPositions[symbol] = {
          left: Math.random() * 100,
          top: Math.random() * 100
        };
      });
      
      // Generate positions for exchanges
      ['NYSE', 'NASDAQ', 'TSX', 'LSE', 'HKEX', 'TSE', 'SSE', 'BSE'].forEach(exchange => {
        newPositions[`exchange-${exchange}`] = {
          left: Math.random() * 100,
          top: Math.random() * 100
        };
      });
      
      // Generate positions for bubbles
      for (let i = 0; i < 25; i++) {
        newPositions[`bubble-${i}`] = {
          left: Math.random() * 100,
          top: Math.random() * 100
        };
      }
      
      setPositions(newPositions);
    };
    
    generatePositions();
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
      {/* Circuit Board Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
      
      {/* Floating Stock Symbols & Market Markers - SHARP AND CLEAR */}
      {['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX', 'BTC', 'ETH', 'SPY', 'QQQ', 'IWM', 'VIX', 'GOLD', 'OIL', 'EUR/USD', 'GBP/USD'].map((symbol, index) => {
        const pos = positions[symbol];
        if (!pos) return null;
        
        const bgColor = theme === 'light' ? 'bg-white/90' : 'bg-slate-800/80';
        const textColor = theme === 'light' ? 'text-slate-800' : 'text-slate-200';
        const borderColor = theme === 'light' ? 'border-blue-500/70' : 'border-blue-400/70';
        
        return (
          <div
            key={symbol}
            className={`absolute text-xs font-mono ${textColor} opacity-90 animate-float-enhanced ${bgColor} px-2 py-1 rounded backdrop-blur-sm border ${borderColor} shadow-lg`}
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              animationDelay: `${index * 0.5}s`,
              animationDuration: `${10 + (index % 5) * 2}s`,
              boxShadow: theme === 'light' 
                ? '0 2px 8px rgba(59, 130, 246, 0.2)' 
                : '0 2px 8px rgba(59, 130, 246, 0.4)',
              zIndex: 1
            }}
          >
            {symbol}
          </div>
        );
      })}

      {/* Market Exchange Symbols */}
      {['NYSE', 'NASDAQ', 'TSX', 'LSE', 'HKEX', 'TSE', 'SSE', 'BSE'].map((exchange, index) => (
        <div
          key={`exchange-${exchange}`}
          className="absolute text-xs font-bold text-emerald-400/60 opacity-40 animate-float bg-slate-900/40 px-2 py-1 rounded-full border border-emerald-500/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${index * 0.7}s`,
            animationDuration: `${12 + Math.random() * 8}s`,
            fontSize: '10px'
          }}
        >
          {exchange}
        </div>
      ))}

      {/* Financial Market Icons */}
      {['📊', '📈', '📉', '💰', '💎', '🏦', '🏛️', '📋', '🔍', '⚡', '🎯', '📱', '💼', '🔄', '📌'].map((icon, index) => (
        <div
          key={`icon-${icon}`}
          className="absolute text-lg opacity-30 animate-float-delayed"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${index * 0.3}s`,
            animationDuration: `${8 + Math.random() * 6}s`,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}
        >
          {icon}
        </div>
      ))}

      {/* Market Data Bubbles - SMALL, SHARP, CLEAR WITH MARKERS */}
      {[...Array(20)].map((_, i) => {
        const isPositive = Math.random() > 0.5;
        const percentage = (Math.random() * 20).toFixed(1);
        const price = (Math.random() * 500 + 50).toFixed(2);
        
        return (
          <div
            key={`market-data-${i}`}
            className={`absolute text-xs font-mono animate-bubble-drift bg-slate-800/40 px-2 py-1 rounded-full border backdrop-blur-sm ${
              isPositive 
                ? 'text-emerald-400/70 border-emerald-500/30' 
                : 'text-red-400/70 border-red-500/30'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 8}s`,
              boxShadow: `0 2px 6px ${isPositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
            }}
          >
            {isPositive ? '+' : '-'}{percentage}% ${price}
          </div>
        );
      })}

      {/* Crypto & Forex Markers */}
      {['BTC', 'ETH', 'ADA', 'SOL', 'MATIC', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'].map((symbol, index) => (
        <div
          key={`crypto-${symbol}`}
          className="absolute text-xs font-bold text-purple-400/60 opacity-45 animate-float bg-slate-900/50 px-2 py-1 rounded-lg border border-purple-500/25"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${index * 0.6}s`,
            animationDuration: `${9 + Math.random() * 7}s`,
            fontSize: '11px',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)'
          }}
        >
          {symbol}
        </div>
      ))}

      {/* Market Sector Markers */}
      {['TECH', 'HEALTH', 'ENERGY', 'FINANCE', 'REAL', 'CONSUMER', 'INDUSTRIAL', 'UTILITIES'].map((sector, index) => (
        <div
          key={`sector-${sector}`}
          className="absolute text-xs font-bold text-orange-400/50 opacity-35 animate-float bg-slate-900/60 px-2 py-1 rounded-lg border border-orange-500/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${index * 0.8}s`,
            animationDuration: `${11 + Math.random() * 9}s`,
            fontSize: '10px',
            textTransform: 'uppercase'
          }}
        >
          {sector}
        </div>
      ))}

      {/* Floating Financial Elements */}
      <div className="absolute top-20 left-10 animate-float text-4xl opacity-20">
        📈
      </div>
      <div className="absolute top-32 right-20 animate-float-delayed text-3xl opacity-15">
        💰
      </div>
      <div className="absolute bottom-40 left-20 animate-float-slow text-5xl opacity-10">
        🏦
      </div>
      <div className="absolute bottom-20 right-10 animate-float text-4xl opacity-20">
        📊
      </div>
      <div className="absolute top-60 left-1/2 animate-float-delayed text-3xl opacity-15">
        💎
      </div>
      <div className="absolute bottom-60 right-1/3 animate-float-slow text-4xl opacity-10">
        🚀
      </div>

      {/* Additional Market Icons */}
      <div className="absolute top-1/4 right-1/4 animate-float text-2xl opacity-25">
        🎯
      </div>
      <div className="absolute bottom-1/3 left-1/3 animate-float-delayed text-3xl opacity-20">
        ⚡
      </div>
      <div className="absolute top-2/3 right-1/3 animate-float-slow text-2xl opacity-15">
        🔍
      </div>
      <div className="absolute bottom-1/4 left-1/4 animate-float text-3xl opacity-25">
        📋
      </div>

      {/* Animated Bubbles - SMALL AND CLEAR */}
      {[...Array(25)].map((_, i) => {
        const bubbleTypes = theme === 'light' ? [
          'bg-gradient-to-r from-blue-500/60 to-cyan-500/40',
          'bg-gradient-to-r from-purple-500/60 to-pink-500/40', 
          'bg-gradient-to-r from-emerald-500/60 to-green-500/40',
          'bg-gradient-to-r from-orange-500/60 to-red-500/40',
          'bg-gradient-to-r from-indigo-500/60 to-blue-500/40'
        ] : [
          'bg-gradient-to-r from-blue-500/60 to-cyan-500/40',
          'bg-gradient-to-r from-purple-500/60 to-pink-500/40', 
          'bg-gradient-to-r from-emerald-500/60 to-green-500/40',
          'bg-gradient-to-r from-orange-500/60 to-red-500/40',
          'bg-gradient-to-r from-indigo-500/60 to-blue-500/40'
        ];
        const bubbleType = bubbleTypes[i % bubbleTypes.length];
        const pos = positions[`bubble-${i}`];
        if (!pos) return null;
        
        return (
          <div
            key={i}
            className={`absolute rounded-full ${bubbleType} animate-bubble shadow-lg border border-white/20`}
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              width: `${3 + (i % 3)}rem`, // Larger sizes: 3rem, 4rem, 5rem
              height: `${3 + (i % 3)}rem`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${8 + (i % 4) * 2}s`, // Faster animation
              filter: 'blur(0px)', // No blur for maximum visibility
              zIndex: 1,
              opacity: 0.8 // Higher opacity
            }}
          />
        );
      })}

      {/* Mobile-optimized bubbles */}
      {[...Array(8)].map((_, i) => {
        const bubbleTypes = [
          'bg-gradient-to-r from-blue-500/20 to-cyan-500/15',
          'bg-gradient-to-r from-purple-500/20 to-pink-500/15'
        ];
        const bubbleType = bubbleTypes[i % bubbleTypes.length];
        
        return (
          <div
            key={`mobile-bubble-${i}`}
            className={`absolute rounded-full ${bubbleType} animate-bubble md:hidden`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}rem`,
              height: `${Math.random() * 3 + 1}rem`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 5}s`,
              filter: 'blur(0.3px)'
            }}
          />
        );
      })}

      {/* Floating Particles */}
      {[...Array(30)].map((_, i) => (
        <div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-white/40 rounded-full animate-ping"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 2}s`
          }}
        />
      ))}

      {/* Mobile particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`mobile-particle-${i}`}
          className="absolute w-1 h-1 bg-white/30 rounded-full animate-ping md:hidden"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 1}s`
          }}
        />
      ))}

      {/* Glowing Orbs */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`orb-${i}`}
          className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 6 + 3}rem`, // Smaller orbs
            height: `${Math.random() * 6 + 3}rem`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${20 + Math.random() * 10}s`,
            filter: 'blur(1px)', // Less blur
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
          }}
        />
      ))}

      {/* Small Drifting Bubbles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={`drift-${i}`}
          className="absolute rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 animate-bubble-drift"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 0.5}rem`, // Very small bubbles
            height: `${Math.random() * 2 + 0.5}rem`,
            animationDelay: `${Math.random() * 12}s`,
            animationDuration: `${10 + Math.random() * 8}s`,
            filter: 'blur(0.3px)' // Sharp
          }}
        />
      ))}

      {/* Large Floating Circles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={`circle-${i}`}
          className="absolute rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-float-slow border border-purple-500/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 8 + 5}rem`, // Smaller circles
            height: `${Math.random() * 8 + 5}rem`,
            animationDelay: `${Math.random() * 15}s`,
            animationDuration: `${25 + Math.random() * 15}s`,
            filter: 'blur(2px)'
          }}
        />
      ))}

      {/* Price Tickers */}
      <div className="absolute top-10 left-0 w-full overflow-hidden">
        <div className="flex animate-ticker">
          {[
            'AAPL +2.5%', 'GOOGL -1.2%', 'MSFT +0.8%', 'TSLA +5.3%', 
            'AMZN -0.5%', 'META +3.1%', 'NVDA +4.2%', 'NFLX -2.1%'
          ].map((ticker, index) => (
            <span key={index} className="text-xs font-mono text-slate-400 whitespace-nowrap mx-8">
              {ticker}
            </span>
          ))}
        </div>
      </div>

      {/* Data Stream Lines */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent animate-data-stream"></div>
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent animate-data-stream" style={{animationDelay: '5s'}}></div>
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent animate-data-stream" style={{animationDelay: '10s'}}></div>
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)
          `
        }}
      />
    </div>
  );
}
