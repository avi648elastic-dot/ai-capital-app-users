'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { X } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  name: string;
  reputation: number;
  totalRealizedPnL: number;
  totalPositionsClosed: number;
  winRate: number;
  bestTrade: number;
  avatar?: string;
  isProfitable: boolean;
}

interface LeaderboardProps {
  isVisible: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

export default function Leaderboard({ isVisible, onClose, isMobile = false }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      fetchLeaderboard();
    }
  }, [isVisible]);

  // Add Escape key handler to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isVisible, onClose]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com';
      
      const response = await axios.get(`${apiUrl}/api/leaderboard?limit=20`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` },
        timeout: 10000
      });
      
      setLeaderboard(response.data.leaderboard);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{ touchAction: 'none', WebkitOverflowScrolling: 'touch', overflow: 'hidden' }}
    >
      <div className={`bg-slate-900 rounded-none sm:rounded-xl border-0 sm:border border-slate-700 shadow-2xl ${isMobile ? 'w-full h-full m-0' : 'w-full max-w-2xl max-w-[90vw] max-h-[85vh]'} overflow-hidden relative`}>
        {/* Header - Compact with always visible close */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Trading Leaderboard</h2>
              <p className="text-xs sm:text-sm text-slate-400">Top traders by realized P&L</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Link to Transaction History */}
            <a
              href="/transaction-history"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-slate-600 text-slate-200 hover:bg-slate-800 transition-colors"
              title="View your complete trading history"
            >
              📊 Trading History
            </a>
            {/* Close button - Normal size, always in view */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-full transition-colors active:scale-95 touch-manipulation flex-shrink-0"
              aria-label="Close Leaderboard"
              title="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Content - Compact */}
        <div className={`p-3 sm:p-4 overflow-y-auto ${isMobile ? 'h-[calc(100vh-150px)]' : 'max-h-[calc(85vh-120px)]'} min-h-0`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              <span className="ml-3 text-slate-400">Loading leaderboard...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 mb-2">❌</div>
              <p className="text-slate-400">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-2">📊</div>
              <p className="text-slate-400">No trading data available yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border transition-colors ${
                    entry.isProfitable 
                      ? 'bg-green-900/20 border-green-700/30 hover:bg-green-900/30' 
                      : 'bg-red-900/20 border-red-700/30 hover:bg-red-900/30'
                  }`}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      {entry.rank <= 3 ? (
                        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm ${
                          entry.rank === 1 ? 'bg-yellow-500' :
                          entry.rank === 2 ? 'bg-gray-400' :
                          'bg-orange-500'
                        }`}>
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                        </div>
                      ) : (
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                          {entry.rank}
                        </div>
                      )}
                    </div>

                    {/* Avatar & Name */}
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      {entry.avatar ? (
                        <img
                          src={entry.avatar}
                          alt={entry.name}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-600 object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs flex-shrink-0">
                          {entry.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white text-sm truncate">{entry.name}</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">
                          {entry.totalPositionsClosed} trades • {entry.winRate.toFixed(1)}% win
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className={`text-sm sm:text-base font-bold ${entry.isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                      ${entry.reputation.toFixed(2)}
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-400">
                      Best: ${entry.bestTrade.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Compact */}
        <div className="p-3 sm:p-4 border-t border-slate-700 bg-slate-800/50 flex-shrink-0">
          <p className="text-[10px] sm:text-xs text-slate-400 text-center">
            Rankings based on total realized P&L from closed positions. Close positions to build your reputation!
          </p>
          <div className="mt-2 text-center">
            <a
              href="/transaction-history"
              className="text-blue-400 hover:text-blue-300 text-[10px] sm:text-xs underline"
            >
              View Trading History →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
