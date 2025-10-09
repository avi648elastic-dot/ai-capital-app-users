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
        <pattern id="realChartGrid" width="40" height="20" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="0.5"/>
        </pattern>
      </defs>
      
      {/* Grid background */}
      <rect width="100%" height="100%" fill="url(#realChartGrid)" />
      
      {/* Area under the curve */}
      <path d={areaData} fill="url(#realChartGradient)" />
      
      {/* Main performance line */}
      <path
        d={pathData}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Data points */}
      {data.map((point, index) => {
        const x = getX(index);
        const y = getY(point.totalValue);
        const isLast = index === data.length - 1;
        const isPositive = point.dailyChangePercent > 0;
        
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r={isLast ? 5 : 3}
            fill={isPositive ? "#10b981" : "#ef4444"}
            stroke={isPositive ? "#059669" : "#dc2626"}
            strokeWidth="2"
          >
            {isLast && (
              <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite"/>
            )}
          </circle>
        );
      })}
      
      {/* Y-axis labels */}
      <text x="5" y="25" fill="#9ca3af" fontSize="10" fontWeight="500">
        ${(chartMax / 1000).toFixed(0)}k
      </text>
      <text x="5" y="75" fill="#9ca3af" fontSize="10" fontWeight="500">
        ${((chartMax + chartMin) / 2 / 1000).toFixed(0)}k
      </text>
      <text x="5" y="125" fill="#9ca3af" fontSize="10" fontWeight="500">
        ${(chartMin / 1000).toFixed(0)}k
      </text>
      
      {/* Current value indicator */}
      {data.length > 0 && (
        <>
          <text x="345" y="15" fill="#10b981" fontSize="11" fontWeight="bold">
            ${(data[data.length - 1].totalValue / 1000).toFixed(1)}k
          </text>
          <line 
            x1={getX(data.length - 1)} 
            y1={getY(data[data.length - 1].totalValue)} 
            x2="380" 
            y2={getY(data[data.length - 1].totalValue)} 
            stroke="#10b981" 
            strokeWidth="2" 
            strokeDasharray="3,3"
          />
        </>
      )}
    </svg>
  );
};

