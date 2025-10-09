'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Bar, Area, AreaChart } from 'recharts';

interface PortfolioItem {
  _id: string;
  ticker: string;
  shares: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  date: string;
  notes?: string;
  action: 'BUY' | 'HOLD' | 'SELL';
  reason?: string;
  color?: string;
}

interface ChartsProps {
  portfolio: PortfolioItem[];
  portfolioPerformance?: any[];
  sectorPerformance?: any[];
  analyticsLoading?: boolean;
}

export default function Charts({ portfolio, portfolioPerformance, sectorPerformance, analyticsLoading }: ChartsProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [candlestickData, setCandlestickData] = useState<any[]>([]);

  useEffect(() => {
    if (portfolio.length === 0) return;

    // Use real analytics data if available, otherwise show current portfolio state
    if (portfolioPerformance && portfolioPerformance.length > 0) {
      console.log('📊 [CHARTS] Using real analytics data with', portfolioPerformance.length, 'data points');
      setChartData(portfolioPerformance);
    } else {
      console.log('⚠️ [CHARTS] No analytics data available, showing current portfolio state');
      
      // Create a simple current state data point instead of fake historical data
      const totalCost = portfolio.reduce((sum, item) => sum + (item.entryPrice * item.shares), 0);
      const totalValue = portfolio.reduce((sum, item) => sum + (item.currentPrice * item.shares), 0);
      const totalPnL = totalValue - totalCost;
      const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

      // Create current state data point
      const currentData = {
        date: new Date().toLocaleDateString(),
        fullDate: new Date(),
        value: totalValue,
        cost: totalCost,
        pnl: totalPnL,
        pnlPercent: totalPnLPercent,
        dailyChange: 0,
        dailyChangePercent: 0
      };

      setChartData([currentData]);
    }

    // Prepare candlestick-style data for individual stocks
    const candlestickData = portfolio.map((item) => {
      const cost = item.entryPrice * item.shares;
      const value = item.currentPrice * item.shares;
      const pnl = value - cost;
      const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;
      
      return {
        ticker: item.ticker,
        date: new Date(item.date).toLocaleDateString(),
        open: Number(cost.toFixed(2)),
        high: Number(Math.max(cost, value).toFixed(2)),
        low: Number(Math.min(cost, value).toFixed(2)),
        close: Number(value.toFixed(2)),
        volume: item.shares,
        pnl: Number(pnl.toFixed(2)),
        pnlPercent: Number(pnlPercent.toFixed(2)),
        action: item.action,
        color: pnl >= 0 ? '#22c55e' : '#ef4444'
      };
    });

    setCandlestickData(candlestickData);

    // Prepare pie chart data (portfolio allocation by ticker)
    const pieChartData = portfolio.map(item => {
      const value = item.currentPrice * item.shares;
      return {
        name: item.ticker,
        value: value,
        action: item.action,
      };
    });

    setPieData(pieChartData);
  }, [portfolio, portfolioPerformance]);

  const COLORS = {
    BUY: '#22c55e',
    HOLD: '#f59e0b',
    SELL: '#ef4444',
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-xl">
          <p className="text-white font-semibold mb-2">{`Date: ${label}`}</p>
          <div className="space-y-1">
            <p className="text-emerald-400 font-medium">{`Portfolio Value: $${data.value?.toLocaleString() || '0'}`}</p>
            <p className="text-blue-400">{`Total Cost: $${data.cost?.toLocaleString() || '0'}`}</p>
            <p className={`font-semibold ${data.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {`P&L: ${data.pnl >= 0 ? '+' : ''}$${data.pnl?.toLocaleString() || '0'} (${data.pnlPercent >= 0 ? '+' : ''}${data.pnlPercent?.toFixed(2) || '0'}%)`}
            </p>
            {data.ticker && (
              <p className="text-slate-300 text-sm">{`Latest: ${data.ticker}`}</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const CandlestickTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-xl">
          <p className="text-white font-semibold mb-2">{`${data.ticker} - ${label}`}</p>
          <div className="space-y-1">
            <p className="text-blue-400">{`Entry: $${data.open?.toLocaleString() || '0'}`}</p>
            <p className="text-emerald-400">{`Current: $${data.close?.toLocaleString() || '0'}`}</p>
            <p className="text-purple-400">{`High: $${data.high?.toLocaleString() || '0'}`}</p>
            <p className="text-orange-400">{`Low: $${data.low?.toLocaleString() || '0'}`}</p>
            <p className={`font-semibold ${data.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {`P&L: ${data.pnl >= 0 ? '+' : ''}$${data.pnl?.toLocaleString() || '0'} (${data.pnlPercent >= 0 ? '+' : ''}${data.pnlPercent?.toFixed(2) || '0'}%)`}
            </p>
            <p className="text-slate-300 text-sm">{`Shares: ${data.volume}`}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (portfolio.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-300 mb-2">No data to display</h3>
        <p className="text-gray-400">Add some stocks to see portfolio charts and analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Enhanced Portfolio Value Over Time - Mobile Optimized */}
      <div className="card p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
          <h3 className="text-lg sm:text-xl font-bold text-white">Portfolio Performance Over Time</h3>
          <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              {analyticsLoading && (
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-500"></div>
              )}
              <span className="text-xs text-slate-400">
                {portfolioPerformance && portfolioPerformance.length > 0 
                  ? '📊 Real-time historical data' 
                  : '⚠️ Using portfolio entry data'
                }
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-400 rounded-full"></div>
              <span className="text-slate-300 text-xs sm:text-sm">Portfolio Value</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full"></div>
              <span className="text-slate-300 text-xs sm:text-sm">Total Cost</span>
            </div>
          </div>
        </div>
        <div className="h-64 sm:h-80 lg:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                fontSize={10}
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={10}
                tick={{ fill: '#9ca3af' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Portfolio value line */}
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 3 }}
              />
              {/* Total cost line */}
              <Line 
                type="monotone" 
                dataKey="cost" 
                stroke="#3b82f6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
              {/* P&L area */}
              <Area
                type="monotone"
                dataKey="pnl"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.1}
                strokeWidth={1}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Individual Stock Performance (Candlestick-style) - Mobile Optimized */}
      <div className="card p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
          <h3 className="text-lg sm:text-xl font-bold text-white">Individual Stock Performance</h3>
          <span className="text-xs text-slate-400">
            {portfolioPerformance && portfolioPerformance.length > 0 
              ? '📊 Real-time data' 
              : '📈 Entry vs Current prices'
            }
          </span>
        </div>
        <div className="h-48 sm:h-64 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={candlestickData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="ticker" 
                stroke="#9ca3af"
                fontSize={10}
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={10}
                tick={{ fill: '#9ca3af' }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip content={<CandlestickTooltip />} />
              {/* Entry price bars */}
              <Bar 
                dataKey="open" 
                fill="#3b82f6" 
                opacity={0.7}
                name="Entry Price"
              />
              {/* Current price bars */}
              <Bar 
                dataKey="close" 
                fill="#10b981" 
                opacity={0.8}
                name="Current Price"
              />
              {/* P&L line */}
              <Line 
                type="monotone" 
                dataKey="pnl" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                name="P&L"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Portfolio Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Portfolio Allocation</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.action as keyof typeof COLORS] || '#6b7280'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Action Distribution</h3>
          <div className="space-y-4">
            {['BUY', 'HOLD', 'SELL'].map((action) => {
              const count = portfolio.filter(item => item.action === action).length;
              const percentage = portfolio.length > 0 ? (count / portfolio.length) * 100 : 0;
              
              return (
                <div key={action} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[action as keyof typeof COLORS] }}
                    />
                    <span className="text-gray-300 font-medium">{action}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">{count}</div>
                    <div className="text-gray-400 text-sm">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
