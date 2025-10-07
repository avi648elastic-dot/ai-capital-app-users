'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { TrendingUp, Calendar, DollarSign, Target } from 'lucide-react';

export default function Performance() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      setPortfolio(response.data.portfolio || []);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformance = (stock: any, days: number) => {
    // Mock calculation - in real app, this would use historical data
    const baseReturn = Math.random() * 20 - 10; // -10% to +10%
    const volatility = Math.random() * 5 + 5; // 5-10%
    return {
      return: baseReturn,
      volatility,
      sharpe: baseReturn / volatility,
      maxDrawdown: Math.random() * 15 + 5, // 5-20%
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const timeframes = [
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '60d', label: '60 Days' },
    { id: '90d', label: '90 Days' },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Performance Analysis</h1>
          <p className="text-slate-400">Detailed performance metrics for your portfolio</p>
        </div>

        {/* Timeframe Selector */}
        <div className="mb-6">
          <div className="flex space-x-2 bg-slate-800 rounded-lg p-1 w-fit">
            {timeframes.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeframe === tf.id
                    ? 'bg-primary-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Return</p>
                <p className="text-2xl font-bold text-green-400">+12.5%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Volatility</p>
                <p className="text-2xl font-bold text-blue-400">15.3%</p>
              </div>
              <Target className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Sharpe Ratio</p>
                <p className="text-2xl font-bold text-purple-400">1.24</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Max Drawdown</p>
                <p className="text-2xl font-bold text-red-400">-8.2%</p>
              </div>
              <Calendar className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Individual Stock Performance */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Individual Stock Performance</h3>
          {portfolio.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No stocks in portfolio</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400">Stock</th>
                    <th className="text-right py-3 px-4 text-slate-400">Return</th>
                    <th className="text-right py-3 px-4 text-slate-400">Volatility</th>
                    <th className="text-right py-3 px-4 text-slate-400">Sharpe</th>
                    <th className="text-right py-3 px-4 text-slate-400">Max DD</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((stock, index) => {
                    const perf = calculatePerformance(stock, 30);
                    return (
                      <tr key={index} className="border-b border-slate-800">
                        <td className="py-3 px-4">
                          <div className="font-medium text-white">{stock.ticker}</div>
                          <div className="text-sm text-slate-400">{stock.shares} shares</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-medium ${perf.return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {perf.return >= 0 ? '+' : ''}{perf.return.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {perf.volatility.toFixed(2)}%
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {perf.sharpe.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-red-400">
                          -{perf.maxDrawdown.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
