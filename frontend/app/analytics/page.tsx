'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { TrendingUp, BarChart3, PieChart, Activity, Building2, TrendingDown, Bot, Smile, Frown, AlertCircle, RefreshCw } from 'lucide-react';

// Real Portfolio Chart Component
const RealPortfolioChart = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No performance data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.totalValue));
  const minValue = Math.min(...data.map(d => d.totalValue));
  const range = maxValue - minValue;
  const padding = range * 0.1; // 10% padding
  const chartMin = minValue - padding;
  const chartMax = maxValue + padding;

  const getY = (value: number) => {
    return 140 - ((value - chartMin) / (chartMax - chartMin)) * 120;
  };

  const getX = (index: number) => {
    return 20 + (index / (data.length - 1)) * 320;
  };

  // Create path for the line
  const pathData = data.map((point, index) => {
    const x = getX(index);
    const y = getY(point.totalValue);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Create area path
  const areaData = `${pathData} L ${getX(data.length - 1)} 140 L 20 140 Z`;

  return (
    <svg className="w-full h-full" viewBox="0 0 400 160">
      <defs>
        <linearGradient id="realChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      
      {/* Grid lines */}
      <line x1="20" y1="20" x2="20" y2="140" stroke="#374151" strokeWidth="1"/>
      <line x1="20" y1="140" x2="340" y2="140" stroke="#374151" strokeWidth="1"/>
      
      {/* Area under curve */}
      <path d={areaData} fill="url(#realChartGradient)"/>
      
      {/* Line */}
      <path d={pathData} stroke="#3b82f6" strokeWidth="2" fill="none"/>
      
      {/* Data points */}
      {data.map((point, index) => {
        const x = getX(index);
        const y = getY(point.totalValue);
        const isLast = index === data.length - 1;
        
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r={isLast ? 5 : 3}
            fill="#3b82f6"
            stroke="#1e40af"
            strokeWidth={isLast ? 2 : 1}
          />
        );
      })}
    </svg>
  );
};

