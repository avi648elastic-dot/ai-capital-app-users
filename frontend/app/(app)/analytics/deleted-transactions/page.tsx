'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface TransactionHistoryItem {
  id: string;
  action: 'SELL' | 'BUY';
  ticker: string;
  shares: number;
  entry: number;
  exit: number;
  pnl: number;
  pnlPercent: number;
  date: string;
  portfolioId: string;
  reason: string;
  deletedBy?: string;
  deletedAt: string;
}

interface DeletedAuditItem {
  _id: string;
  transactionId?: string;
  ticker?: string;
  amount?: number;
  portfolioId?: string;
  reason?: string;
  deletedBy?: string;
  deletedAt: string;
  beforeSnapshot?: any;
}

interface Summary {
  count: number;
  totalAmount: number;
}

export default function DeletedTransactionsAuditPage() {
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistoryItem[]>([]);
  const [deletedItems, setDeletedItems] = useState<DeletedAuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'deleted'>('history');

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
        setTransactionHistory(historyRes.data.history || []);
        
        // Load deleted transactions audit
        const [listRes, sumRes] = await Promise.all([
          axios.get(`${apiUrl}/api/transactions/audit/deleted?limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiUrl}/api/transactions/audit/deleted/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setDeletedItems(listRes.data.items || []);
        setSummary(sumRes.data || null);
        setError(null);
      } catch (e: any) {
        console.error('Failed to load transaction data', e);
        setError(e?.response?.data?.message || 'Failed to load transaction data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Transaction History</h1>
      <p className="text-slate-400 mb-6">View your complete trading history and deleted transactions.</p>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          📊 Trading History ({transactionHistory.length})
        </button>
        <button
          onClick={() => setActiveTab('deleted')}
          className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === 'deleted'
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          🗑️ Deleted Transactions ({deletedItems.length})
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : activeTab === 'history' ? (
        <>
          {/* Transaction History Tab */}
          {transactionHistory.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-lg">
              <div className="text-slate-400 mb-2">📊</div>
              <p className="text-slate-400">No trading history found.</p>
              <p className="text-slate-500 text-sm mt-2">Close some positions to see your trading history here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-700">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-800/60 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Ticker</th>
                    <th className="px-4 py-3 text-left">Action</th>
                    <th className="px-4 py-3 text-left">Shares</th>
                    <th className="px-4 py-3 text-left">Entry Price</th>
                    <th className="px-4 py-3 text-left">Exit Price</th>
                    <th className="px-4 py-3 text-left">P&L</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionHistory.map((tx) => (
                    <tr key={tx.id} className="border-t border-slate-700 hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-slate-300">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-300 font-semibold">{tx.ticker}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          tx.action === 'SELL' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {tx.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{tx.shares}</td>
                      <td className="px-4 py-3 text-slate-300">${tx.entry.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-300">${tx.exit.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className={`font-semibold ${tx.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.pnl >= 0 ? '+' : ''}${tx.pnl.toFixed(2)}
                        </div>
                        <div className={`text-xs ${tx.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.pnlPercent >= 0 ? '+' : ''}{tx.pnlPercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{tx.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Deleted Transactions Tab */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/60">
                <div className="text-slate-400 text-sm">Total deletions</div>
                <div className="text-2xl font-semibold text-white">{summary.count}</div>
              </div>
              <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/60">
                <div className="text-slate-400 text-sm">Total amount</div>
                <div className="text-2xl font-semibold text-white">${summary.totalAmount?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
          )}

          {deletedItems.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-lg">
              <div className="text-slate-400 mb-2">🗑️</div>
              <p className="text-slate-400">No deleted transactions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-700">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-800/60 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Deleted At</th>
                    <th className="px-4 py-3 text-left">Ticker</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Portfolio</th>
                    <th className="px-4 py-3 text-left">Deleted By</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                    <th className="px-4 py-3 text-left">Snapshot</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedItems.map((it) => (
                    <tr key={it._id} className="border-t border-slate-700 hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-slate-300">{new Date(it.deletedAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-300">{it.ticker || '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{typeof it.amount === 'number' ? `$${it.amount.toFixed(2)}` : '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{it.portfolioId || '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{it.deletedBy || 'self'}</td>
                      <td className="px-4 py-3 text-slate-300">{it.reason || '-'}</td>
                      <td className="px-4 py-3">
                        {it.beforeSnapshot ? (
                          <details>
                            <summary className="cursor-pointer text-emerald-400">View</summary>
                            <pre className="mt-2 p-2 bg-slate-900/70 rounded text-xs text-slate-300 overflow-x-auto">
{JSON.stringify(it.beforeSnapshot, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}


