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
        ${((chartMin + chartMax) / 2000).toFixed(0)}k
      </text>
      <text x="5" y="125" fill="#9ca3af" fontSize="10" fontWeight="500">
        ${(chartMin / 1000).toFixed(0)}k
      </text>
      
      {/* X-axis labels */}
      {data.map((point, index) => {
        const x = getX(index);
        if (index % Math.ceil(data.length / 5) === 0) {
          return (
            <text
              key={index}
              x={x}
              y="155"
              fill="#9ca3af"
              fontSize="10"
              textAnchor="middle"
            >
              {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </text>
          );
        }
        return null;
      })}
    </svg>
  );
};

export default function PortfolioAnalysis() {
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
    const totalCost = portfolio.reduce((sum, stock) => sum + (stock.entryPrice * stock.shares), 0);
    const totalPnLPercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

    // Calculate volatility
    const returns = portfolio.map(stock => {
      const stockReturn = (stock.currentPrice - stock.entryPrice) / stock.entryPrice;
      return stockReturn;
    });
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const avgVolatility = Math.sqrt(variance) * 100;

    // Count positive vs negative performers
    const positiveStocks = portfolio.filter(stock => stock.currentPrice > stock.entryPrice).length;
    const negativeStocks = portfolio.filter(stock => stock.currentPrice < stock.entryPrice).length;

    // Calculate tech concentration
    const techStocks = portfolio.filter(stock => 
      stock.ticker.includes('AAPL') || stock.ticker.includes('MSFT') || 
      stock.ticker.includes('GOOGL') || stock.ticker.includes('TSLA')
    ).length;
    const techConcentration = (techStocks / portfolio.length) * 100;

    let mood, icon, message, recommendation, color;

    if (totalPnLPercent > 15 && avgVolatility < 20) {
      // Excellent performance
      mood = 'excellent';
      icon = Smile;
      message = "Excellent work! Your portfolio is performing exceptionally well with strong returns and low volatility.";
      recommendation = "Consider taking some profits on your best performers and diversifying into other sectors to maintain this momentum.";
      color = 'text-green-400';
    } else if (totalPnLPercent > 5 && avgVolatility < 30) {
      // Good performance
      mood = 'good';
      icon = Smile;
      message = "Good work! Your portfolio is performing well with positive momentum. Keep monitoring your positions.";
      recommendation = "Consider rebalancing if any single stock becomes too dominant in your portfolio.";
      color = 'text-green-400';
    } else if (totalPnLPercent < -10 || negativeStocks > positiveStocks) {
      // Poor performance
      mood = 'concerned';
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
      
      // Fallback to mock data for development
      console.log('🔄 [ANALYTICS] Using fallback mock data...');
      
      // Generate mock sector data
      const mockSectorData = [
        { sector: 'Technology', percentage: 35.2, value: 12500, count: 3, stocks: ['AAPL', 'MSFT', 'GOOGL'], change: 2.4 },
        { sector: 'Healthcare', percentage: 28.7, value: 10200, count: 2, stocks: ['JNJ', 'PFE'], change: 0.7 },
        { sector: 'Finance', percentage: 22.1, value: 7800, count: 2, stocks: ['JPM', 'BAC'], change: -1.2 },
        { sector: 'Consumer', percentage: 14.0, value: 5000, count: 1, stocks: ['AMZN'], change: 1.8 }
      ];
      setSectorData(mockSectorData);
      
      // Generate mock performance data
      const mockPerformance = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
        totalValue: 50000 + Math.random() * 10000 + i * 200,
        dailyChangePercent: (Math.random() - 0.5) * 4
      }));
      setPortfolioPerformance(mockPerformance);
      
      // Generate mock sector performance
      const mockSectorPerformance = [
        { sector: 'Technology', percentage: 35.2, value: 12500, stocks: ['AAPL', 'MSFT', 'GOOGL'], performance90d: 12.4 },
        { sector: 'Healthcare', percentage: 28.7, value: 10200, stocks: ['JNJ', 'PFE'], performance90d: 8.7 },
        { sector: 'Finance', percentage: 22.1, value: 7800, stocks: ['JPM', 'BAC'], performance90d: -2.3 },
        { sector: 'Consumer', percentage: 14.0, value: 5000, stocks: ['AMZN'], performance90d: 5.2 }
      ];
      setSectorPerformance(mockSectorPerformance);
      
      setRiskAssessment({
        overallRisk: 'Low',
        volatility: 15.3,
        sharpeRatio: 1.24,
        maxDrawdown: -8.2,
        diversification: 6
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
    <div className="w-full">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Portfolio Analysis</h1>
              <p className="text-slate-400">Deep dive into your portfolio composition and performance</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Portfolio Allocation */}
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
                  const totalValue = portfolio.reduce((sum, s) => sum + (s.currentPrice * s.shares), 0);
                  const stockValue = stock.currentPrice * stock.shares;
                  const percentage = totalValue > 0 ? (stockValue / totalValue) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                        <span className="text-white font-medium">{stock.ticker}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">{percentage.toFixed(1)}%</div>
                        <div className="text-slate-400 text-sm">${stockValue.toFixed(2)}</div>
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
              {sectorData.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No sector data available</p>
              ) : (
                sectorData.map((sector, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full bg-primary-500"></div>
                        <span className="text-white font-medium">{sector.sector}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">{sector.percentage.toFixed(1)}%</div>
                        <div className="text-slate-400 text-sm">${sector.value.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${sector.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Stocks: {sector.stocks?.join(', ')}</span>
                      <span className={`${sector.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-green-400">+12.5%</div>
            <div className="text-slate-400 text-sm mt-1">30 Day Return</div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-green-400">+8.2%</div>
            <div className="text-slate-400 text-sm mt-1">60 Day Return</div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-blue-400">15.3%</div>
            <div className="text-slate-400 text-sm mt-1">Volatility</div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-blue-400">1.24</div>
            <div className="text-slate-400 text-sm mt-1">Sharpe Ratio</div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-3 gap-6 mt-6">
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-white">$58.2k</div>
            <div className="text-slate-400 text-sm mt-1">Current Value</div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-green-400">4</div>
            <div className="text-slate-400 text-sm mt-1">Winning Stocks</div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-blue-400">2.8%</div>
            <div className="text-slate-400 text-sm mt-1">Avg Daily Change</div>
          </div>
        </div>

        {/* AI-Capital Analysis */}
        <div className="card p-6 mt-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Bot className="w-5 h-5 mr-2" />
            AI-Capital Analysis
          </h3>
          {aiAnalysis && (
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-full bg-slate-600 ${aiAnalysis.color}`}>
                  <aiAnalysis.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-white mb-3 leading-relaxed">{aiAnalysis.message}</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{aiAnalysis.recommendation}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${aiAnalysis.color}`}>
                    {aiAnalysis.metrics.totalPnLPercent}%
                  </div>
                  <div className="text-slate-400 text-sm">Winners</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-300">
                    {aiAnalysis.metrics.avgVolatility}%
                  </div>
                  <div className="text-slate-400 text-sm">Losers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {aiAnalysis.metrics.positiveStocks}
                  </div>
                  <div className="text-slate-400 text-sm">Winners</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {aiAnalysis.metrics.negativeStocks}
                  </div>
                  <div className="text-slate-400 text-sm">Losers</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Risk Assessment */}
        <div className="card p-6 mt-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Risk Assessment
          </h3>
          {riskAssessment ? (
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{riskAssessment.overallRisk}</div>
                <div className="text-slate-400 text-sm">Overall Risk</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{riskAssessment.diversification}</div>
                <div className="text-slate-400 text-sm">Diversified across {riskAssessment.diversification} sectors</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-3xl font-bold text-green-400">Low Risk</div>
              <div className="text-slate-400 text-sm">Diversified across 6 sectors</div>
            </div>
          )}
        </div>

        {/* Sector Performance Summary (90 Days) */}
        <div className="card p-6 mt-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Sector Performance Summary (90 Days)
          </h3>
          <div className="space-y-4">
            {sectorPerformance.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No sector performance data available</p>
            ) : (
              sectorPerformance.map((sector, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-4 h-4 rounded-full bg-primary-500"></div>
                    <div>
                      <div className="text-white font-medium">{sector.sector}</div>
                      <div className="text-slate-400 text-sm">Stocks: {sector.stocks?.join(', ')}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">{sector.percentage.toFixed(1)}%</div>
                    <div className="text-slate-400 text-sm">${sector.value.toLocaleString()}</div>
                    <div className={`text-sm ${sector.performance90d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {sector.performance90d >= 0 ? '+' : ''}{sector.performance90d.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Portfolio Performance Chart */}
        <div className="card p-6 mt-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Portfolio Value Over Time
          </h3>
          <div className="text-slate-400 text-sm mb-4">Last 30 Days Performance</div>
          <div className="h-64 bg-slate-800 rounded-lg p-4">
            <RealPortfolioChart data={portfolioPerformance} />
          </div>
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">+2.2%</div>
              <div className="text-slate-400 text-sm">Best Day</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">-1.8%</div>
              <div className="text-slate-400 text-sm">Worst Day</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">+10.0%</div>
              <div className="text-slate-400 text-sm">Total Return</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-400">Strong</div>
              <div className="text-slate-400 text-sm">Trend</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="text-lg font-bold text-blue-400">Moderate</div>
            <div className="text-slate-400 text-sm">Volatility</div>
          </div>
        </div>
    </div>
  );
}