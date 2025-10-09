'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Shield, AlertTriangle, Target, TrendingDown, TrendingUp, BarChart3, Activity } from 'lucide-react';
import ResponsiveNavigation from '@/components/ResponsiveNavigation';

export default function RiskManagement() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskData, setRiskData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchRiskData();
  }, []);

  const handleLogout = () => {
    Cookies.remove('token');
    window.location.href = '/';
  };

  const fetchRiskData = async () => {
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
      
      if (response.data.portfolio && response.data.portfolio.length > 0) {
        generateRiskAnalysis(response.data.portfolio);
      }
    } catch (error) {
      console.error('Error fetching risk data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRiskAnalysis = (portfolioData: any[]) => {
    const totalValue = portfolioData.reduce((sum, stock) => sum + (stock.currentPrice * stock.shares), 0);
    
    // Calculate individual stock risks
    const stockRisks = portfolioData.map(stock => {
      const value = stock.currentPrice * stock.shares;
      const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;
      const pnlPercent = ((stock.currentPrice - stock.entryPrice) / stock.entryPrice) * 100;
      
      // Risk assessment based on various factors
      let riskLevel = 'Low';
      let riskScore = 0;
      
      // High P&L volatility indicator
      if (Math.abs(pnlPercent) > 100) riskScore += 3;
      else if (Math.abs(pnlPercent) > 50) riskScore += 2;
      else if (Math.abs(pnlPercent) > 20) riskScore += 1;
      
      // Portfolio weight factor
      if (weight > 30) riskScore += 2;
      else if (weight > 20) riskScore += 1;
      
      // Stop loss proximity
      const stopLossPercent = ((stock.currentPrice - stock.stopLoss) / stock.currentPrice) * 100;
      if (stopLossPercent < 5) riskScore += 2;
      else if (stopLossPercent < 10) riskScore += 1;
      
      // Determine risk level
      if (riskScore >= 4) riskLevel = 'High';
      else if (riskScore >= 2) riskLevel = 'Medium';
      
      return {
        ...stock,
        weight,
        pnlPercent,
        riskScore,
        riskLevel,
        stopLossPercent
      };
    });

    // Portfolio-level risk metrics
    const avgRiskScore = stockRisks.reduce((sum, stock) => sum + stock.riskScore, 0) / stockRisks.length;
    const highRiskStocks = stockRisks.filter(stock => stock.riskLevel === 'High').length;
    const mediumRiskStocks = stockRisks.filter(stock => stock.riskLevel === 'Medium').length;
    const lowRiskStocks = stockRisks.filter(stock => stock.riskLevel === 'Low').length;

    // Concentration risk
    const maxWeight = Math.max(...stockRisks.map(stock => stock.weight));
    const concentrationRisk = maxWeight > 30 ? 'High' : maxWeight > 20 ? 'Medium' : 'Low';

    setRiskData({
      stockRisks,
      portfolioMetrics: {
        avgRiskScore,
        highRiskStocks,
        mediumRiskStocks,
        lowRiskStocks,
        concentrationRisk,
        maxWeight
      }
    });
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High': return 'text-red-400 bg-red-900/20 border-red-500/50';
      case 'Medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/50';
      case 'Low': return 'text-green-400 bg-green-900/20 border-green-500/50';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/50';
    }
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
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Risk Management</h1>
          <p className="text-lg text-slate-400">Monitor and manage portfolio risk exposure</p>
        </div>

        {portfolio.length === 0 ? (
          <div className="card p-8 text-center">
            <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Portfolio Data</h3>
            <p className="text-slate-400">Add some stocks to your portfolio to see risk analysis</p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Portfolio Risk Overview */}
            {riskData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6 sm:p-8">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Activity className="w-6 h-6 mr-3" />
                    Risk Distribution
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-green-400">Low Risk</span>
                      <span className="text-lg font-semibold text-white">{riskData.portfolioMetrics.lowRiskStocks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-400">Medium Risk</span>
                      <span className="text-lg font-semibold text-white">{riskData.portfolioMetrics.mediumRiskStocks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-400">High Risk</span>
                      <span className="text-lg font-semibold text-white">{riskData.portfolioMetrics.highRiskStocks}</span>
                    </div>
                  </div>
                </div>

                <div className="card p-6 sm:p-8">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Target className="w-6 h-6 mr-3" />
                    Concentration Risk
                  </h3>
                  <div className="text-center">
                    <p className={`text-3xl font-bold mb-2 ${
                      riskData.portfolioMetrics.concentrationRisk === 'High' ? 'text-red-400' :
                      riskData.portfolioMetrics.concentrationRisk === 'Medium' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {riskData.portfolioMetrics.concentrationRisk}
                    </p>
                    <p className="text-sm text-slate-400">Largest Position</p>
                    <p className="text-lg font-semibold text-white">{riskData.portfolioMetrics.maxWeight.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="card p-6 sm:p-8">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <BarChart3 className="w-6 h-6 mr-3" />
                    Avg Risk Score
                  </h3>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white mb-2">{riskData.portfolioMetrics.avgRiskScore.toFixed(1)}</p>
                    <p className="text-sm text-slate-400">Out of 5.0</p>
                    <div className="w-full bg-slate-700 rounded-full h-3 mt-3">
                      <div 
                        className="bg-primary-500 h-3 rounded-full"
                        style={{ width: `${(riskData.portfolioMetrics.avgRiskScore / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Individual Stock Risk Analysis */}
            <div className="card p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <AlertTriangle className="w-6 h-6 mr-3" />
                Individual Stock Risk Analysis
              </h3>
              {riskData && (
                <div className="space-y-4">
                  {riskData.stockRisks.map((stock: any, index: number) => (
                    <div key={index} className={`p-4 rounded-lg border ${getRiskColor(stock.riskLevel)}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="text-lg font-semibold text-white">{stock.ticker}</h4>
                            <p className="text-sm text-slate-400">{stock.shares} shares • {stock.weight.toFixed(1)}% of portfolio</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${stock.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stock.pnlPercent >= 0 ? '+' : ''}{stock.pnlPercent.toFixed(2)}%
                          </div>
                          <div className="text-sm text-slate-400">P&L</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Risk Level:</span>
                          <span className={`ml-2 font-semibold ${
                            stock.riskLevel === 'High' ? 'text-red-400' :
                            stock.riskLevel === 'Medium' ? 'text-yellow-400' :
                            'text-green-400'
                          }`}>
                            {stock.riskLevel}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Risk Score:</span>
                          <span className="ml-2 font-semibold text-white">{stock.riskScore}/5</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Stop Loss Distance:</span>
                          <span className="ml-2 font-semibold text-white">{stock.stopLossPercent.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Risk Recommendations */}
            <div className="card p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Shield className="w-6 h-6 mr-3" />
                Risk Recommendations
              </h3>
              <div className="space-y-4">
                {riskData && riskData.portfolioMetrics.highRiskStocks > 0 && (
                  <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                    <h4 className="text-red-300 font-semibold mb-2">⚠️ High Risk Stocks Detected</h4>
                    <p className="text-red-100 text-sm">
                      You have {riskData.portfolioMetrics.highRiskStocks} high-risk stocks. Consider reducing position sizes or setting tighter stop losses.
                    </p>
                  </div>
                )}
                
                {riskData && riskData.portfolioMetrics.concentrationRisk === 'High' && (
                  <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
                    <h4 className="text-yellow-300 font-semibold mb-2">⚠️ High Concentration Risk</h4>
                    <p className="text-yellow-100 text-sm">
                      Your largest position is {riskData.portfolioMetrics.maxWeight.toFixed(1)}% of your portfolio. Consider diversifying to reduce concentration risk.
                    </p>
                  </div>
                )}
                
                {riskData && riskData.portfolioMetrics.avgRiskScore < 2 && (
                  <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
                    <h4 className="text-green-300 font-semibold mb-2">✅ Well Diversified Portfolio</h4>
                    <p className="text-green-100 text-sm">
                      Your portfolio shows good risk management with an average risk score of {riskData.portfolioMetrics.avgRiskScore.toFixed(1)}/5.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