export default function Analytics() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [sectorData, setSectorData] = useState<any[]>([]);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<any>(null);
  const [portfolioPerformance, setPortfolioPerformance] = useState<any[]>([]);
  const [sectorPerformance, setSectorPerformance] = useState<any[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // AI Character Analysis
  const generateAiAnalysis = () => {
    if (portfolio.length === 0) {
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
    const totalInitial = portfolio.reduce((sum, stock) => sum + (stock.entryPrice * stock.shares), 0);
    const totalPnL = totalValue - totalInitial;
    const totalPnLPercent = totalInitial > 0 ? (totalPnL / totalInitial) * 100 : 0;
    
    // Calculate volatility (simplified)
    const avgVolatility = portfolio.reduce((sum, stock) => {
      const stockVolatility = Math.abs(stock.currentPrice - stock.entryPrice) / stock.entryPrice * 100;
      return sum + stockVolatility;
    }, 0) / portfolio.length;

    // Count positive vs negative performers
    const positiveStocks = portfolio.filter(stock => stock.currentPrice > stock.entryPrice).length;
    const negativeStocks = portfolio.filter(stock => stock.currentPrice < stock.entryPrice).length;
    
    // Analyze sector concentration
    const techStocks = portfolio.filter(stock => 
      ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META'].includes(stock.ticker)
    ).length;
    const techConcentration = (techStocks / portfolio.length) * 100;

    // Determine overall sentiment
    let mood = 'neutral';
    let icon = Bot;
    let message = '';
    let recommendation = '';
    let color = 'text-blue-400';

    if (totalPnLPercent > 10 && positiveStocks > negativeStocks && avgVolatility < 20) {
      // Excellent performance
      mood = 'excellent';
      icon = Smile;
      message = "Outstanding performance! Your portfolio is showing strong gains with good diversification.";
      recommendation = "Your solid investment strategy is paying off. Consider taking some profits on your best performers and reinvesting in undervalued opportunities.";
      color = 'text-green-400';
    } else if (totalPnLPercent > 5 && positiveStocks >= negativeStocks) {
      // Good performance
      mood = 'good';
      icon = Smile;
      message = "Good work! Your portfolio is performing well with positive momentum.";
      recommendation = "Keep monitoring your positions. Consider rebalancing if any single stock becomes too dominant in your portfolio.";
      color = 'text-green-300';
    } else if (totalPnLPercent < -10 || negativeStocks > positiveStocks * 1.5) {
      // Poor performance
      mood = 'poor';
      icon = Frown;
      message = "I'm concerned about your portfolio's recent performance. Several positions are underperforming.";
      recommendation = "Consider reviewing your stop-loss levels and cutting losses on consistently declining positions. Look for opportunities to rebalance into more stable sectors.";
      color = 'text-red-400';
    } else if (avgVolatility > 30) {
      // High volatility
      mood = 'warning';
      icon = AlertCircle;
      message = "Your portfolio shows high volatility. This could lead to significant swings in value.";
      recommendation = "Consider adding more stable, dividend-paying stocks to reduce overall portfolio risk. Diversification across sectors is key.";
      color = 'text-yellow-400';
    } else if (techConcentration > 60) {
      // Over-concentrated in tech
      mood = 'warning';
      icon = AlertCircle;
      message = "Your portfolio is heavily concentrated in technology stocks, which increases sector risk.";
      recommendation = "Diversify into other sectors like healthcare, financials, or consumer staples to reduce concentration risk and improve stability.";
      color = 'text-yellow-400';
    } else {
      // Neutral
      mood = 'neutral';
      icon = Bot;
      message = "Your portfolio shows mixed signals. Some positions are performing well while others need attention.";
      recommendation = "Focus on your best-performing stocks and consider whether underperformers still fit your investment thesis.";
      color = 'text-blue-400';
    }

    return {
      mood,
      icon,
      message,
      recommendation,
      color,
      metrics: {
        totalPnLPercent: totalPnLPercent.toFixed(2),
        avgVolatility: avgVolatility.toFixed(1),
        positiveStocks,
        negativeStocks,
        techConcentration: techConcentration.toFixed(1)
      }
    };
  };

  useEffect(() => {
    fetchPortfolio();
    fetchAnalyticsData();
  }, []);

  useEffect(() => {
    if (portfolio.length > 0) {
      setAiAnalysis(generateAiAnalysis());
    }
  }, [portfolio]);

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

  const fetchAnalyticsData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      
      console.log('🔍 [ANALYTICS] Fetching comprehensive analytics data...');
      const token = Cookies.get('token');
      console.log('🔍 [ANALYTICS] Token exists:', !!token);
      console.log('🔍 [ANALYTICS] API URL:', process.env.NEXT_PUBLIC_API_URL);
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/portfolio-analysis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ [ANALYTICS] API Response:', response.data);
      
      // Set all the real data from the comprehensive API
      setSectorData(response.data.sectorAllocation || []);
      setPortfolioAnalysis(response.data);
      setPortfolioPerformance(response.data.portfolioPerformance || []);
      setSectorPerformance(response.data.sectorPerformance || []);
      setRiskAssessment(response.data.riskAssessment || null);
      
      console.log('✅ [ANALYTICS] Real data loaded:', {
        sectors: response.data.sectorAllocation?.length || 0,
        performance: response.data.portfolioPerformance?.length || 0,
        risk: response.data.riskAssessment?.overallRisk || 'Unknown'
      });
    } catch (error) {
      console.error('❌ [ANALYTICS] Error fetching analytics data:', error);
      console.error('❌ [ANALYTICS] Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  const handleRefresh = () => {
    fetchAnalyticsData(true);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Analytics</h1>
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
              {sectorData.map((sector, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-4 h-4 rounded-full ${sector.color}`}></div>
                      <span className="text-lg text-white font-medium">{sector.sector}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg text-white font-semibold">{sector.percentage}%</div>
                      <div className="text-base text-slate-400">${sector.value.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${sector.color}`}
                      style={{ width: `${sector.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
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
            <div className="space-y-6">
              {/* Main Performance Grid */}
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
              
              {/* Additional Metrics Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-slate-800/70 rounded-lg">
                  <div className="text-lg font-bold text-emerald-400">$58.2k</div>
                  <div className="text-xs text-slate-400">Current Value</div>
                </div>
                <div className="text-center p-3 bg-slate-800/70 rounded-lg">
                  <div className="text-lg font-bold text-cyan-400">4</div>
                  <div className="text-xs text-slate-400">Winning Stocks</div>
                </div>
                <div className="text-center p-3 bg-slate-800/70 rounded-lg">
                  <div className="text-lg font-bold text-orange-400">2.8%</div>
                  <div className="text-xs text-slate-400">Avg Daily Change</div>
                </div>
              </div>
              
              {/* Risk Indicators */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-blue-400" />
                  Risk Assessment
                </h4>
                {riskAssessment ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          riskAssessment.overallRisk === 'High' 
                            ? 'bg-red-400' 
                            : riskAssessment.overallRisk === 'Medium' 
                              ? 'bg-yellow-400' 
                              : 'bg-green-400'
                        }`}></div>
                        <span className="text-sm text-slate-300">{riskAssessment.overallRisk} Risk</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Diversified across {sectorData.length} sectors
                      </div>
                    </div>
                    <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                      <div className={`h-2 rounded-full ${
                        riskAssessment.overallRisk === 'High' 
                          ? 'bg-red-400' 
                          : riskAssessment.overallRisk === 'Medium' 
                            ? 'bg-yellow-400' 
                            : 'bg-green-400'
                      }`} style={{ width: `${riskAssessment.riskScore * 10}%` }}></div>
                    </div>
                    {riskAssessment.recommendations.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-slate-400 mb-1">Recommendations:</div>
                        <ul className="text-xs text-slate-300 space-y-1">
                          {riskAssessment.recommendations.slice(0, 2).map((rec: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-400 mr-1">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-slate-400 text-sm">Loading risk assessment...</div>
                )}
              </div>
            </div>
          </div>

          {/* AI Capital Character Analysis */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Bot className="w-5 h-5 mr-2" />
              AI-Capital Analysis
            </h3>
            <div className="space-y-4">
              {aiAnalysis ? (
                <>
                  {/* AI Character Icon and Message */}
                  <div className="text-center p-4 bg-slate-800 rounded-lg">
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${
                      aiAnalysis.mood === 'excellent' ? 'bg-green-500/20' :
                      aiAnalysis.mood === 'good' ? 'bg-green-400/20' :
                      aiAnalysis.mood === 'poor' ? 'bg-red-500/20' :
                      aiAnalysis.mood === 'warning' ? 'bg-yellow-500/20' :
                      'bg-blue-500/20'
                    }`}>
                      <aiAnalysis.icon className={`w-6 h-6 ${aiAnalysis.color}`} />
                    </div>
                    <p className={`text-sm font-semibold ${aiAnalysis.color} mb-2`}>
                      {aiAnalysis.message}
                    </p>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {aiAnalysis.recommendation}
                    </p>
                  </div>

                  {/* Portfolio Metrics Grid */}
                  {aiAnalysis.metrics && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-slate-800 rounded-lg">
                        <div className="text-xs text-slate-400 mb-1">P&L</div>
                        <div className={`text-lg font-bold ${
                          parseFloat(aiAnalysis.metrics.totalPnLPercent) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {aiAnalysis.metrics.totalPnLPercent}%
                        </div>
                      </div>
                      <div className="text-center p-3 bg-slate-800 rounded-lg">
                        <div className="text-xs text-slate-400 mb-1">Volatility</div>
                        <div className="text-lg font-bold text-white">
                          {aiAnalysis.metrics.avgVolatility}%
                        </div>
                      </div>
                      <div className="text-center p-3 bg-slate-800 rounded-lg">
                        <div className="text-xs text-slate-400 mb-1">Winners</div>
                        <div className="text-lg font-bold text-green-400">
                          {aiAnalysis.metrics.positiveStocks}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-slate-800 rounded-lg">
                        <div className="text-xs text-slate-400 mb-1">Losers</div>
                        <div className="text-lg font-bold text-red-400">
                          {aiAnalysis.metrics.negativeStocks}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-32 items-center justify-center">
                  <div className="text-center">
                    <Bot className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Loading AI analysis...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sector Performance Summary */}
          <div className="lg:col-span-2 card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Sector Performance Summary (90 Days)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectorPerformance.length > 0 ? (
                sectorPerformance.map((sector, index) => (
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
                ))
              ) : (
                <div className="col-span-full text-center text-slate-400 py-8">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Loading sector performance data...</p>
                </div>
              )}
            </div>
          </div>

          {/* Portfolio Performance Chart */}
          <div className="lg:col-span-2 card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Portfolio Performance Chart
            </h3>
            <div className="h-80 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-6">
              <div className="flex h-full">
                {/* Chart Area */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="bg-slate-700/30 rounded-lg p-6 h-full">
                    <div className="text-center mb-4">
                      <h4 className="text-lg font-semibold text-white mb-1">Portfolio Value Over Time</h4>
                      <p className="text-sm text-slate-400">Last 30 Days Performance</p>
                    </div>
                    
                    {/* Real Data Chart */}
                    <div className="relative h-40 mb-4">
                      {portfolioPerformance.length > 0 ? (
                        <RealPortfolioChart data={portfolioPerformance} />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                          <div className="text-center">
                            <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Loading performance data...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Real performance indicators */}
                    <div className="flex justify-between text-sm">
                      {portfolioPerformance.length > 0 ? (
                        portfolioPerformance.slice(-4).map((week, index) => (
                          <div key={index} className="text-center">
                            <div className="text-slate-300 font-medium">Week {index + 1}</div>
                            <div className="text-xs text-slate-500">${(week.totalValue / 1000).toFixed(1)}k</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-slate-400 text-sm">Loading performance data...</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Compact Chart Legend & Stats */}
                <div className="w-48 ml-6 flex flex-col justify-center space-y-3">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <h5 className="text-xs font-semibold text-white mb-2 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1 text-green-400" />
                      Performance Summary
                    </h5>
                    <div className="space-y-2 text-xs">
                      {portfolioPerformance.length > 0 ? (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Best Day</span>
                            <span className="text-green-400 font-bold">
                              +{Math.max(...portfolioPerformance.map(p => p.dailyChangePercent)).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Worst Day</span>
                            <span className="text-red-400 font-bold">
                              {Math.min(...portfolioPerformance.map(p => p.dailyChangePercent)).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Total Return</span>
                            <span className={`font-bold ${
                              portfolioPerformance[portfolioPerformance.length - 1]?.totalPnLPercent > 0 
                                ? 'text-emerald-400' 
                                : 'text-red-400'
                            }`}>
                              {portfolioPerformance[portfolioPerformance.length - 1]?.totalPnLPercent > 0 ? '+' : ''}
                              {portfolioPerformance[portfolioPerformance.length - 1]?.totalPnLPercent.toFixed(1)}%
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-slate-400 text-xs">Loading...</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <h5 className="text-xs font-semibold text-white mb-2 flex items-center">
                      <Activity className="w-3 h-3 mr-1 text-blue-400" />
                      Trend Analysis
                    </h5>
                    <div className="space-y-1">
                      {portfolioPerformance.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Trend</span>
                            <div className="flex items-center space-x-1">
                              {portfolioPerformance[portfolioPerformance.length - 1]?.totalPnLPercent > 0 ? (
                                <TrendingUp className="w-2 h-2 text-green-400" />
                              ) : (
                                <TrendingDown className="w-2 h-2 text-red-400" />
                              )}
                              <span className={`text-xs font-semibold ${
                                portfolioPerformance[portfolioPerformance.length - 1]?.totalPnLPercent > 0 
                                  ? 'text-green-400' 
                                  : 'text-red-400'
                              }`}>
                                {portfolioPerformance[portfolioPerformance.length - 1]?.totalPnLPercent > 5 
                                  ? 'Strong' 
                                  : portfolioPerformance[portfolioPerformance.length - 1]?.totalPnLPercent > 0 
                                    ? 'Positive' 
                                    : 'Declining'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Volatility</span>
                            <span className={`text-xs font-semibold ${
                              riskAssessment?.avgVolatility > 20 
                                ? 'text-red-400' 
                                : riskAssessment?.avgVolatility > 10 
                                  ? 'text-yellow-400' 
                                  : 'text-green-400'
                            }`}>
                              {riskAssessment?.avgVolatility > 20 
                                ? 'High' 
                                : riskAssessment?.avgVolatility > 10 
                                  ? 'Moderate' 
                                  : 'Low'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Risk Level</span>
                            <span className={`text-xs font-semibold ${
                              riskAssessment?.overallRisk === 'High' 
                                ? 'text-red-400' 
                                : riskAssessment?.overallRisk === 'Medium' 
                                  ? 'text-yellow-400' 
                                  : 'text-green-400'
                            }`}>
                              {riskAssessment?.overallRisk || 'Unknown'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-slate-400 text-xs">Loading...</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
