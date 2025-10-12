'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

type IndexItem = { symbol: string; price: number | null; thisMonthPercent?: number };

export default function MarketOverview() {
  const [data, setData] = useState<{ indexes: Record<string, IndexItem>; featured: IndexItem[]; updatedAt: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  
  const load = async () => {
    try {
      console.log('🔍 [MARKET OVERVIEW] Fetching markets data...');
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/markets/overview`);
      console.log('🔍 [MARKET OVERVIEW] Received data:', res.data);
      setData(res.data);
      setLastUpdated(new Date());
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
  
  // Format relative time (e.g., "2 minutes ago")
  const getRelativeTime = (date: Date | null) => {
    if (!date) return '';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 120) return '1 minute ago';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 7200) return '1 hour ago';
    return `${Math.floor(seconds / 3600)} hours ago`;
  };

  if (loading && !data) {
    return <div className="card p-6">Loading markets…</div>;
  }

  const fmt = (n?: number | null) => (n == null ? 'N/A' : `$${n.toLocaleString()}`);
  const pct = (n?: number) => (n == null ? '' : `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`);

  return (
    <div className="card p-3 sm:p-4 [data-theme='light']:bg-white [data-theme='light']:border-gray-200 bg-gradient-to-br from-slate-900/80 to-slate-800/80 market-overview">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex flex-col">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-wide [data-theme='light']:text-gray-900 [data-theme='light']:!text-gray-900 flex items-center space-x-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>Markets</span>
          </h3>
          {lastUpdated && (
            <span className="text-xs text-slate-400 [data-theme='light']:text-gray-500 mt-1 ml-4">
              Last updated: {getRelativeTime(lastUpdated)}
            </span>
          )}
        </div>
        {data?.updatedAt && <span className="text-xs text-slate-400 [data-theme='light']:text-gray-600 [data-theme='light']:!text-gray-600">{new Date(data.updatedAt).toLocaleTimeString()}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {[
          { symbol: 'SPY', name: 'S&P 500' },
          { symbol: 'QQQ', name: 'NASDAQ' },
          { symbol: 'DIA', name: 'DOW' }
        ].map(({ symbol, name }) => {
          const item = data!.indexes[symbol];
          return (
                <div key={symbol} className="rounded-lg p-3 sm:p-4 border border-slate-700/50 bg-slate-900/60 shadow-inner [data-theme='light']:bg-white [data-theme='light']:border-gray-200 [data-theme='light']:shadow-sm [data-theme='light']:!bg-white [data-theme='light']:!border-gray-200 hover:border-emerald-500/30 transition-all duration-200">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-slate-300 text-sm sm:text-base font-bold [data-theme='light']:text-gray-900 [data-theme='light']:!text-gray-900">{symbol}</div>
                        <div className="text-slate-400 text-xs [data-theme='light']:text-gray-600 [data-theme='light']:!text-gray-600">{name}</div>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${item?.thisMonthPercent! >= 0 ? 'bg-emerald-900/40 text-emerald-300 [data-theme="light"]:bg-emerald-100 [data-theme="light"]:text-emerald-700' : 'bg-red-900/40 text-red-300 [data-theme="light"]:bg-red-100 [data-theme="light"]:text-red-700'}`}>{pct(item?.thisMonthPercent)}</span>
                    </div>
                    <div className="text-white text-base sm:text-lg font-bold [data-theme='light']:text-gray-900 [data-theme='light']:!text-gray-900">{fmt(item?.price)}</div>
                  </div>
                </div>
          );
        })}
      </div>

      {/* Featured stocks: mobile-optimized */}
      <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-4">
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
              <div key={f.symbol} className="rounded-lg p-3 sm:p-4 border border-slate-700/50 bg-slate-900/60 shadow-inner [data-theme='light']:bg-white [data-theme='light']:border-gray-200 [data-theme='light']:shadow-sm [data-theme='light']:!bg-white [data-theme='light']:!border-gray-200 hover:border-blue-500/30 transition-all duration-200">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-slate-300 text-sm sm:text-base font-bold [data-theme='light']:text-gray-900 [data-theme='light']:!text-gray-900">{f.symbol}</div>
                      <div className="text-slate-400 text-xs [data-theme='light']:text-gray-600 [data-theme='light']:!text-gray-600">{getCompanyName(f.symbol)}</div>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${f.thisMonthPercent! >= 0 ? 'bg-emerald-900/40 text-emerald-300 [data-theme="light"]:bg-emerald-100 [data-theme="light"]:text-emerald-700' : 'bg-red-900/40 text-red-300 [data-theme="light"]:bg-red-100 [data-theme="light"]:text-red-700'}`}>{pct(f.thisMonthPercent)}</span>
                  </div>
                  <div className="text-white text-base sm:text-lg font-bold [data-theme='light']:text-gray-900 [data-theme='light']:!text-gray-900">{fmt(f.price)}</div>
                </div>
              </div>
          );
        })}
      </div>
    </div>
  );
}


