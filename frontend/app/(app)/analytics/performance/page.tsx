export const dynamic = 'force-dynamic';
export const revalidate = 0;
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { TrendingUp, Activity, Target, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StockData {
  ticker: string;
  shares: number;
  entryPrice: number;
  currentPrice: number;
}

interface PerformanceMetrics {
  totalReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  topPrice: number;
  currentPrice: number;
}

interface PortfolioMetrics {
  totalReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  currentValue: number;
  totalStocks: number;
  dataPoints: number;
}

export default function Performance() {
  const [portfolio, setPortfolio] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [timeframe, setTimeframe] = useState('30d');
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics | null>(null);
  const [stockMetrics, setStockMetrics] = useState<Record<string, PerformanceMetrics>>({});
  const [dataSource, setDataSource] = useState<string>('');
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/');
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  useEffect(() => {
    if (portfolio.length > 0) {
      calculateRealPerformanceMetrics();
    }
  }, [portfolio, timeframe]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      console.log('🔍 [PERFORMANCE] Fetching portfolio data...');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      
      console.log('📊 [PERFORMANCE] Portfolio response:', response.data);
      const portfolioData = response.data.portfolio || [];
      console.log('📊 [PERFORMANCE] Portfolio data:', portfolioData);
      setPortfolio(portfolioData);
    } catch (error) {
      console.error('❌ [PERFORMANCE] Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRealPerformanceMetrics = async () => {
    if (portfolio.length === 0) {
      console.log('⚠️ [PERFORMANCE] No portfolio data available for calculations');
      return;
    }
    
    setCalculating(true);
    try {
      const days = parseInt(timeframe.replace('d', ''));
      console.log(`🔍 [PERFORMANCE] Calculating real metrics for ${days} days with ${portfolio.length} stocks`);
      console.log('📊 [PERFORMANCE] Portfolio tickers:', portfolio.map(s => s.ticker));
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/performance?days=${days}`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` },
        timeout: 30000 // 30 second timeout for calculations
      });

      console.log('📊 [PERFORMANCE] Received real performance data:', response.data);
      console.log('📊 [PERFORMANCE] Debug info:', response.data.debug);
      
      if (response.data.portfolioMetrics) {
        console.log('✅ [PERFORMANCE] Portfolio metrics received:', response.data.portfolioMetrics);
        setPortfolioMetrics(response.data.portfolioMetrics);
      } else {
        console.warn('⚠️ [PERFORMANCE] No portfolio metrics in response');
        console.warn('⚠️ [PERFORMANCE] Response data:', response.data);
      }
      
      if (response.data.stockMetrics && Object.keys(response.data.stockMetrics).length > 0) {
        console.log('✅ [PERFORMANCE] Stock metrics received:', Object.keys(response.data.stockMetrics));
        setStockMetrics(response.data.stockMetrics);
      } else {
        console.warn('⚠️ [PERFORMANCE] No stock metrics in response');
        console.warn('⚠️ [PERFORMANCE] Stock metrics data:', response.data.stockMetrics);
      }
      
      setDataSource(response.data.dataSource || 'Google Finance API');
      
    } catch (error) {
      console.error('❌ [PERFORMANCE] Error calculating metrics:', error);
      console.error('❌ [PERFORMANCE] Error details:', error instanceof Error ? error.message : 'Unknown error');
      
      // Show error message to user
      alert(`Performance calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Check browser console for details.`);
      
      // Reset to empty state on error
      setPortfolioMetrics(null);
      setStockMetrics({});
      setDataSource('');
    } finally {
      setCalculating(false);
    }
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatNumber = (value: number) => {
    return value.toFixed(2);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading performance data...</p>
        </div>
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
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Performance Analysis</h1>
          <p className="text-slate-400">Real-time performance metrics calculated using 90-day Google Finance data</p>
          <div className="flex items-center justify-between mt-2">
            {calculating && (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
                <span className="text-sm text-primary-400">Calculating real metrics...</span>
              </div>
            )}
            {portfolio.length > 0 && !calculating && (
              <button
                onClick={() => calculateRealPerformanceMetrics()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {Object.keys(stockMetrics).length === 0 ? '🔄 Calculate Performance' : '🔄 Refresh Data'}
              </button>
            )}
          </div>
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

        {/* Portfolio Performance Overview */}
        {portfolioMetrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Return</p>
                  <p className={`text-2xl font-bold ${portfolioMetrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercentage(portfolioMetrics.totalReturn)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatCurrency(portfolioMetrics.currentValue)}
                  </p>
                </div>
                <TrendingUp className={`w-8 h-8 ${portfolioMetrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Volatility</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {formatPercentage(portfolioMetrics.volatility)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Annualized Volatility
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Sharpe Ratio</p>
                  <p className={`text-2xl font-bold ${portfolioMetrics.sharpeRatio >= 1 ? 'text-green-400' : portfolioMetrics.sharpeRatio >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {formatNumber(portfolioMetrics.sharpeRatio)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Risk-adjusted</p>
                </div>
                <Target className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Max Drawdown</p>
                  <p className="text-2xl font-bold text-red-400">
                    -{formatPercentage(portfolioMetrics.maxDrawdown)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Peak to trough</p>
                </div>
                <BarChart3 className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </div>
        )}

        {/* Individual Stock Performance */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">
              Individual Stock Performance ({timeframe})
            </h3>
            {dataSource && (
              <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                📊 {dataSource}
              </span>
            )}
          </div>
          
          {portfolio.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No stocks in portfolio</p>
          ) : Object.keys(stockMetrics).length === 0 ? (
            <div className="text-slate-400 text-center py-8">
              <p>{calculating ? 'Calculating performance metrics...' : 'No performance data available'}</p>
              <p className="text-xs mt-2">Portfolio has {portfolio.length} stocks: {portfolio.map(s => s.ticker).join(', ')}</p>
              <p className="text-xs mt-1">Check browser console for debug info</p>
              <div className="mt-4 p-3 bg-slate-800 rounded-lg text-left text-xs">
                <p className="text-yellow-400 mb-2">🔍 Debug Information:</p>
                <p>• Portfolio stocks: {portfolio.length}</p>
                <p>• Data source: {dataSource || 'Unknown'}</p>
                <p>• Timeframe: {timeframe}</p>
                <p>• Calculating: {calculating ? 'Yes' : 'No'}</p>
              </div>
            </div>
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
                    <th className="text-right py-3 px-4 text-slate-400">Top Price</th>
                    <th className="text-right py-3 px-4 text-slate-400">Current</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((stock, index) => {
                    const metrics = stockMetrics[stock.ticker];
                    if (!metrics) return null;
                    
                    return (
                      <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-white">{stock.ticker}</div>
                          <div className="text-sm text-slate-400">{stock.shares} shares</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-medium ${metrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatPercentage(metrics.totalReturn)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-medium text-slate-300">
                              {formatPercentage(metrics.volatility)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-medium ${metrics.sharpeRatio >= 1 ? 'text-green-400' : metrics.sharpeRatio >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {formatNumber(metrics.sharpeRatio)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-red-400">
                          -{formatPercentage(metrics.maxDrawdown)}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {formatCurrency(metrics.topPrice)}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {formatCurrency(metrics.currentPrice)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Data Source Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            📊 Real-time calculations using 90-day Google Finance data • 
            Sharpe ratio assumes 2% risk-free rate • 
            Volatility is annualized • 
            Data cached for 10 minutes • 
            Portfolio: {portfolio.length} stocks
          </p>
          {dataSource && (
            <p className="text-xs text-slate-400 mt-1">
              🔄 Data source: {dataSource} • 
              Cache: {portfolioMetrics?.dataPoints || 0} stocks loaded
            </p>
          )}
        </div>
      </div>
    </div>
  );
}