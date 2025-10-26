'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface TransactionHistoryItem {
  ticker: string;
  shares: number;
  entryPrice: number;
  exitPrice: number;
  realizedPnL: number;
  realizedPnLPercent: number;
  entryDate: string;
  exitDate: string;
  portfolioType: string;
  exitReason: string;
  isProfitable: boolean;
}

export default function TransactionHistoryPage() {
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPnL, setTotalPnL] = useState(0);
  const [totalTrades, setTotalTrades] = useState(0);
  const [winRate, setWinRate] = useState(0);
  const [startDate, setStartDate] = useState<Date | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const token = Cookies.get('token');
        
        // Load transaction history (closed positions)
        const historyRes = await axios.get(`${apiUrl}/api/leaderboard/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const history = historyRes.data.history || [];
        setTransactionHistory(history);
        
        // Calculate summary stats
        const totalPnLValue = history.reduce((sum: number, tx: TransactionHistoryItem) => sum + (tx.realizedPnL || 0), 0);
        const totalTradesCount = history.length;
        const winningTrades = history.filter((tx: TransactionHistoryItem) => (tx.realizedPnL || 0) > 0).length;
        const winRateValue = totalTradesCount > 0 ? (winningTrades / totalTradesCount) * 100 : 0;
        
        // Find the earliest entry date
        const sortedHistory = [...history].sort((a, b) => 
          new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
        );
        const earliestDate = sortedHistory.length > 0 ? new Date(sortedHistory[0].entryDate) : null;
        
        setTotalPnL(totalPnLValue);
        setTotalTrades(totalTradesCount);
        setWinRate(winRateValue);
        setStartDate(earliestDate);
        
        setError(null);
      } catch (e: any) {
        console.error('Failed to load transaction history', e);
        setError(e?.response?.data?.message || 'Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Transaction History</h1>
                <p className="text-sm text-slate-400">Your complete trading history</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Summary Stats */}
        {!loading && transactionHistory.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-6 rounded-lg border border-slate-700 bg-slate-900/60">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-slate-400 text-sm">Total P&L</div>
                  <div className={`text-2xl font-semibold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 rounded-lg border border-slate-700 bg-slate-900/60">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm">Total Trades</div>
                    <div className="text-2xl font-semibold text-white">{totalTrades}</div>
                  </div>
                </div>
                {startDate && (
                  <div className="pt-4 border-t border-slate-700">
                    <div className="text-slate-400 text-xs mb-1">Portfolio Start Date</div>
                    <div className="text-sm font-medium text-white">
                      {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 rounded-lg border border-slate-700 bg-slate-900/60">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-slate-400 text-sm">Win Rate</div>
                  <div className="text-2xl font-semibold text-white">{winRate.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full w-8 h-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-slate-400">Loading...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-2">❌</div>
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : transactionHistory.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/50 rounded-lg">
            <div className="text-slate-400 mb-2 text-6xl">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">No Trading History Found</h3>
            <p className="text-slate-400 mb-4">You haven't closed any positions yet.</p>
            <p className="text-slate-500 text-sm">Close some positions to see your trading history here.</p>
            <Link
              href="/dashboard"
              className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900/50">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800/60 text-slate-300">
                  <tr>
                    <th className="px-6 py-4 text-left">Exit Date</th>
                    <th className="px-6 py-4 text-left">Ticker</th>
                    <th className="px-6 py-4 text-left">Portfolio</th>
                    <th className="px-6 py-4 text-left">Shares</th>
                    <th className="px-6 py-4 text-left">Entry Price</th>
                    <th className="px-6 py-4 text-left">Exit Price</th>
                    <th className="px-6 py-4 text-left">P&L</th>
                    <th className="px-6 py-4 text-left">Reason</th>
                  </tr>
              </thead>
              <tbody>
                {transactionHistory.map((tx, index) => (
                  <tr key={`${tx.ticker}-${index}`} className="border-t border-slate-700 hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-slate-300">
                      {tx.exitDate ? new Date(tx.exitDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-white">{tx.ticker}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        tx.portfolioType === 'solid' 
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                          : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      }`}>
                        {tx.portfolioType || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{tx.shares || 0}</td>
                    <td className="px-6 py-4 text-slate-300">${(tx.entryPrice || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-300">${(tx.exitPrice || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className={`font-semibold ${(tx.realizedPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(tx.realizedPnL || 0) >= 0 ? '+' : ''}${(tx.realizedPnL || 0).toFixed(2)}
                      </div>
                      <div className={`text-xs ${(tx.realizedPnLPercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(tx.realizedPnLPercent || 0) >= 0 ? '+' : ''}{(tx.realizedPnLPercent || 0).toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{tx.exitReason || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
