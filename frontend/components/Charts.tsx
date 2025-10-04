'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
}

export default function Charts({ portfolio }: ChartsProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  useEffect(() => {
    if (portfolio.length === 0) return;

    // Prepare line chart data (portfolio value over time)
    const sortedPortfolio = [...portfolio].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let cumulativeValue = 0;
    const lineData = sortedPortfolio.map((item, index) => {
      const value = item.currentPrice * item.shares;
      cumulativeValue += value;
      return {
        date: new Date(item.date).toLocaleDateString(),
        value: cumulativeValue,
        ticker: item.ticker,
      };
    });

    setChartData(lineData);

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
  }, [portfolio]);

  const COLORS = {
    BUY: '#22c55e',
    HOLD: '#f59e0b',
    SELL: '#ef4444',
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
          <p className="text-white font-medium">{`Date: ${label}`}</p>
          <p className="text-success-400">{`Value: $${payload[0].value.toLocaleString()}`}</p>
          {payload[0].payload.ticker && (
            <p className="text-gray-300">{`Ticker: ${payload[0].payload.ticker}`}</p>
          )}
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
    <div className="space-y-8">
      {/* Portfolio Value Over Time */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Portfolio Value Over Time</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#0ea5e9" 
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#0ea5e9', strokeWidth: 2 }}
              />
            </LineChart>
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
