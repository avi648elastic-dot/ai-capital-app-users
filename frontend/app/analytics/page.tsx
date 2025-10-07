'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { TrendingUp, BarChart3, PieChart, Activity, Building2, TrendingDown, Bot, Smile, Frown, AlertCircle } from 'lucide-react';

export default function Analytics() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

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

          {/* Portfolio Performance Chart */}
          <div className="lg:col-span-2 card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Portfolio Performance Chart
            </h3>
            <div className="h-64 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-6">
              <div className="flex h-full">
                {/* Chart Area */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="bg-slate-700/30 rounded-lg p-4 h-full">
                    <div className="text-center mb-3">
                      <h4 className="text-sm font-semibold text-white mb-1">Portfolio Value Over Time</h4>
                      <p className="text-xs text-slate-400">Last 30 Days Performance</p>
                    </div>
                    
                    {/* Simple Line Chart */}
                    <div className="relative h-32 mb-3">
                      <svg className="w-full h-full" viewBox="0 0 300 120">
                        {/* Grid lines */}
                        <defs>
                          <pattern id="chartGrid" width="30" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#chartGrid)" />
                        
                        {/* Performance line */}
                        <path
                          d="M 20 100 Q 80 80 140 60 Q 200 40 260 30"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        
                        {/* Data points */}
                        <circle cx="20" cy="100" r="3" fill="#3b82f6" />
                        <circle cx="80" cy="80" r="3" fill="#3b82f6" />
                        <circle cx="140" cy="60" r="3" fill="#3b82f6" />
                        <circle cx="200" cy="40" r="3" fill="#3b82f6" />
                        <circle cx="260" cy="30" r="3" fill="#3b82f6" />
                        
                        {/* Y-axis labels */}
                        <text x="5" y="25" fill="#6b7280" fontSize="10">$50k</text>
                        <text x="5" y="50" fill="#6b7280" fontSize="10">$40k</text>
                        <text x="5" y="75" fill="#6b7280" fontSize="10">$30k</text>
                        <text x="5" y="100" fill="#6b7280" fontSize="10">$20k</text>
                      </svg>
                    </div>
                    
                    {/* Performance indicators */}
                    <div className="flex justify-between text-xs">
                      <div className="text-slate-400">Week 1</div>
                      <div className="text-slate-400">Week 2</div>
                      <div className="text-slate-400">Week 3</div>
                      <div className="text-slate-400">Week 4</div>
                    </div>
                  </div>
                </div>

                {/* Chart Legend & Stats */}
                <div className="w-48 ml-4 flex flex-col justify-center space-y-4">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <h5 className="text-sm font-semibold text-white mb-2">Performance Summary</h5>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Best Day</span>
                        <span className="text-green-400 font-semibold">+2.4%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Worst Day</span>
                        <span className="text-red-400 font-semibold">-1.8%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Daily</span>
                        <span className="text-blue-400 font-semibold">+0.6%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <h5 className="text-sm font-semibold text-white mb-2">Trend Analysis</h5>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400 font-semibold">Uptrend</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Consistent growth pattern with low volatility
                    </p>
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
