"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Shield, AlertTriangle, Target, TrendingDown, TrendingUp, BarChart3, Activity } from 'lucide-react';

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
        recommendations: riskAnalytics.recommendations || []
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

          {/* Recommendations */}
          {riskData.recommendations.length > 0 && (
            <div className="card p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Risk Recommendations
              </h2>
              <div className="space-y-4">
                {riskData.recommendations.map((rec: any, index: number) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    rec.type === 'warning' ? 'bg-red-900/20 border-red-700/50' :
                    rec.type === 'info' ? 'bg-blue-900/20 border-blue-700/50' :
                    'bg-slate-800/50 border-slate-700/50'
                  }`}>
                    <div className="flex items-start">
                      <rec.icon className={`w-5 h-5 mr-3 mt-0.5 ${
                        rec.type === 'warning' ? 'text-red-400' :
                        rec.type === 'info' ? 'text-blue-400' :
                        'text-slate-400'
                      }`} />
                      <div>
                        <h3 className="font-semibold text-white mb-1">{rec.title}</h3>
                        <p className="text-slate-400 text-sm">{rec.message}</p>
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
                          <div className="font-semibold text-white">{stock.ticker}</div>
                          <div className="text-sm text-slate-400">{stock.shares} shares</div>
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
