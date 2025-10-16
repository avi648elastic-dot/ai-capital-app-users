'use client';

import { useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Shield, Edit, Trash2, Eye } from 'lucide-react';

interface PortfolioItem {
  _id: string;
  ticker: string;
  shares: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  action: 'BUY' | 'HOLD' | 'SELL';
  reason?: string;
  notes?: string;
  portfolioType: 'solid' | 'risky' | 'imported';
  portfolioId: string;
  portfolioName?: string;
  date: string;
  color?: string;
}

interface PortfolioCardSwipeableProps {
  item: PortfolioItem;
  onUpdate: (id: string, updates: Partial<PortfolioItem>) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export default function PortfolioCardSwipeable({ 
  item, 
  onUpdate, 
  onDelete, 
  onView 
}: PortfolioCardSwipeableProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const calculatePnL = () => {
    const pnl = item.shares * (item.currentPrice - item.entryPrice);
    const pnlPercent = ((item.currentPrice - item.entryPrice) / item.entryPrice) * 100;
    return { pnl, pnlPercent };
  };

  const { pnl, pnlPercent } = calculatePnL();
  const isProfit = pnl >= 0;

  // Swipe gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    
    // Only allow left swipe (positive diff)
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 120)); // Max swipe distance
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    if (swipeOffset > 60) {
      setIsSwipeOpen(true);
      setSwipeOffset(120);
    } else {
      setIsSwipeOpen(false);
      setSwipeOffset(0);
    }
    
    setIsDragging(false);
  };

  // Close swipe on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsSwipeOpen(false);
        setSwipeOffset(0);
      }
    };

    if (isSwipeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSwipeOpen]);

  // Haptic feedback
  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  return (
    <div 
      ref={cardRef}
      className="relative overflow-hidden bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200"
      style={{ transform: `translateX(-${swipeOffset}px)` }}
    >
      {/* Main Card Content */}
      <div
        className="relative z-10 bg-slate-800/50 backdrop-blur-sm"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                item.portfolioType === 'solid' ? 'bg-blue-500/20' : 'bg-orange-500/20'
              }`}>
                <span className="text-lg font-bold text-white">
                  {item.ticker}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{item.ticker}</h3>
                <p className="text-xs text-slate-400">
                  {item.shares} shares • {item.portfolioType}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-lg font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                ${item.currentPrice.toFixed(2)}
              </div>
              <div className={`text-sm ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                {isProfit ? '+' : ''}{pnlPercent.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Price Information */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Entry Price</p>
              <p className="text-sm font-medium text-white">${item.entryPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">P&L</p>
              <p className={`text-sm font-medium ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                {isProfit ? '+' : ''}${pnl.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Stop Loss & Take Profit */}
          {(item.stopLoss || item.takeProfit) && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {item.stopLoss && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Shield className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400 font-medium">Stop Loss</span>
                  </div>
                  <p className="text-sm font-semibold text-red-400">${item.stopLoss.toFixed(2)}</p>
                </div>
              )}
              {item.takeProfit && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Target className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">Take Profit</span>
                  </div>
                  <p className="text-sm font-semibold text-green-400">${item.takeProfit.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {/* Action & Notes */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                item.action === 'BUY' ? 'bg-green-500/20 text-green-400' :
                item.action === 'SELL' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {item.action}
              </span>
              {item.reason && (
                <span className="text-xs text-slate-400 truncate max-w-32">
                  {item.reason}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              {isProfit ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
            </div>
          </div>

          {/* Swipe Indicator */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500">
            <div className="w-1 h-8 bg-slate-600 rounded-full opacity-50"></div>
          </div>
        </div>
      </div>

      {/* Swipe Actions */}
      <div className="absolute right-0 top-0 bottom-0 w-30 flex">
        <button
          onClick={() => {
            triggerHaptic();
            onView(item._id);
            setIsSwipeOpen(false);
            setSwipeOffset(0);
          }}
          className="w-20 bg-blue-600/80 hover:bg-blue-600 flex items-center justify-center text-white transition-all active:scale-95"
        >
          <Eye className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => {
            triggerHaptic();
            onUpdate(item._id, {});
            setIsSwipeOpen(false);
            setSwipeOffset(0);
          }}
          className="w-20 bg-yellow-600/80 hover:bg-yellow-600 flex items-center justify-center text-white transition-all active:scale-95"
        >
          <Edit className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => {
            triggerHaptic();
            onDelete(item._id);
            setIsSwipeOpen(false);
            setSwipeOffset(0);
          }}
          className="w-20 bg-red-600/80 hover:bg-red-600 flex items-center justify-center text-white transition-all active:scale-95"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Swipe Hint */}
      {!isSwipeOpen && swipeOffset === 0 && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 opacity-30">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
            <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
            <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}
