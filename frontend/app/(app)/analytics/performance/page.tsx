"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { TrendingUp, Activity, Target, BarChart3, HelpCircle, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
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
  const [timeRemaining, setTimeRemaining] = useState(60);
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
    setTimeRemaining(60);
    
    // Start countdown timer
    const countdownInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    try {
      const days = parseInt(timeframe.replace('d', ''));
      console.log(`🔍 [PERFORMANCE] Calculating real metrics for ${days} days with ${portfolio.length} stocks`);
      console.log('📊 [PERFORMANCE] Portfolio tickers:', portfolio.map(s => s.ticker));
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/performance?days=${days}`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` },
        timeout: 60000 // 60 second timeout for calculations (increased to match backend)
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
      
      // Check if it's a timeout error
      const isTimeout = error instanceof Error && (
        error.message.includes('timeout') || 
        error.message.includes('ECONNABORTED') ||
        error.message.includes('exceeded')
      );
      
      // Show specific error message to user
      if (isTimeout) {
        alert(`Performance calculation timed out after 60 seconds. The server is processing your request but it's taking longer than expected. Please try again in a moment.`);
      } else {
        alert(`Performance calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Check browser console for details.`);
      }
      
      // Reset to empty state on error
      setPortfolioMetrics(null);
      setStockMetrics({});
      setDataSource('');
    } finally {
      clearInterval(countdownInterval);
      setCalculating(false);
      setTimeRemaining(60);
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

  // Calculate investment quality score (0-100) based on multiple metrics
  const calculateInvestmentQuality = (metrics: PerformanceMetrics): { score: number; rating: 'Strong' | 'Moderate' | 'Weak'; color: string; icon: any; description: string } => {
    let score = 50; // Start at neutral
    
    // Return component (30% weight): Positive returns are good, negative are bad
    if (metrics.totalReturn > 15) score += 15; // Excellent returns
    else if (metrics.totalReturn > 5) score += 10; // Good returns
    else if (metrics.totalReturn > 0) score += 5; // Positive returns
    else if (metrics.totalReturn > -10) score -= 5; // Small losses
    else score -= 15; // Large losses
    
    // Sharpe Ratio component (30% weight): >1 is excellent, >0 is okay, <0 is poor
    if (metrics.sharpeRatio > 1.5) score += 15; // Excellent risk-adjusted returns
    else if (metrics.sharpeRatio > 1.0) score += 10; // Good risk-adjusted returns
    else if (metrics.sharpeRatio > 0.5) score += 5; // Decent risk-adjusted returns
    else if (metrics.sharpeRatio > 0) score += 0; // Neutral
    else score -= 10; // Poor risk-adjusted returns
    
    // Volatility component (20% weight): Lower is better (for same returns)
    if (metrics.volatility < 15) score += 10; // Low volatility (stable)
    else if (metrics.volatility < 25) score += 5; // Moderate volatility
    else if (metrics.volatility < 35) score -= 5; // High volatility
    else score -= 10; // Very high volatility (risky)
    
    // Max Drawdown component (20% weight): Less negative is better
    const drawdownAbs = Math.abs(metrics.maxDrawdown);
    if (drawdownAbs < 10) score += 10; // Small drawdowns (stable)
    else if (drawdownAbs < 20) score += 5; // Moderate drawdowns
    else if (drawdownAbs < 30) score -= 5; // Large drawdowns
    else score -= 10; // Very large drawdowns (risky)
    
    // Clamp score between 0-100
    score = Math.max(0, Math.min(100, score));
    
    // Determine rating
    let rating: 'Strong' | 'Moderate' | 'Weak';
    let color: string;
    let icon: any;
    let description: string;
    
    if (score >= 70) {
      rating = 'Strong';
      color = 'text-green-400 bg-green-900/20 border-green-500/30';
      icon = CheckCircle2;
      description = 'Strong investment: Good returns, low risk, solid metrics';
    } else if (score >= 45) {
      rating = 'Moderate';
      color = 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      icon = AlertCircle;
      description = 'Moderate investment: Mixed metrics, consider carefully';
    } else {
      rating = 'Weak';
      color = 'text-red-400 bg-red-900/20 border-red-500/30';
      icon = XCircle;
      description = 'Weak investment: Poor returns or high risk';
    }
    
    return { score, rating, color, icon: icon, description };
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
          <p className="text-slate-400">
            Real-time performance metrics calculated using {timeframe === '7d' ? '7-day' : timeframe === '30d' ? '30-day' : timeframe === '60d' ? '60-day' : '90-day'} Google Finance data
          </p>
          {calculating && (
            <div className="flex items-center mt-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
              <span className="text-sm text-primary-400">
                Calculating real metrics... ({timeRemaining}s remaining)
              </span>
            </div>
          )}
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

        {/* Quality Guide */}
        {Object.keys(stockMetrics).length > 0 && (
          <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm text-slate-300"><strong className="text-green-400">Strong:</strong> Score ≥70. Good returns, low risk</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-slate-300"><strong className="text-yellow-400">Moderate:</strong> Score 45-69. Mixed metrics</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-slate-300"><strong className="text-red-400">Weak:</strong> Score &lt;45. Poor returns or high risk</span>
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
                    <th className="text-right py-3 px-4 text-slate-400">
                      <div className="flex items-center justify-end gap-1">
                        Quality
                        <div className="group relative">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                          <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 z-10 shadow-xl">
                            Overall investment quality based on returns, Sharpe ratio, volatility, and max drawdown
                          </div>
                        </div>
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 text-slate-400">
                      <div className="flex items-center justify-end gap-1">
                        Return
                        <div className="group relative">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                          <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-48 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 z-10 shadow-xl">
                            Price change over selected period
                          </div>
                        </div>
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 text-slate-400">
                      <div className="flex items-center justify-end gap-1">
                        Volatility
                        <div className="group relative">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                          <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-56 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 z-10 shadow-xl">
                            Annualized price volatility (lower = more stable)
                          </div>
                        </div>
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 text-slate-400">
                      <div className="flex items-center justify-end gap-1">
                        Sharpe
                        <div className="group relative">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                          <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 z-10 shadow-xl">
                            Risk-adjusted returns. &gt;1 = excellent, &gt;0.5 = good, &lt;0 = poor
                          </div>
                        </div>
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 text-slate-400">
                      <div className="flex items-center justify-end gap-1">
                        Max DD
                        <div className="group relative">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                          <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-64 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 z-10 shadow-xl">
                            Maximum decline from peak (lower = better, less downside risk)
                          </div>
                        </div>
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 text-slate-400">Top Price</th>
                    <th className="text-right py-3 px-4 text-slate-400">Current</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((stock, index) => {
                    const metrics = stockMetrics[stock.ticker];
                    if (!metrics) return null;
                    
                    const quality = calculateInvestmentQuality(metrics);
                    const QualityIcon = quality.icon;
                    
                    return (
                      <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-white">{stock.ticker}</div>
                          <div className="text-sm text-slate-400">{stock.shares} shares</div>
                        </td>
                        {/* Quality Score */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${quality.color}`}>
                              <QualityIcon className="w-3.5 h-3.5" />
                              <span className="text-xs font-semibold">{quality.rating}</span>
                            </div>
                            <span className="text-xs text-slate-500">{quality.score}/100</span>
                          </div>
                        </td>
                        {/* Return */}
                        <td className="py-3 px-4 text-right">
                          <span className={`font-medium ${metrics.totalReturn >= 5 ? 'text-green-400' : metrics.totalReturn >= 0 ? 'text-green-300' : metrics.totalReturn >= -10 ? 'text-red-300' : 'text-red-400'}`}>
                            {formatPercentage(metrics.totalReturn)}
                          </span>
                          {metrics.totalReturn >= 15 && <span className="ml-1 text-xs text-green-400">✨</span>}
                          {metrics.totalReturn < -15 && <span className="ml-1 text-xs text-red-400">⚠️</span>}
                        </td>
                        {/* Volatility */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`font-medium ${
                              metrics.volatility < 15 ? 'text-green-400' : 
                              metrics.volatility < 25 ? 'text-yellow-400' : 
                              metrics.volatility < 35 ? 'text-orange-400' : 'text-red-400'
                            }`}>
                              {formatPercentage(metrics.volatility)}
                            </span>
                            {metrics.volatility < 15 && <span className="text-xs text-green-400 mt-0.5">Low</span>}
                            {metrics.volatility >= 35 && <span className="text-xs text-red-400 mt-0.5">High</span>}
                          </div>
                        </td>
                        {/* Sharpe Ratio */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`font-medium ${
                              metrics.sharpeRatio >= 1.5 ? 'text-green-400' : 
                              metrics.sharpeRatio >= 1.0 ? 'text-green-300' : 
                              metrics.sharpeRatio >= 0.5 ? 'text-yellow-400' : 
                              metrics.sharpeRatio >= 0 ? 'text-yellow-300' : 'text-red-400'
                            }`}>
                              {formatNumber(metrics.sharpeRatio)}
                            </span>
                            {metrics.sharpeRatio >= 1.5 && <span className="text-xs text-green-400 mt-0.5">Excellent</span>}
                            {metrics.sharpeRatio < 0 && <span className="text-xs text-red-400 mt-0.5">Poor</span>}
                          </div>
                        </td>
                        {/* Max Drawdown */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`font-medium ${
                              Math.abs(metrics.maxDrawdown) < 10 ? 'text-green-400' : 
                              Math.abs(metrics.maxDrawdown) < 20 ? 'text-yellow-400' : 
                              Math.abs(metrics.maxDrawdown) < 30 ? 'text-orange-400' : 'text-red-400'
                            }`}>
                              -{formatPercentage(metrics.maxDrawdown)}
                            </span>
                            {Math.abs(metrics.maxDrawdown) < 10 && <span className="text-xs text-green-400 mt-0.5">Stable</span>}
                            {Math.abs(metrics.maxDrawdown) >= 30 && <span className="text-xs text-red-400 mt-0.5">Risky</span>}
                          </div>
                        </td>
                        {/* Top Price */}
                        <td className="py-3 px-4 text-right text-slate-300">
                          {formatCurrency(metrics.topPrice)}
                        </td>
                        {/* Current Price */}
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
          <p className="text-xs text-slate-400">
            Real-time performance metrics calculated using {timeframe === '7d' ? '7-day' : timeframe === '30d' ? '30-day' : timeframe === '60d' ? '60-day' : '90-day'} Google Finance data
          </p>
          {dataSource && (
            <p className="text-xs text-slate-500 mt-1">
              📊 Data source: {dataSource} • 
              Sharpe ratio assumes 2% risk-free rate • 
              Volatility is annualized • 
              Data cached daily • 
              Portfolio: {portfolio.length} stocks
            </p>
          )}
        </div>
      </div>
    </div>
  );
}