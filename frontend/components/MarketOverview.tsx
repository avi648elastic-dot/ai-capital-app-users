'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

type IndexItem = { symbol: string; price: number | null; thisMonthPercent?: number };

export default function MarketOverview() {
  const [data, setData] = useState<{ indexes: Record<string, IndexItem>; featured: IndexItem[]; updatedAt: string } | null>(null);
  // Remove editing functionality since Customize button is removed
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
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { symbol: 'SPY', name: 'S&P 500' },
          { symbol: 'QQQ', name: 'NASDAQ' },
          { symbol: 'DIA', name: 'DOW' }
        ].map(({ symbol, name }) => {
          const item = data!.indexes[symbol];
          return (
            <div key={symbol} className="rounded-xl p-4 border border-slate-700/50 bg-slate-900/60 shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-300 text-sm font-medium">{symbol}</div>
                  <div className="text-slate-400 text-xs">{name}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${item?.thisMonthPercent! >= 0 ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-900/40 text-red-300'}`}>{pct(item?.thisMonthPercent)}</span>
              </div>
              <div className="text-white text-2xl font-bold mt-1">{fmt(item?.price)}</div>
            </div>
          );
        })}
      </div>

      {/* Featured stocks: same tile style as indexes, 30% smaller, in a clean row */}
      <div className="mt-3 grid grid-cols-4 gap-4">
        {data!.featured.map((f) => {
          // Add company names for common stocks
          const getCompanyName = (symbol: string) => {
            const names: Record<string, string> = {
              'AAPL': 'Apple',
              'MSFT': 'Microsoft',
              'AMZN': 'Amazon',
              'TSLA': 'Tesla',
              'GOOGL': 'Google',
              'META': 'Meta',
              'NVDA': 'NVIDIA'
            };
            return names[symbol] || symbol;
          };
          
          return (
            <div key={f.symbol} className="rounded-xl p-3 border border-slate-700/50 bg-slate-900/60 shadow-inner scale-90 origin-top-left">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-300 text-sm font-medium">{f.symbol}</div>
                  <div className="text-slate-400 text-xs">{getCompanyName(f.symbol)}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${f.thisMonthPercent! >= 0 ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-900/40 text-red-300'}`}>{pct(f.thisMonthPercent)}</span>
              </div>
              <div className="text-white text-xl font-bold mt-1">{fmt(f.price)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


