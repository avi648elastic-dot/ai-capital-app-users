'use client';

import React, { useEffect, useState } from 'react';

interface AnimatedBackgroundProps {
  intensity?: 'low' | 'medium' | 'high';
  showMarketData?: boolean;
  showBubbles?: boolean;
  showParticles?: boolean;
}

export default function AnimatedBackground({
  intensity = 'medium',
  showMarketData = true,
  showBubbles = true,
  showParticles = true
}: AnimatedBackgroundProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render on server-side to prevent hydration issues
  if (!isClient) {
    return null;
  }

  // Intensity settings
  const getIntensitySettings = () => {
    switch (intensity) {
      case 'low':
        return {
          bubbleCount: 8,
          particleCount: 10,
          marketSymbols: 6,
          exchanges: 4,
          icons: 8
        };
      case 'high':
        return {
          bubbleCount: 30,
          particleCount: 40,
          marketSymbols: 18,
          exchanges: 8,
          icons: 15
        };
      default: // medium
        return {
          bubbleCount: 15,
          particleCount: 20,
          marketSymbols: 12,
          exchanges: 6,
          icons: 12
        };
    }
  };

  const settings = getIntensitySettings();

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Circuit Board Pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Market Data Elements */}
      {showMarketData && (
        <>
          {/* Floating Stock Symbols */}
          {[
            'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX', 
            'BTC', 'ETH', 'SPY', 'QQQ', 'IWM', 'VIX', 'GOLD', 'OIL', 'EUR/USD', 'GBP/USD'
          ].slice(0, settings.marketSymbols).map((symbol, index) => (
            <div
              key={symbol}
              className="absolute text-xs font-mono text-slate-400/40 opacity-30 animate-float-enhanced bg-slate-800/20 px-2 py-1 rounded backdrop-blur-sm border border-blue-500/20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${index * 0.5}s`,
                animationDuration: `${10 + Math.random() * 10}s`,
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
              }}
            >
              {symbol}
            </div>
          ))}

          {/* Market Exchange Symbols */}
          {['NYSE', 'NASDAQ', 'TSX', 'LSE', 'HKEX', 'TSE', 'SSE', 'BSE'].slice(0, settings.exchanges).map((exchange, index) => (
            <div
              key={`exchange-${exchange}`}
              className="absolute text-xs font-bold text-emerald-400/30 opacity-20 animate-float bg-slate-900/20 px-2 py-1 rounded-full border border-emerald-500/10"
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
          {['📊', '📈', '📉', '💰', '💎', '🏦', '🏛️', '📋', '🔍', '⚡', '🎯', '📱', '💼', '🔄', '📌'].slice(0, settings.icons).map((icon, index) => (
            <div
              key={`icon-${icon}`}
              className="absolute text-lg opacity-15 animate-float-delayed"
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

          {/* Market Data Bubbles */}
          {[...Array(Math.floor(settings.bubbleCount / 2))].map((_, i) => {
            const isPositive = Math.random() > 0.5;
            const percentage = (Math.random() * 20).toFixed(1);
            const price = (Math.random() * 500 + 50).toFixed(2);
            
            return (
              <div
                key={`market-data-${i}`}
                className={`absolute text-xs font-mono animate-bubble-drift bg-slate-800/20 px-2 py-1 rounded-full border backdrop-blur-sm ${
                  isPositive 
                    ? 'text-emerald-400/40 border-emerald-500/15' 
                    : 'text-red-400/40 border-red-500/15'
                }`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${10 + Math.random() * 8}s`,
                  boxShadow: `0 2px 6px ${isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`
                }}
              >
                {isPositive ? '+' : '-'}{percentage}% ${price}
              </div>
            );
          })}

          {/* Crypto & Forex Markers */}
          {['BTC', 'ETH', 'ADA', 'SOL', 'MATIC', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'].slice(0, Math.floor(settings.marketSymbols / 2)).map((symbol, index) => (
            <div
              key={`crypto-${symbol}`}
              className="absolute text-xs font-bold text-purple-400/30 opacity-25 animate-float bg-slate-900/30 px-2 py-1 rounded-lg border border-purple-500/15"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${index * 0.6}s`,
                animationDuration: `${9 + Math.random() * 7}s`,
                fontSize: '11px',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.1)'
              }}
            >
              {symbol}
            </div>
          ))}
        </>
      )}

      {/* Animated Bubbles */}
      {showBubbles && (
        <>
          {/* Main Bubbles */}
          {[...Array(settings.bubbleCount)].map((_, i) => {
            const bubbleTypes = [
              'bg-gradient-to-r from-blue-500/20 to-cyan-500/10',
              'bg-gradient-to-r from-purple-500/20 to-pink-500/10', 
              'bg-gradient-to-r from-emerald-500/20 to-green-500/10',
              'bg-gradient-to-r from-orange-500/20 to-red-500/10',
              'bg-gradient-to-r from-indigo-500/20 to-blue-500/10'
            ];
            const bubbleType = bubbleTypes[i % bubbleTypes.length];
            
            return (
              <div
                key={`bubble-${i}`}
                className={`absolute rounded-full ${bubbleType} animate-bubble shadow-lg`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${Math.random() * 6 + 2}rem`,
                  height: `${Math.random() * 6 + 2}rem`,
                  animationDelay: `${Math.random() * 15}s`,
                  animationDuration: `${12 + Math.random() * 8}s`,
                  filter: 'blur(1px)'
                }}
              />
            );
          })}

          {/* Glowing Orbs */}
          {[...Array(Math.floor(settings.bubbleCount / 2))].map((_, i) => (
            <div
              key={`orb-${i}`}
              className="absolute rounded-full bg-gradient-to-r from-blue-400/10 to-purple-400/10 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 8 + 4}rem`,
                height: `${Math.random() * 8 + 4}rem`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${20 + Math.random() * 10}s`,
                filter: 'blur(2px)',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)'
              }}
            />
          ))}

          {/* Small Drifting Bubbles */}
          {[...Array(Math.floor(settings.bubbleCount / 1.5))].map((_, i) => (
            <div
              key={`drift-${i}`}
              className="absolute rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 animate-bubble-drift"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 3 + 1}rem`,
                height: `${Math.random() * 3 + 1}rem`,
                animationDelay: `${Math.random() * 12}s`,
                animationDuration: `${10 + Math.random() * 8}s`,
                filter: 'blur(0.5px)'
              }}
            />
          ))}
        </>
      )}

      {/* Floating Particles */}
      {showParticles && (
        <>
          {/* Main Particles */}
          {[...Array(settings.particleCount)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}

          {/* Secondary Particles */}
          {[...Array(Math.floor(settings.particleCount / 2))].map((_, i) => (
            <div
              key={`particle-2-${i}`}
              className="absolute w-0.5 h-0.5 bg-blue-400/30 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 1}s`
              }}
            />
          ))}
        </>
      )}

      {/* Data Stream Lines */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-data-stream"></div>
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent animate-data-stream" style={{animationDelay: '5s'}}></div>
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent animate-data-stream" style={{animationDelay: '10s'}}></div>
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/20 via-slate-900/10 to-slate-950/20"></div>
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          background: `
            radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
          `
        }}
      />
    </div>
  );
}
