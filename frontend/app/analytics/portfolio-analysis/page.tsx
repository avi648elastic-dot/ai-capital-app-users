'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { PieChart, BarChart3, TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle } from 'lucide-react';
import ResponsiveNavigation from '@/components/ResponsiveNavigation';

export default function PortfolioAnalysis() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchPortfolioAnalysis();
  }, []);

  const handleLogout = () => {
    Cookies.remove('token');
    window.location.href = '/';
  };

  const fetchPortfolioAnalysis = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        window.location.href = '/';
        return;
      }

      // Fetch user data
      const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userResponse.data.user);

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPortfolio(response.data.portfolio || []);
      
      // Generate analysis data
      if (response.data.portfolio && response.data.portfolio.length > 0) {
        generateAnalysis(response.data.portfolio);
      }
    } catch (error) {
      console.error('Error fetching portfolio analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = (portfolioData: any[]) => {
    const totalValue = portfolioData.reduce((sum, stock) => sum + (stock.currentPrice * stock.shares), 0);
    const totalCost = portfolioData.reduce((sum, stock) => sum + (stock.entryPrice * stock.shares), 0);
    const totalPnL = totalValue - totalCost;
    const pnlPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    // Calculate sector distribution
    const sectors: { [key: string]: { value: number; count: number; stocks: string[] } } = {};
    portfolioData.forEach(stock => {
      const sector = stock.sector || 'Other';
      const value = stock.currentPrice * stock.shares;
      if (!sectors[sector]) {
        sectors[sector] = { value: 0, count: 0, stocks: [] };
      }
      sectors[sector].value += value;
      sectors[sector].count += 1;
      sectors[sector].stocks.push(stock.ticker);
    });

    // Calculate risk metrics
    const returns = portfolioData.map(stock => {
      const returnPercent = ((stock.currentPrice - stock.entryPrice) / stock.entryPrice) * 100;
      return returnPercent;
    });

    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);

    setAnalysis({
      totalValue,
      totalCost,
      totalPnL,
      pnlPercent,
      sectors: Object.entries(sectors).map(([sector, data]) => ({
        sector,
        value: data.value,
        percentage: (data.value / totalValue) * 100,
        count: data.count,
        stocks: data.stocks
      })),
      riskMetrics: {
        volatility,
        avgReturn,
        sharpeRatio: volatility > 0 ? avgReturn / volatility : 0
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <ResponsiveNavigation 
        userName={user?.name || 'User'} 
        subscriptionTier={user?.subscriptionTier || 'free'}
        userAvatar={user?.avatarUrl}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 pt-20 lg:pt-8 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Portfolio Analysis</h1>
          <p className="text-lg text-slate-400">Deep dive into your portfolio composition and performance</p>
        </div>

        {portfolio.length === 0 ? (
          <div className="card p-8 text-center">
            <PieChart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Portfolio Data</h3>
            <p className="text-slate-400">Add some stocks to your portfolio to see detailed analysis</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Portfolio Overview */}
            <div className="card p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <DollarSign className="w-6 h-6 mr-3" />
                Portfolio Overview
              </h3>
              {analysis && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-slate-400 mb-1">Total Value</p>
                      <p className="text-2xl font-bold text-white">${analysis.totalValue.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-400 mb-1">Total Cost</p>
                      <p className="text-2xl font-bold text-white">${analysis.totalCost.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-400 mb-1">Total P&L</p>
                    <p className={`text-3xl font-bold ${analysis.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {analysis.pnlPercent >= 0 ? '+' : ''}{analysis.pnlPercent.toFixed(2)}%
                    </p>
                    <p className={`text-lg ${analysis.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${analysis.totalPnL >= 0 ? '+' : ''}{analysis.totalPnL.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Risk Metrics */}
            <div className="card p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <AlertTriangle className="w-6 h-6 mr-3" />
                Risk Metrics
              </h3>
              {analysis && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-slate-400 mb-1">Volatility</p>
                      <p className="text-2xl font-bold text-white">{analysis.riskMetrics.volatility.toFixed(2)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-400 mb-1">Avg Return</p>
                      <p className={`text-2xl font-bold ${analysis.riskMetrics.avgReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {analysis.riskMetrics.avgReturn >= 0 ? '+' : ''}{analysis.riskMetrics.avgReturn.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-400 mb-1">Sharpe Ratio</p>
                    <p className="text-3xl font-bold text-blue-400">{analysis.riskMetrics.sharpeRatio.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sector Distribution */}
            <div className="card p-6 sm:p-8 lg:col-span-2">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <PieChart className="w-6 h-6 mr-3" />
                Sector Distribution
              </h3>
              {analysis && (
                <div className="space-y-4">
                  {analysis.sectors.map((sector: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-4 h-4 rounded-full bg-primary-500"></div>
                        <div>
                          <span className="text-lg text-white font-medium">{sector.sector}</span>
                          <span className="text-sm text-slate-400 ml-2">({sector.count} stocks)</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg text-white font-semibold">{sector.percentage.toFixed(1)}%</div>
                        <div className="text-base text-slate-400">${sector.value.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
