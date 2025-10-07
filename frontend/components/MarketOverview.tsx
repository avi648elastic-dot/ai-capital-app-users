'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

type IndexItem = { symbol: string; price: number | null; thisMonthPercent?: number };

export default function MarketOverview({ canCustomize = false }: { canCustomize?: boolean }) {
  const [data, setData] = useState<{ indexes: Record<string, IndexItem>; featured: IndexItem[]; updatedAt: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [tickers, setTickers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try {
      console.log('🔍 [MARKET OVERVIEW] Fetching markets data...');
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/markets/overview`);
      console.log('🔍 [MARKET OVERVIEW] Received data:', res.data);
      setData(res.data);
    } catch (error) {
      console.error('❌ [MARKET OVERVIEW] Error fetching data:', error);
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
    <div className="card p-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-white tracking-wide">Markets Overview</h3>
        <div className="flex items-center space-x-3">
          {data?.updatedAt && <span className="text-xs text-slate-400">Updated {new Date(data.updatedAt).toLocaleTimeString()}</span>}
          {canCustomize && (
          <button
            onClick={() => {
              setTickers((data?.featured || []).map((f) => f.symbol));
              setEditing(true);
            }}
            className="text-xs px-3 py-1.5 rounded bg-emerald-600/80 hover:bg-emerald-600 text-white shadow"
          >
            Customize
          </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {['SPY','QQQ','DIA','NYA'].map((k) => {
          const item = data!.indexes[k];
          return (
            <div key={k} className="rounded-xl p-4 border border-slate-700/50 bg-slate-900/60 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="text-slate-300 text-sm font-medium">{k}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${item?.thisMonthPercent! >= 0 ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-900/40 text-red-300'}`}>{pct(item?.thisMonthPercent)}</span>
              </div>
              <div className="text-white text-2xl font-bold mt-1">{fmt(item?.price)}</div>
            </div>
          );
        })}
      </div>

      {/* Featured stocks: same tile style as indexes, 30% smaller, in a clean row */}
      <div className="mt-3 grid grid-cols-4 gap-4">
        {data!.featured.map((f) => (
          <div key={f.symbol} className="rounded-xl p-3 border border-slate-700/50 bg-slate-900/60 shadow-inner scale-90 origin-top-left">
            <div className="flex items-center justify-between">
              <div className="text-slate-300 text-sm font-medium">{f.symbol}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${f.thisMonthPercent! >= 0 ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-900/40 text-red-300'}`}>{pct(f.thisMonthPercent)}</span>
            </div>
            <div className="text-white text-xl font-bold mt-1">{fmt(f.price)}</div>
          </div>
        ))}
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


