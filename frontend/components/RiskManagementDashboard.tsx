'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { AlertTriangle, Shield, TrendingDown, TrendingUp, Activity, Bell, X, RefreshCw } from 'lucide-react';

interface RiskAlert {
  type: 'STOP_LOSS' | 'TAKE_PROFIT' | 'POSITION_SIZE' | 'PORTFOLIO_RISK' | 'MARKET_CONDITION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  ticker?: string;
  currentPrice?: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  portfolioId?: string;
  action: 'SELL' | 'HOLD' | 'REDUCE' | 'MONITOR';
  timestamp: string;
}

interface PositionRisk {
  ticker: string;
  currentPrice: number;
  entryPrice: number;
  shares: number;
  stopLoss?: number;
  takeProfit?: number;
  portfolioValue: number;
  portfolioPercentage: number;
  riskScore: number;
  alerts: RiskAlert[];
}

interface PortfolioRisk {
  portfolioId: string;
  totalValue: number;
  totalRisk: number;
  positionRisks: PositionRisk[];
  portfolioAlerts: RiskAlert[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface RiskSummary {
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  totalValue: number;
  weightedRisk: string;
  portfolioCount: number;
  criticalAlerts: number;
  highAlerts: number;
  portfolios: Array<{
    portfolioId: string;
    totalValue: number;
    totalRisk: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    alertCount: number;
  }>;
}

export default function RiskManagementDashboard() {
  const [riskSummary, setRiskSummary] = useState<RiskSummary | null>(null);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');
  const [portfolioRisk, setPortfolioRisk] = useState<PortfolioRisk | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchRiskData();
  }, []);

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      const [summaryResponse, alertsResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/risk/summary`, {
          headers: { Authorization: `Bearer ${Cookies.get('token')}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/risk/alerts`, {
          headers: { Authorization: `Bearer ${Cookies.get('token')}` }
        })
      ]);

      setRiskSummary(summaryResponse.data.data);
      setAlerts(alertsResponse.data.data);

      // Auto-select first portfolio if available
      if (summaryResponse.data.data.portfolios.length > 0) {
        setSelectedPortfolio(summaryResponse.data.data.portfolios[0].portfolioId);
      }
    } catch (error) {
      console.error('Error fetching risk data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioRisk = async (portfolioId: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/risk/portfolio/${portfolioId}`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      setPortfolioRisk(response.data.data);
    } catch (error) {
      console.error('Error fetching portfolio risk:', error);
    }
  };

  useEffect(() => {
    if (selectedPortfolio) {
      fetchPortfolioRisk(selectedPortfolio);
    }
  }, [selectedPortfolio]);

  const updateRiskDecisions = async () => {
    setUpdating(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/risk/update-decisions`, {}, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      await fetchRiskData();
      if (selectedPortfolio) {
        await fetchPortfolioRisk(selectedPortfolio);
      }
      alert('Risk management decisions updated successfully!');
    } catch (error) {
      console.error('Error updating risk decisions:', error);
      alert('Error updating risk decisions. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-400 bg-red-900/30';
      case 'HIGH': return 'text-orange-400 bg-orange-900/30';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-900/30';
      case 'LOW': return 'text-green-400 bg-green-900/30';
      default: return 'text-slate-400 bg-slate-900/30';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'HIGH': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'MEDIUM': return <Bell className="w-4 h-4 text-yellow-400" />;
      case 'LOW': return <Bell className="w-3 h-3 text-green-400" />;
      default: return <Bell className="w-3 h-3 text-slate-400" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Risk Management</h2>
          <p className="text-slate-400 text-sm">
            Monitor and manage portfolio risk in real-time
          </p>
        </div>
        <button
          onClick={updateRiskDecisions}
          disabled={updating}
          className="btn-primary flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
          <span>{updating ? 'Updating...' : 'Update Decisions'}</span>
        </button>
      </div>

      {riskSummary && (
        <>
          {/* Risk Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Overall Risk</h3>
                <Shield className="w-5 h-5 text-slate-400" />
              </div>
              <div className={`text-2xl font-bold ${getRiskColor(riskSummary.overallRiskLevel).split(' ')[0]}`}>
                {riskSummary.overallRiskLevel}
              </div>
              <div className="text-sm text-slate-400">
                {riskSummary.weightedRisk}% Risk Score
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Total Value</h3>
                <TrendingUp className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(riskSummary.totalValue)}
              </div>
              <div className="text-sm text-slate-400">
                {riskSummary.portfolioCount} portfolios
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Critical Alerts</h3>
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-400">
                {riskSummary.criticalAlerts}
              </div>
              <div className="text-sm text-slate-400">
                Immediate action required
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">High Alerts</h3>
                <Bell className="w-5 h-5 text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-orange-400">
                {riskSummary.highAlerts}
              </div>
              <div className="text-sm text-slate-400">
                Monitor closely
              </div>
            </div>
          </div>

          {/* Critical Alerts */}
          {alerts.filter(alert => alert.severity === 'CRITICAL').length > 0 && (
            <div className="card p-6 border-red-500/30 bg-red-900/10">
              <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Critical Risk Alerts
              </h3>
              <div className="space-y-3">
                {alerts.filter(alert => alert.severity === 'CRITICAL').map((alert, index) => (
                  <div key={index} className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getSeverityIcon(alert.severity)}
                          <span className="font-semibold text-red-400">
                            {alert.type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-red-300 text-sm mb-2">{alert.message}</p>
                        {alert.ticker && (
                          <div className="text-xs text-red-400">
                            {alert.ticker} • Current: {formatCurrency(alert.currentPrice || 0)} • 
                            Action: <span className="font-semibold">{alert.action}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Selection */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Portfolio Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {riskSummary.portfolios.map((portfolio) => (
                <button
                  key={portfolio.portfolioId}
                  onClick={() => setSelectedPortfolio(portfolio.portfolioId)}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    selectedPortfolio === portfolio.portfolioId
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">
                      {portfolio.portfolioId.replace('-', ' ').toUpperCase()}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${getRiskColor(portfolio.riskLevel)}`}>
                      {portfolio.riskLevel}
                    </span>
                  </div>
                  <div className="text-sm text-slate-400 space-y-1">
                    <div>Value: {formatCurrency(portfolio.totalValue)}</div>
                    <div>Risk: {portfolio.totalRisk}%</div>
                    <div>Alerts: {portfolio.alertCount}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Portfolio Details */}
            {portfolioRisk && selectedPortfolio && (
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-white">
                  {selectedPortfolio.replace('-', ' ').toUpperCase()} - Position Analysis
                </h4>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-2 text-slate-300">Ticker</th>
                        <th className="text-left py-2 text-slate-300">Position</th>
                        <th className="text-left py-2 text-slate-300">Risk Score</th>
                        <th className="text-left py-2 text-slate-300">Alerts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioRisk.positionRisks.map((position, index) => (
                        <tr key={index} className="border-b border-slate-800">
                          <td className="py-3">
                            <div className="font-medium text-white">{position.ticker}</div>
                            <div className="text-xs text-slate-400">
                              {position.portfolioPercentage.toFixed(1)}% of portfolio
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="text-white">
                              {formatCurrency(position.portfolioValue)}
                            </div>
                            <div className="text-xs text-slate-400">
                              Entry: {formatCurrency(position.entryPrice)} → Current: {formatCurrency(position.currentPrice)}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${
                                position.riskScore >= 80 ? 'bg-red-400' :
                                position.riskScore >= 60 ? 'bg-orange-400' :
                                position.riskScore >= 40 ? 'bg-yellow-400' : 'bg-green-400'
                              }`}></div>
                              <span className="text-white">{position.riskScore}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="space-y-1">
                              {position.alerts.map((alert, alertIndex) => (
                                <div key={alertIndex} className="flex items-center space-x-1">
                                  {getSeverityIcon(alert.severity)}
                                  <span className={`text-xs ${
                                    alert.severity === 'CRITICAL' ? 'text-red-400' :
                                    alert.severity === 'HIGH' ? 'text-orange-400' :
                                    alert.severity === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'
                                  }`}>
                                    {alert.action}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* All Alerts */}
          {alerts.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                All Risk Alerts
              </h3>
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    alert.severity === 'CRITICAL' ? 'border-red-500/30 bg-red-900/10' :
                    alert.severity === 'HIGH' ? 'border-orange-500/30 bg-orange-900/10' :
                    alert.severity === 'MEDIUM' ? 'border-yellow-500/30 bg-yellow-900/10' :
                    'border-green-500/30 bg-green-900/10'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getSeverityIcon(alert.severity)}
                          <span className={`font-semibold ${
                            alert.severity === 'CRITICAL' ? 'text-red-400' :
                            alert.severity === 'HIGH' ? 'text-orange-400' :
                            alert.severity === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            {alert.type.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getRiskColor(alert.action)}`}>
                            {alert.action}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm mb-2">{alert.message}</p>
                        {alert.ticker && (
                          <div className="text-xs text-slate-400">
                            {alert.ticker} • {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