// AI Analysis Component
const AIAnalysis = ({ portfolio }: { portfolio: any[] }) => {
  const getAIAnalysis = () => {
    if (!portfolio || portfolio.length === 0) {
      return {
        mood: 'neutral',
        icon: Bot,
        message: "I'm ready to analyze your portfolio! Add some stocks to get started.",
        recommendation: "Start by adding stocks to your portfolio to see my analysis and recommendations.",
        color: 'text-blue-400'
      };
    }

    // Calculate portfolio metrics
    const totalValue = portfolio.reduce((sum, stock) => sum + (stock.currentPrice * stock.shares), 0);
    const totalCost = portfolio.reduce((sum, stock) => sum + (stock.entryPrice * stock.shares), 0);
    const totalPnL = totalValue - totalCost;
    const pnlPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    // Calculate average volatility (simplified)
    const avgVolatility = portfolio.reduce((sum, stock) => {
      // Simplified volatility calculation based on price movement
      const priceChange = Math.abs(stock.currentPrice - stock.entryPrice) / stock.entryPrice;
      const stockVolatility = priceChange * 100; // Convert to percentage
      return sum + stockVolatility;
    }, 0) / portfolio.length;

    // Count positive vs negative performers
    const positiveStocks = portfolio.filter(stock => stock.currentPrice > stock.entryPrice).length;
    const negativeStocks = portfolio.filter(stock => stock.currentPrice < stock.entryPrice).length;

    let mood, icon, message, recommendation, color;

    if (pnlPercent > 20) {
      mood = 'excellent';
      icon = Smile;
      message = "Excellent work! Your portfolio is performing exceptionally well with strong positive momentum.";
      recommendation = "Consider taking some profits on your best performers and rebalancing your portfolio.";
      color = 'text-green-400';
    } else if (pnlPercent > 10) {
      mood = 'good';
      icon = Smile;
      message = "Good work! Your portfolio is performing well with positive momentum.";
      recommendation = "Keep monitoring your positions. Consider rebalancing if any single stock becomes too dominant.";
      color = 'text-green-400';
    } else if (pnlPercent > 0) {
      mood = 'positive';
      icon = Smile;
      message = "Your portfolio is in positive territory. Keep up the good work!";
      recommendation = "Consider adding more diversified positions to strengthen your portfolio.";
      color = 'text-blue-400';
    } else if (pnlPercent > -10) {
      mood = 'caution';
      icon = AlertCircle;
      message = "Your portfolio is experiencing some volatility. This is normal in market fluctuations.";
      recommendation = "Review your positions and consider if any adjustments are needed based on your risk tolerance.";
      color = 'text-yellow-400';
    } else {
      mood = 'concern';
      icon = Frown;
      message = "Your portfolio is facing challenges. It might be time to review your strategy.";
      recommendation = "Consider reviewing your stock selections and possibly taking defensive positions.";
      color = 'text-red-400';
    }

    return {
      mood,
      icon,
      message,
      recommendation,
      color,
      metrics: {
        pnlPercent: pnlPercent.toFixed(2),
        volatility: avgVolatility.toFixed(1),
        winners: positiveStocks,
        losers: negativeStocks
      }
    };
  };

  const analysis = getAIAnalysis();
  const IconComponent = analysis.icon;

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <IconComponent className={`w-5 h-5 mr-2 ${analysis.color}`} />
        AI-Capital Analysis
      </h3>
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <IconComponent className={`w-6 h-6 mt-1 ${analysis.color}`} />
          <div>
            <p className="text-slate-300 mb-2">{analysis.message}</p>
            <p className="text-sm text-slate-400">{analysis.recommendation}</p>
          </div>
        </div>
        
        {analysis.metrics && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{analysis.metrics.pnlPercent}%</p>
              <p className="text-xs text-slate-400">P&L</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{analysis.metrics.volatility}%</p>
              <p className="text-xs text-slate-400">Volatility</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{analysis.metrics.winners}</p>
              <p className="text-xs text-slate-400">Winners</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{analysis.metrics.losers}</p>
              <p className="text-xs text-slate-400">Losers</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Analytics() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [portfolioPerformance, setPortfolioPerformance] = useState<any[]>([]);
  const [sectorPerformance, setSectorPerformance] = useState<any[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        window.location.href = '/';
        return;
      }

      // Fetch portfolio data
      const portfolioResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPortfolio(portfolioResponse.data.portfolio || []);

      // Generate portfolio performance data
      const performanceData = generatePortfolioPerformance(portfolioResponse.data.portfolio || []);
      setPortfolioPerformance(performanceData);

      // Generate sector performance data
      const sectorData = generateSectorPerformance(portfolioResponse.data.portfolio || []);
      setSectorPerformance(sectorData);

      // Generate risk assessment
      const riskData = generateRiskAssessment(portfolioResponse.data.portfolio || []);
      setRiskAssessment(riskData);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePortfolioPerformance = (portfolioData: any[]) => {
    if (portfolioData.length === 0) return [];
    
    const totalValue = portfolioData.reduce((sum, stock) => sum + (stock.currentPrice * stock.shares), 0);
    const totalCost = portfolioData.reduce((sum, stock) => sum + (stock.entryPrice * stock.shares), 0);
    const totalPnL = totalValue - totalCost;
    const pnlPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    // Generate 30 days of performance data
    const performanceData = [];
    const baseValue = totalCost;
    
    for (let i = 0; i < 30; i++) {
      const dayValue = baseValue + (baseValue * (pnlPercent / 100) * (i / 30));
      const dailyChange = i === 0 ? 0 : (dayValue - performanceData[i - 1].totalValue) / performanceData[i - 1].totalValue * 100;
      
      performanceData.push({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalValue: dayValue,
        totalPnL: dayValue - baseValue,
        totalPnLPercent: ((dayValue - baseValue) / baseValue) * 100,
        dailyChange: dailyChange
      });
    }
    
    return performanceData;
  };

  const generateSectorPerformance = (portfolioData: any[]) => {
    const sectors: { [key: string]: { stocks: string[], value: number, cost: number } } = {};
    
    portfolioData.forEach(stock => {
      const sector = stock.sector || 'Other';
      const value = stock.currentPrice * stock.shares;
      const cost = stock.entryPrice * stock.shares;
      
      if (!sectors[sector]) {
        sectors[sector] = { stocks: [], value: 0, cost: 0 };
      }
      sectors[sector].stocks.push(stock.ticker);
      sectors[sector].value += value;
      sectors[sector].cost += cost;
    });

    return Object.entries(sectors).map(([sector, data]) => {
      const pnl = data.value - data.cost;
      const pnlPercent = data.cost > 0 ? (pnl / data.cost) * 100 : 0;
      
      return {
        sector,
        stocks: data.stocks,
        value: data.value,
        percentage: portfolioData.length > 0 ? (data.value / portfolioData.reduce((sum, s) => sum + (s.currentPrice * s.shares), 0)) * 100 : 0,
        performance30D: pnlPercent,
        performance90D: pnlPercent * 1.2 // Simulate 90-day performance
      };
    });
  };

  const generateRiskAssessment = (portfolioData: any[]) => {
    if (portfolioData.length === 0) return null;

    const totalValue = portfolioData.reduce((sum, stock) => sum + (stock.currentPrice * stock.shares), 0);
    
    // Calculate concentration risk
    const maxWeight = Math.max(...portfolioData.map(stock => (stock.currentPrice * stock.shares) / totalValue * 100));
    
    // Calculate volatility (simplified)
    const avgVolatility = portfolioData.reduce((sum, stock) => {
      const priceChange = Math.abs(stock.currentPrice - stock.entryPrice) / stock.entryPrice;
      return sum + priceChange * 100;
    }, 0) / portfolioData.length;

    // Count sectors
    const sectors = new Set(portfolioData.map(stock => stock.sector || 'Other')).size;

    return {
      avgVolatility: avgVolatility.toFixed(1),
      maxWeight: maxWeight.toFixed(1),
      sectorCount: sectors,
      riskLevel: avgVolatility > 20 ? 'High' : avgVolatility > 10 ? 'Medium' : 'Low'
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const totalValue = portfolio.reduce((sum, stock) => sum + (stock.currentPrice * stock.shares), 0);
  const totalCost = portfolio.reduce((sum, stock) => sum + (stock.entryPrice * stock.shares), 0);
  const totalPnL = totalValue - totalCost;
  const pnlPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Analytics</h1>
              <p className="text-lg text-slate-400">Detailed analysis of your portfolio performance</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg transition-colors text-base font-medium"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Portfolio Overview */}
          <div className="card p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <PieChart className="w-6 h-6 mr-3" />
              Portfolio Allocation
            </h3>
            <div className="space-y-5">
              {portfolio.length === 0 ? (
                <p className="text-lg text-slate-400 text-center py-8">No stocks in portfolio</p>
              ) : (
                portfolio.map((stock, index) => {
                  const value = stock.currentPrice * stock.shares;
                  const totalValue = portfolio.reduce((sum, s) => sum + (s.currentPrice * s.shares), 0);
                  const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-4">
                        <div className="w-4 h-4 rounded-full bg-primary-500"></div>
                        <span className="text-lg text-white font-medium">{stock.ticker}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg text-white font-semibold">{percentage.toFixed(1)}%</div>
                        <div className="text-base text-slate-400">${value.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sector Segmentation */}
          <div className="card p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Building2 className="w-6 h-6 mr-3" />
              Sector Segmentation
            </h3>
            <div className="space-y-5">
              {sectorPerformance.map((sector, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 rounded-full bg-primary-500"></div>
                      <div>
                        <span className="text-lg text-white font-medium">{sector.sector}</span>
                        <span className="text-sm text-slate-400 ml-2">({sector.stocks.length} stocks)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg text-white font-semibold">{sector.percentage.toFixed(1)}%</div>
                      <div className="text-base text-slate-400">${sector.value.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3">
                    <div 
                      className="bg-primary-500 h-3 rounded-full"
                      style={{ width: `${sector.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Stocks: {sector.stocks.join(', ')}</span>
                    <div className={`flex items-center space-x-1 ${
                      sector.performance30D >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {sector.performance30D >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{sector.performance30D >= 0 ? '+' : ''}{sector.performance30D.toFixed(1)}%</span>
                      <span className="text-slate-400">30d</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="card p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Activity className="w-6 h-6 mr-3" />
              Performance Metrics
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">+{pnlPercent.toFixed(1)}%</p>
                <p className="text-sm text-slate-400">Total Return</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">${totalValue.toLocaleString()}</p>
                <p className="text-sm text-slate-400">Current Value</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">{riskAssessment?.avgVolatility || '0.0'}%</p>
                <p className="text-sm text-slate-400">Volatility</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-400">{portfolio.filter(stock => stock.currentPrice > stock.entryPrice).length}</p>
                <p className="text-sm text-slate-400">Winning Stocks</p>
              </div>
            </div>
            
            {riskAssessment && (
              <div className="mt-6 p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Risk Level:</span>
                  <span className={`font-semibold ${
                    riskAssessment.riskLevel === 'Low' ? 'text-green-400' :
                    riskAssessment.riskLevel === 'Medium' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {riskAssessment.riskLevel} Risk
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-slate-400">Diversified across {riskAssessment.sectorCount} sectors</span>
                </div>
              </div>
            )}
          </div>

          {/* AI Analysis */}
          <AIAnalysis portfolio={portfolio} />

          {/* Portfolio Performance Chart */}
          <div className="card p-6 sm:p-8 lg:col-span-2">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <BarChart3 className="w-6 h-6 mr-3" />
              Portfolio Performance Over Time
            </h3>
            <div className="h-64 sm:h-80 lg:h-96">
              <RealPortfolioChart data={portfolioPerformance} />
            </div>
            {portfolioPerformance.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">+{(Math.max(...portfolioPerformance.map(p => p.dailyChange))).toFixed(1)}%</p>
                  <p className="text-sm text-slate-400">Best Day</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">{(Math.min(...portfolioPerformance.map(p => p.dailyChange))).toFixed(1)}%</p>
                  <p className="text-sm text-slate-400">Worst Day</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">+{pnlPercent.toFixed(1)}%</p>
                  <p className="text-sm text-slate-400">Total Return</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}