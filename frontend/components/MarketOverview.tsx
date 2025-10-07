'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

type IndexItem = { symbol: string; price: number | null; thisMonthPercent?: number };

export default function MarketOverview() {
  const [data, setData] = useState<{ indexes: Record<string, IndexItem>; featured: IndexItem[]; updatedAt: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [tickers, setTickers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/markets/overview`);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (loading && !data) {
    return <div className="card p-6">Loading markets…</div>;
  }

  const fmt = (n?: number | null) => (n == null ? 'N/A' : `$${n.toLocaleString()}`);
  const pct = (n?: number) => (n == null ? '' : `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Markets Overview</h3>
        <div className="flex items-center space-x-3">
          {data?.updatedAt && <span className="text-xs text-slate-400">Updated {new Date(data.updatedAt).toLocaleTimeString()}</span>}
          {/* Customize button; actual gating done on backend */}
          <button
            onClick={() => {
              setTickers((data?.featured || []).map((f) => f.symbol));
              setEditing(true);
            }}
            className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
          >
            Customize
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['SPY','QQQ','DIA'].map((k) => {
          const item = data!.indexes[k];
          return (
            <div key={k} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50">
              <div className="text-slate-300 text-sm mb-1">{k}</div>
              <div className="text-white text-xl font-bold">{fmt(item?.price)}</div>
              <div className={`text-xs ${item?.thisMonthPercent! >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{pct(item?.thisMonthPercent)}</div>
            </div>
          );
        })}
        <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50">
          <div className="text-slate-300 text-sm mb-2">Featured Stocks</div>
          <div className="grid grid-cols-2 gap-3">
            {data!.featured.map((f) => (
              <div key={f.symbol} className="bg-slate-900/60 rounded p-3">
                <div className="text-slate-300 text-xs mb-1">{f.symbol}</div>
                <div className="text-white font-semibold">{fmt(f.price)}</div>
                <div className={`text-xs ${f.thisMonthPercent! >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{pct(f.thisMonthPercent)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {editing && (
        <div className="mt-4 border-t border-slate-700 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[0,1,2,3].map((i) => (
              <input
                key={i}
                value={tickers[i] || ''}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase();
                  const next = [...tickers];
                  next[i] = v;
                  setTickers(next);
                }}
                placeholder={`Ticker ${i+1}`}
                className="input-field"
              />
            ))}
          </div>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={async () => {
                try {
                  await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/markets/featured`,
                    { featuredTickers: tickers },
                    { headers: { Authorization: `Bearer ${Cookies.get('token')}` } }
                  );
                  setEditing(false);
                  load();
                } catch (e: any) {
                  alert(e?.response?.data?.message || 'Failed to save featured tickers');
                }
              }}
              className="btn-primary text-xs"
            >
              Save
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary text-xs">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}


