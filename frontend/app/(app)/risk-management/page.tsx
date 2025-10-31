"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Shield, AlertTriangle, Target, TrendingDown, TrendingUp, BarChart3, Activity, ArrowUp, ArrowDown, DollarSign, Percent } from 'lucide-react';

export default function RiskManagement() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskData, setRiskData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchRiskData();
  }, []);

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

      // Fetch risk analytics from backend (with real volatility and drawdown data)
      const riskResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/risk-analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const riskAnalytics = riskResponse.data;
      
      console.log('📊 [RISK] Risk analytics response:', riskAnalytics);
      console.log('📊 [RISK] StockRisks sample:', riskAnalytics.stockRisks?.slice(0, 2));
      
      // Set portfolio from stock risks
      if (riskAnalytics.stockRisks && riskAnalytics.stockRisks.length > 0) {
        setPortfolio(riskAnalytics.stockRisks);
      }

      // Set risk data from backend
      setRiskData({
        totalValue: riskAnalytics.stockRisks?.reduce((sum: number, stock: any) => {
          return sum + (stock.currentPrice * stock.shares);
        }, 0) || 0,
        avgRiskScore: riskAnalytics.averageRiskScore || 0,
        highRiskStocks: riskAnalytics.highRiskStocks || 0,
        mediumRiskStocks: riskAnalytics.stockRisks?.filter((stock: any) => stock.riskLevel === 'Medium').length || 0,
        lowRiskStocks: riskAnalytics.stockRisks?.filter((stock: any) => stock.riskLevel === 'Low').length || 0,
        concentrationRisk: riskAnalytics.concentrationRisk || 'Low',
        diversificationScore: riskAnalytics.diversificationScore || 0,
        stockRisks: riskAnalytics.stockRisks || [],
        recommendations: riskAnalytics.recommendations || [],
        positionRecommendations: riskAnalytics.positionRecommendations || [],
        rebalancingSummary: riskAnalytics.rebalancingSummary || {
          positionsToReduce: 0,
          positionsToIncrease: 0,
          totalCapitalToRelease: 0,
          totalCapitalNeeded: 0,
          estimatedProfit: 0,
          rebalancingNeeded: false
        }
      });
    } catch (error) {
      console.error('Error fetching risk data:', error);
    } finally {
      setLoading(false);
    }
  };



  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Extreme': return 'text-red-500 bg-red-900/30';
      case 'High': return 'text-red-400 bg-red-900/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'Low': return 'text-emerald-400 bg-emerald-900/20';
      default: return 'text-slate-400 bg-slate-900/20';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'Extreme': return <AlertTriangle className="w-4 h-4" />;
      case 'High': return <TrendingDown className="w-4 h-4" />;
      case 'Medium': return <Activity className="w-4 h-4" />;
      case 'Low': return <TrendingUp className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!portfolio || portfolio.length === 0) {
    return (
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Risk Management</h1>
          <p className="text-slate-400">Monitor and manage your portfolio risk</p>
        </div>
        <div className="card p-12 text-center">
          <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Portfolio Data</h3>
          <p className="text-slate-400">Add stocks to your portfolio to see risk analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Risk Management</h1>
        <p className="text-slate-400">Monitor and manage your portfolio risk</p>
      </div>

      {/* Risk Overview Cards */}
      {riskData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-800 rounded-lg">
                  <Shield className="w-6 h-6 text-primary-500" />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  riskData.avgRiskScore > 3 ? 'text-red-400 bg-red-900/20' :
                  riskData.avgRiskScore > 2 ? 'text-yellow-400 bg-yellow-900/20' :
                  'text-emerald-400 bg-emerald-900/20'
                }`}>
                  {riskData.avgRiskScore > 3 ? 'High Risk' :
                   riskData.avgRiskScore > 2 ? 'Medium Risk' : 'Low Risk'}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{riskData.avgRiskScore.toFixed(1)}</h3>
              <p className="text-slate-400 text-sm">Average Risk Score</p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-800 rounded-lg">
                  <Target className="w-6 h-6 text-emerald-500" />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  riskData.diversificationScore > 70 ? 'text-emerald-400 bg-emerald-900/20' :
                  riskData.diversificationScore > 40 ? 'text-yellow-400 bg-yellow-900/20' :
                  'text-red-400 bg-red-900/20'
                }`}>
                  {riskData.diversificationScore > 70 ? 'Good' :
                   riskData.diversificationScore > 40 ? 'Fair' : 'Poor'}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{riskData.diversificationScore.toFixed(0)}%</h3>
              <p className="text-slate-400 text-sm">Diversification Score</p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-800 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  riskData.highRiskStocks > 0 ? 'text-red-400 bg-red-900/20' : 'text-emerald-400 bg-emerald-900/20'
                }`}>
                  {riskData.highRiskStocks > 0 ? 'Attention' : 'Safe'}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{riskData.highRiskStocks}</h3>
              <p className="text-slate-400 text-sm">High Risk Stocks</p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-800 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  riskData.concentrationRisk === 'High' ? 'text-red-400 bg-red-900/20' :
                  riskData.concentrationRisk === 'Medium' ? 'text-yellow-400 bg-yellow-900/20' :
                  'text-emerald-400 bg-emerald-900/20'
                }`}>
                  {riskData.concentrationRisk}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{portfolio.length}</h3>
              <p className="text-slate-400 text-sm">Total Positions</p>
            </div>
          </div>

          {/* Rebalancing Summary - NEW */}
          {riskData.rebalancingSummary && riskData.rebalancingSummary.rebalancingNeeded && (
            <div className="card p-6 mb-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-400" />
                Portfolio Rebalancing Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-red-500/30">
                  <div className="text-xs text-slate-400 mb-1">Positions to Reduce</div>
                  <div className="text-2xl font-bold text-red-400">{riskData.rebalancingSummary.positionsToReduce}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-green-500/30">
                  <div className="text-xs text-slate-400 mb-1">Positions to Increase</div>
                  <div className="text-2xl font-bold text-green-400">{riskData.rebalancingSummary.positionsToIncrease}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-yellow-500/30">
                  <div className="text-xs text-slate-400 mb-1">Capital to Release</div>
                  <div className="text-2xl font-bold text-yellow-400">${riskData.rebalancingSummary.totalCapitalToRelease.toFixed(2)}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/30">
                  <div className="text-xs text-slate-400 mb-1">Estimated Profit</div>
                  <div className="text-2xl font-bold text-purple-400">${riskData.rebalancingSummary.estimatedProfit.toFixed(2)}</div>
                </div>
              </div>
              {riskData.rebalancingSummary.estimatedProfit > 0 && (
                <div className="mt-4 p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <p className="text-sm text-green-300">
                      <strong>Profit-Taking Opportunity:</strong> By rebalancing your portfolio, you could secure approximately <strong>${riskData.rebalancingSummary.estimatedProfit.toFixed(2)}</strong> in profits while reducing risk exposure.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Position Sizing Recommendations - NEW */}
          {riskData.positionRecommendations && riskData.positionRecommendations.length > 0 && (
            <div className="card p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Position Sizing Recommendations
              </h2>
              <p className="text-slate-400 text-sm mb-4">Optimize your portfolio allocation to maximize profit while minimizing risk.</p>
              <div className="space-y-4">
                {riskData.positionRecommendations.map((rec: any, index: number) => {
                  const getActionColor = (action: string) => {
                    switch (action) {
                      case 'REDUCE':
                      case 'TAKE_PROFIT':
                        return 'bg-red-900/20 border-red-700/50';
                      case 'INCREASE':
                        return 'bg-green-900/20 border-green-700/50';
                      default:
                        return 'bg-slate-800/50 border-slate-700/50';
                    }
                  };

                  const getActionIcon = (action: string) => {
                    switch (action) {
                      case 'REDUCE':
                      case 'TAKE_PROFIT':
                        return <ArrowDown className="w-5 h-5 text-red-400" />;
                      case 'INCREASE':
                        return <ArrowUp className="w-5 h-5 text-green-400" />;
                      default:
                        return <Activity className="w-5 h-5 text-slate-400" />;
                    }
                  };

                  const getPriorityColor = (priority: string) => {
                    switch (priority) {
                      case 'CRITICAL':
                        return 'bg-red-500/20 text-red-400 border-red-500/30';
                      case 'HIGH':
                        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
                      case 'MEDIUM':
                        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                      default:
                        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
                    }
                  };

                  return (
                    <div key={index} className={`p-4 rounded-lg border ${getActionColor(rec.action)}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getActionIcon(rec.action)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-bold text-white text-lg">{rec.ticker}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                                {rec.priority} Priority
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                rec.action === 'REDUCE' || rec.action === 'TAKE_PROFIT' ? 'bg-red-500/20 text-red-400' :
                                rec.action === 'INCREASE' ? 'bg-green-500/20 text-green-400' :
                                'bg-slate-500/20 text-slate-400'
                              }`}>
                                {rec.action === 'TAKE_PROFIT' ? 'TAKE PROFIT' : rec.action}
                              </span>
                            </div>
                            <p className="text-slate-300 text-sm mt-1">{rec.reason}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-700/50">
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Current Allocation</div>
                          <div className="text-lg font-bold text-white">{rec.currentWeight}%</div>
                          <div className="text-xs text-slate-500">${rec.currentValue.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Target Allocation</div>
                          <div className={`text-lg font-bold ${
                            rec.action === 'INCREASE' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {rec.targetWeight}%
                          </div>
                          <div className="text-xs text-slate-500">${rec.targetValue.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Shares to {rec.action === 'INCREASE' ? 'Buy' : 'Sell'}</div>
                          <div className={`text-lg font-bold ${
                            rec.action === 'INCREASE' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {Math.abs(rec.sharesToTrade)}
                          </div>
                          <div className="text-xs text-slate-500">{rec.currentShares} → {rec.targetShares} shares</div>
                        </div>
                        {rec.estimatedProfit > 0 && (
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Estimated Profit</div>
                            <div className="text-lg font-bold text-green-400">${rec.estimatedProfit.toFixed(2)}</div>
                            <div className="text-xs text-slate-500">From rebalancing</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400">Risk Level:</span>
                          <span className={`ml-1 font-medium ${
                            rec.riskLevel === 'High' || rec.riskLevel === 'Extreme' ? 'text-red-400' :
                            rec.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                          }`}>{rec.riskLevel}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Volatility:</span>
                          <span className="ml-1 font-medium text-yellow-400">{rec.volatility.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400">P&L:</span>
                          <span className={`ml-1 font-medium ${rec.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {rec.pnlPercent >= 0 ? '+' : ''}{rec.pnlPercent.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Risk-Adjusted Return:</span>
                          <span className={`ml-1 font-medium ${rec.riskAdjustedReturn > 1 ? 'text-green-400' : 'text-red-400'}`}>
                            {rec.riskAdjustedReturn.toFixed(2)}x
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {riskData.recommendations && riskData.recommendations.length > 0 && (
            <div className="card p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Portfolio Risk Recommendations
              </h2>
              <div className="space-y-4">
                {riskData.recommendations.map((rec: any, index: number) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    rec.type === 'warning' ? 'bg-red-900/20 border-red-700/50' :
                    rec.type === 'info' ? 'bg-blue-900/20 border-blue-700/50' :
                    'bg-slate-800/50 border-slate-700/50'
                  }`}>
                    <div className="flex items-start">
                      <AlertTriangle className={`w-5 h-5 mr-3 mt-0.5 ${
                        rec.type === 'warning' ? 'text-red-400' :
                        rec.type === 'info' ? 'text-blue-400' :
                        'text-slate-400'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-white">{rec.title}</h3>
                          {rec.priority && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rec.priority === 'HIGH' || rec.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {rec.priority} Priority
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">{rec.message}</p>
                        {rec.suggestedReduction && (
                          <p className="text-sm text-red-300 mt-2">
                            <strong>Suggested Action:</strong> Reduce by {rec.suggestedReduction}
                          </p>
                        )}
                        {rec.estimatedProfit && (
                          <p className="text-sm text-green-300 mt-2">
                            <strong>Potential Profit:</strong> ${rec.estimatedProfit.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Stock Risk Analysis */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Individual Stock Risk Analysis
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400">Stock</th>
                    <th className="text-left py-3 px-4 text-slate-400">Weight</th>
                    <th className="text-left py-3 px-4 text-slate-400">P&L</th>
                    <th className="text-left py-3 px-4 text-slate-400">Risk Level</th>
                    <th className="text-left py-3 px-4 text-slate-400">Risk Score</th>
                  </tr>
                </thead>
                <tbody>
                  {riskData.stockRisks.map((stock: any, index: number) => (
                    <tr key={index} className="border-b border-slate-800">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-semibold text-white">{stock.ticker || 'N/A'}</div>
                          <div className="text-sm text-slate-400">{stock.shares || 0} shares</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white">{stock.weight.toFixed(1)}%</td>
                      <td className={`py-3 px-4 ${stock.pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stock.pnlPercent >= 0 ? '+' : ''}{stock.pnlPercent.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(stock.riskLevel)}`}>
                          {getRiskIcon(stock.riskLevel)}
                          <span className="ml-1">{stock.riskLevel}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white">{stock.riskScore}/5</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
