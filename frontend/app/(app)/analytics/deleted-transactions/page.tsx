'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

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
  const [items, setItems] = useState<DeletedAuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const token = Cookies.get('token');
        const [listRes, sumRes] = await Promise.all([
          axios.get(`${apiUrl}/api/transactions/audit/deleted?limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiUrl}/api/transactions/audit/deleted/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setItems(listRes.data.items || []);
        setSummary(sumRes.data || null);
        setError(null);
      } catch (e: any) {
        console.error('Failed to load deleted transactions audit', e);
        setError(e?.response?.data?.message || 'Failed to load audit data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Deleted Transactions Audit</h1>
      <p className="text-slate-400 mb-6">Review all deleted transactions and totals.</p>

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

      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-slate-400">No deleted transactions found.</div>
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
              {items.map((it) => (
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
    </div>
  );
}


