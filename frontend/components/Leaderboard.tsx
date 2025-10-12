'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-slate-900 rounded-xl border border-slate-700 shadow-2xl ${isMobile ? 'w-full max-w-sm' : 'w-full max-w-4xl'} max-h-[80vh] overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h2 className="text-xl font-bold text-white">Trading Leaderboard</h2>
              <p className="text-sm text-slate-400">Top traders by realized P&L</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
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
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    entry.isProfitable 
                      ? 'bg-green-900/20 border-green-700/30 hover:bg-green-900/30' 
                      : 'bg-red-900/20 border-red-700/30 hover:bg-red-900/30'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      {entry.rank <= 3 ? (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          entry.rank === 1 ? 'bg-yellow-500' :
                          entry.rank === 2 ? 'bg-gray-400' :
                          'bg-orange-500'
                        }`}>
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm">
                          {entry.rank}
                        </div>
                      )}
                    </div>

                    {/* Avatar & Name */}
                    <div className="flex items-center space-x-3">
                      {entry.avatar ? (
                        <img
                          src={entry.avatar}
                          alt={entry.name}
                          className="w-10 h-10 rounded-full border-2 border-slate-600"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
                          {entry.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-white">{entry.name}</div>
                        <div className="text-xs text-slate-400">
                          {entry.totalPositionsClosed} trades • {entry.winRate.toFixed(1)}% win rate
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className={`text-lg font-bold ${entry.isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                      ${entry.reputation.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-400">
                      Best: ${entry.bestTrade.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 bg-slate-800/50">
          <p className="text-xs text-slate-400 text-center">
            Rankings based on total realized P&L from closed positions. Close positions to build your reputation!
          </p>
        </div>
      </div>
    </div>
  );
}
