'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  Award, 
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Percent
} from 'lucide-react';

interface ExpertPortfolioItem {
  _id: string;
  ticker: string;
  shares: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  action: 'BUY' | 'HOLD' | 'SELL';
  reason?: string;
  notes?: string;
  portfolioType: 'solid' | 'risky';
  portfolioId: string;
  portfolioName?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface ExpertInfo {
  name: string;
  reputation: number;
  totalPositionsClosed: number;
  winRate: number;
  averageReturn?: number;
}

export default function ExpertPortfolioPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<ExpertPortfolioItem[]>([]);
  const [expert, setExpert] = useState<ExpertInfo | null>(null);
  const [totals, setTotals] = useState({
    initial: 0,
    current: 0,
    totalPnL: 0,
    totalPnLPercent: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExpertPortfolio();
    const interval = setInterval(fetchExpertPortfolio, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchExpertPortfolio = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com';
      const token = Cookies.get('token');
      
      if (!token) {
        router.push('/');
        return;
      }

      const response = await axios.get(`${apiUrl}/api/expert-portfolio`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPortfolio(response.data.portfolio);
        setExpert(response.data.expert);
        setTotals(response.data.totals);
        setError(null);
      }
    } catch (err: any) {
      console.error('Error fetching expert portfolio:', err);
      setError(err.response?.data?.message || 'Failed to load expert portfolio');
    } finally {
      setLoading(false);
    }
  };

  const calculatePnL = (item: ExpertPortfolioItem) => {
    const pnl = item.shares * (item.currentPrice - item.entryPrice);
    const pnlPercent = ((item.currentPrice - item.entryPrice) / item.entryPrice) * 100;
    return { pnl, pnlPercent };
  };

  const getStopLossDistance = (item: ExpertPortfolioItem) => {
    if (!item.stopLoss) return null;
    const distance = ((item.currentPrice - item.stopLoss) / item.currentPrice) * 100;
    return distance;
  };

  const getTakeProfitDistance = (item: ExpertPortfolioItem) => {
    if (!item.takeProfit) return null;
    const distance = ((item.takeProfit - item.currentPrice) / item.currentPrice) * 100;
    return distance;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'SELL': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'HOLD': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY': return <TrendingUp className="w-4 h-4" />;
      case 'SELL': return <TrendingDown className="w-4 h-4" />;
      case 'HOLD': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
            <div className="flex items-center mb-2">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-red-400">Error Loading Expert Portfolio</h3>
            </div>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Award className="w-8 h-8 text-yellow-500 mr-3" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Expert Portfolio
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Learn from professional trading strategies and investment decisions
          </p>
        </div>

        {/* Expert Info Card */}
        {expert && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="card bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-6">
              <div className="flex items-center mb-2">
                <Award className="w-5 h-5 text-emerald-400 mr-2" />
                <h3 className="text-sm font-medium text-slate-400">Expert Trader</h3>
              </div>
              <p className="text-2xl font-bold text-white">{expert.name}</p>
            </div>

            <div className="card bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center mb-2">
                <DollarSign className="w-5 h-5 text-emerald-400 mr-2" />
                <h3 className="text-sm font-medium text-slate-400">Total Reputation</h3>
              </div>
              <p className={`text-2xl font-bold ${expert.reputation >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${expert.reputation.toFixed(2)}
              </p>
            </div>

            <div className="card bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center mb-2">
                <BarChart3 className="w-5 h-5 text-blue-400 mr-2" />
                <h3 className="text-sm font-medium text-slate-400">Closed Positions</h3>
              </div>
              <p className="text-2xl font-bold text-white">{expert.totalPositionsClosed}</p>
            </div>

            <div className="card bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center mb-2">
                <Percent className="w-5 h-5 text-purple-400 mr-2" />
                <h3 className="text-sm font-medium text-slate-400">Win Rate</h3>
              </div>
              <p className="text-2xl font-bold text-white">{expert.winRate.toFixed(1)}%</p>
            </div>
          </div>
        )}

        {/* Portfolio Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-1">Initial Investment</h3>
            <p className="text-2xl font-bold text-white">${totals.initial.toLocaleString()}</p>
          </div>

          <div className="card bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-1">Current Value</h3>
            <p className="text-2xl font-bold text-white">${totals.current.toLocaleString()}</p>
          </div>

          <div className="card bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-1">Total P&L</h3>
            <p className={`text-2xl font-bold ${totals.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totals.totalPnL >= 0 ? '+' : ''}${totals.totalPnL.toLocaleString()}
            </p>
          </div>

          <div className="card bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-1">Return</h3>
            <p className={`text-2xl font-bold ${totals.totalPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totals.totalPnLPercent >= 0 ? '+' : ''}{totals.totalPnLPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Educational Banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-blue-400 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-2">📚 Educational Purpose</h3>
              <p className="text-blue-300 text-sm leading-relaxed">
                This portfolio is shared for educational purposes. Study the expert's entry points, stop losses, 
                and take profit targets to learn professional trading strategies. Remember: past performance 
                does not guarantee future results. Always do your own research before investing.
              </p>
            </div>
          </div>
        </div>

        {/* Portfolio Grid */}
        {portfolio.length === 0 ? (
          <div className="card bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
            <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No Positions Yet</h3>
            <p className="text-slate-500">The expert portfolio is currently empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {portfolio.map(item => {
              const { pnl, pnlPercent } = calculatePnL(item);
              const stopLossDistance = getStopLossDistance(item);
              const takeProfitDistance = getTakeProfitDistance(item);

              return (
                <div 
                  key={item._id} 
                  className="card bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-emerald-500/20 rounded-lg p-2">
                        <BarChart3 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{item.ticker}</h3>
                        <p className="text-sm text-slate-400 capitalize">{item.portfolioType} Portfolio</p>
                      </div>
                    </div>
                    <div className={`flex items-center px-3 py-1 rounded-full border ${getActionColor(item.action)}`}>
                      {getActionIcon(item.action)}
                      <span className="ml-2 text-sm font-bold">{item.action}</span>
                    </div>
                  </div>

                  {/* Price Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <p className="text-xs text-slate-500 mb-1">Entry Price</p>
                      <p className="text-lg font-bold text-white">${item.entryPrice.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <p className="text-xs text-slate-500 mb-1">Current Price</p>
                      <p className="text-lg font-bold text-emerald-400">${item.currentPrice.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Shares & P&L */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <p className="text-xs text-slate-500 mb-1">Shares</p>
                      <p className="text-lg font-bold text-white">{item.shares}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <p className="text-xs text-slate-500 mb-1">P&L</p>
                      <p className={`text-lg font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                      </p>
                    </div>
                  </div>

                  {/* Stop Loss & Take Profit - KEY EDUCATIONAL FEATURE */}
                  <div className="border-t border-slate-700 pt-4 mb-4">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-emerald-400" />
                      Risk Management Strategy
                    </h4>
                    
                    <div className="space-y-3">
                      {/* Stop Loss */}
                      {item.stopLoss ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Shield className="w-4 h-4 text-red-400 mr-2" />
                              <span className="text-sm font-medium text-red-400">Stop Loss</span>
                            </div>
                            <span className="text-lg font-bold text-red-400">${item.stopLoss.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Distance from current:</span>
                            <span className={`font-semibold ${stopLossDistance && stopLossDistance > 0 ? 'text-red-400' : 'text-red-300'}`}>
                              {stopLossDistance ? `${stopLossDistance.toFixed(1)}%` : 'N/A'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            💡 Exit if price falls to this level to limit losses
                          </p>
                        </div>
                      ) : (
                        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
                          <p className="text-sm text-slate-500">⚠️ No stop loss set</p>
                        </div>
                      )}

                      {/* Take Profit */}
                      {item.takeProfit ? (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Target className="w-4 h-4 text-green-400 mr-2" />
                              <span className="text-sm font-medium text-green-400">Take Profit</span>
                            </div>
                            <span className="text-lg font-bold text-green-400">${item.takeProfit.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Distance to target:</span>
                            <span className={`font-semibold ${takeProfitDistance && takeProfitDistance > 0 ? 'text-green-400' : 'text-green-300'}`}>
                              {takeProfitDistance ? `${takeProfitDistance.toFixed(1)}%` : 'N/A'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            💡 Exit if price reaches this target to secure profits
                          </p>
                        </div>
                      ) : (
                        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
                          <p className="text-sm text-slate-500">ℹ️ No take profit set</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Risk/Reward Ratio */}
                  {item.stopLoss && item.takeProfit && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-400 font-medium">Risk/Reward Ratio</span>
                        <span className="text-lg font-bold text-blue-400">
                          1:{((item.takeProfit - item.currentPrice) / (item.currentPrice - item.stopLoss)).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        💡 Potential reward vs. risk if trade reaches targets
                      </p>
                    </div>
                  )}

                  {/* Trade Reasoning */}
                  {item.reason && (
                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-3">
                      <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-blue-400" />
                        Expert's Analysis
                      </h4>
                      <p className="text-sm text-slate-400 leading-relaxed">{item.reason}</p>
                    </div>
                  )}

                  {/* Additional Notes */}
                  {item.notes && (
                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-slate-300 mb-2">Notes</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">{item.notes}</p>
                    </div>
                  )}

                  {/* Entry Date */}
                  <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Entered: {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${item.portfolioType === 'solid' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                      {item.portfolioType === 'solid' ? '🛡️ Solid' : '⚡ Risky'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Educational Tips Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-6">
            <div className="bg-blue-500/20 rounded-lg p-3 w-fit mb-4">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Stop Loss Strategy</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Always set a stop loss to protect your capital. The expert typically sets stop losses 
              5-10% below entry price for solid stocks and 8-15% for risky stocks.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-6">
            <div className="bg-green-500/20 rounded-lg p-3 w-fit mb-4">
              <Target className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Take Profit Targets</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Set realistic profit targets based on technical analysis. The expert aims for 
              2:1 or 3:1 risk/reward ratios, meaning targeting 20-30% gains with 10% stop loss.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6">
            <div className="bg-purple-500/20 rounded-lg p-3 w-fit mb-4">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Position Sizing</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Notice how the expert diversifies across multiple positions. Never put all your 
              capital in one stock. The expert typically allocates 5-10% per position for solid stocks.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">⚠️ Investment Disclaimer</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            This portfolio is shared for educational purposes only and does not constitute financial advice. 
            Past performance is not indicative of future results. All investments carry risk, including the 
            potential loss of principal. You should conduct your own research and consult with a qualified 
            financial advisor before making any investment decisions. The expert trader is not responsible 
            for any losses incurred from following these positions.
          </p>
        </div>
      </div>
    </div>
  );
}

