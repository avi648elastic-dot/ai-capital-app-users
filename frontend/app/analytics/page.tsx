'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { TrendingUp, BarChart3, PieChart, Activity, Building2, TrendingDown } from 'lucide-react';

export default function Analytics() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock sector data - in real app, this would come from API
  const sectorData = [
    { 
      sector: 'Technology', 
      percentage: 35.2, 
      value: 12500, 
      performance90D: 12.4,
      stocks: ['AAPL', 'MSFT', 'GOOGL'],
      color: 'bg-blue-500'
    },
    { 
      sector: 'Healthcare', 
      percentage: 22.8, 
      value: 8100, 
      performance90D: 8.7,
      stocks: ['JNJ', 'PFE'],
      color: 'bg-green-500'
    },
    { 
      sector: 'Financial Services', 
      percentage: 18.5, 
      value: 6600, 
      performance90D: -2.1,
      stocks: ['JPM', 'BAC'],
      color: 'bg-yellow-500'
    },
    { 
      sector: 'Consumer Discretionary', 
      percentage: 12.3, 
      value: 4400, 
      performance90D: 15.8,
      stocks: ['AMZN', 'TSLA'],
      color: 'bg-purple-500'
    },
    { 
      sector: 'Energy', 
      percentage: 6.7, 
      value: 2400, 
      performance90D: -5.2,
      stocks: ['XOM'],
      color: 'bg-red-500'
    },
    { 
      sector: 'Utilities', 
      percentage: 4.5, 
      value: 1600, 
      performance90D: 3.1,
      stocks: ['NEE'],
      color: 'bg-cyan-500'
    }
  ];

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-slate-400">Detailed analysis of your portfolio performance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Portfolio Overview */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Portfolio Allocation
            </h3>
            <div className="space-y-4">
              {portfolio.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No stocks in portfolio</p>
              ) : (
                portfolio.map((stock, index) => {
                  const value = stock.currentPrice * stock.shares;
                  const totalValue = portfolio.reduce((sum, s) => sum + (s.currentPrice * s.shares), 0);
                  const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                        <span className="text-white font-medium">{stock.ticker}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white">{percentage.toFixed(1)}%</div>
                        <div className="text-sm text-slate-400">${value.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sector Segmentation */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Sector Segmentation
            </h3>
            <div className="space-y-4">
              {sectorData.map((sector, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${sector.color}`}></div>
                      <span className="text-white font-medium">{sector.sector}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">{sector.percentage}%</div>
                      <div className="text-sm text-slate-400">${sector.value.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${sector.color}`}
                      style={{ width: `${sector.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Stocks: {sector.stocks.join(', ')}</span>
                    <div className={`flex items-center space-x-1 ${
                      sector.performance90D >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {sector.performance90D >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{sector.performance90D >= 0 ? '+' : ''}{sector.performance90D}%</span>
                      <span className="text-slate-500">90D</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Performance Metrics
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">+12.5%</div>
                  <div className="text-sm text-slate-400">30 Day Return</div>
                </div>
                <div className="text-center p-4 bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">+8.2%</div>
                  <div className="text-sm text-slate-400">60 Day Return</div>
                </div>
                <div className="text-center p-4 bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">15.3%</div>
                  <div className="text-sm text-slate-400">Volatility</div>
                </div>
                <div className="text-center p-4 bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-400">1.24</div>
                  <div className="text-sm text-slate-400">Sharpe Ratio</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sector Performance Summary */}
          <div className="lg:col-span-2 card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Sector Performance Summary (90 Days)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectorData.map((sector, index) => (
                <div key={index} className="bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${sector.color}`}></div>
                      <span className="text-white font-medium text-sm">{sector.sector}</span>
                    </div>
                    <div className={`text-sm font-semibold ${
                      sector.performance90D >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {sector.performance90D >= 0 ? '+' : ''}{sector.performance90D}%
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mb-2">
                    {sector.percentage}% of portfolio • ${sector.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">
                    Stocks: {sector.stocks.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Performance Chart */}
          <div className="lg:col-span-2 card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Stock Performance (60 Days)
            </h3>
            <div className="h-64 flex items-center justify-center bg-slate-800 rounded-lg">
              <div className="text-center">
                <Activity className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-400">Chart integration coming soon</p>
                <p className="text-sm text-slate-500">Google Finance API integration</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
