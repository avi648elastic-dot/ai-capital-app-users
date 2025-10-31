'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { TrendingUp, TrendingDown, Target, AlertCircle, Info, BarChart3, Shield, ArrowUp, ArrowDown } from 'lucide-react';
import { CardSkeleton } from './ui/SkeletonLoader';

interface PortfolioDetailsData {
  summary: string;
  bestLongTerm: Array<{
    ticker: string;
    reason: string;
    metrics?: any;
  }>;
  bestShortTerm: Array<{
    ticker: string;
    reason: string;
    metrics?: any;
  }>;
  insights: {
    performance30D: number;
    volatility: number;
    winningStocks: number;
    totalStocks: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    totalValue: number;
    totalPnLPercent: number;
  };
}

export default function PortfolioDetails() {
  const [data, setData] = useState<PortfolioDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortfolioDetails();
  }, []);

  const fetchPortfolioDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = Cookies.get('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com';
      
      const response = await axios.get(`${apiUrl}/api/portfolio-details/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setData(response.data);
    } catch (err: any) {
      console.error('Error fetching portfolio details:', err);
      setError(err.response?.data?.message || 'Failed to load portfolio details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-6 border border-slate-700/50 shadow-xl mb-6">
        <CardSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-6 border border-red-500/30 shadow-xl mb-6">
        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error || 'Unable to load portfolio details'}</p>
        </div>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'text-green-400 bg-green-500/20';
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'HIGH':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/95 via-purple-900/20 to-slate-900/95 rounded-2xl p-6 md:p-8 border border-slate-700/50 shadow-2xl mb-6 backdrop-blur-sm">
      {/* AI-Enhanced Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-pulse opacity-50"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        {/* Header - AI-Enhanced Design */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
          <div className="flex items-center space-x-3 mb-3 sm:mb-0">
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-pink-500/30 flex items-center justify-center border border-blue-400/40 shadow-lg shadow-blue-500/20">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/20 to-purple-400/20 animate-pulse"></div>
              <BarChart3 className="w-6 h-6 text-blue-300 relative z-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                Portfolio Intelligence
              </h2>
              <p className="text-sm text-slate-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span>AI-powered analysis & recommendations</span>
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg text-xs font-semibold backdrop-blur-sm border ${getRiskColor(data.insights.riskLevel)} border-opacity-30 shadow-lg`}>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>{data.insights.riskLevel} Risk</span>
            </div>
          </div>
        </div>

        {/* 3-Sentence Summary - AI-Enhanced */}
        <div className="mb-6 p-5 bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/40 backdrop-blur-sm shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          <div className="flex items-start space-x-3">
            <div className="relative mt-0.5">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md animate-pulse"></div>
              <Info className="w-6 h-6 text-blue-400 relative z-10" />
            </div>
            <p className="text-slate-200 leading-relaxed text-sm sm:text-base flex-1">{data.summary}</p>
          </div>
        </div>

        {/* Insights Grid - AI-Enhanced Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="group relative bg-gradient-to-br from-green-900/30 to-emerald-900/20 rounded-xl p-4 border border-green-500/30 backdrop-blur-sm hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-xs text-slate-400 mb-2 flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>30D Return</span>
              </div>
              <div className={`text-xl font-bold ${data.insights.performance30D >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data.insights.performance30D >= 0 ? '+' : ''}{data.insights.performance30D.toFixed(2)}%
              </div>
            </div>
          </div>
          <div className="group relative bg-gradient-to-br from-yellow-900/30 to-amber-900/20 rounded-xl p-4 border border-yellow-500/30 backdrop-blur-sm hover:border-yellow-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-xs text-slate-400 mb-2 flex items-center space-x-1">
                <BarChart3 className="w-3 h-3" />
                <span>Volatility</span>
              </div>
              <div className="text-xl font-bold text-yellow-400">
                {data.insights.volatility.toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="group relative bg-gradient-to-br from-blue-900/30 to-cyan-900/20 rounded-xl p-4 border border-blue-500/30 backdrop-blur-sm hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-xs text-slate-400 mb-2 flex items-center space-x-1">
                <Target className="w-3 h-3" />
                <span>Winners</span>
              </div>
              <div className="text-xl font-bold text-green-400">
                {data.insights.winningStocks}/{data.insights.totalStocks}
              </div>
            </div>
          </div>
          <div className="group relative bg-gradient-to-br from-purple-900/30 to-pink-900/20 rounded-xl p-4 border border-purple-500/30 backdrop-blur-sm hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-xs text-slate-400 mb-2 flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>Total P&L</span>
              </div>
              <div className={`text-xl font-bold ${data.insights.totalPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data.insights.totalPnLPercent >= 0 ? '+' : ''}{data.insights.totalPnLPercent.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Best Stocks Recommendations - AI-Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Best Long-Term Stocks (Solid) */}
          <div className="relative bg-gradient-to-br from-green-900/30 via-emerald-900/20 to-teal-900/20 rounded-xl p-5 border border-green-500/40 backdrop-blur-sm shadow-xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center border border-green-400/40">
                  <Target className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">Best for Long-Term</h3>
                  <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full border border-green-400/30">Solid Portfolio</span>
                </div>
              </div>
              {data.bestLongTerm.length > 0 ? (
                <div className="space-y-3">
                  {data.bestLongTerm.map((stock, index) => (
                    <div key={stock.ticker} className="group/stock bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg p-4 border border-slate-700/40 hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{stock.ticker}</span>
                          {stock.metrics?.returnPct !== undefined && (
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm ${
                              stock.metrics.returnPct >= 0 
                                ? 'bg-green-500/20 text-green-400 border border-green-400/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-400/30'
                            }`}>
                              {stock.metrics.returnPct >= 0 ? '+' : ''}{stock.metrics.returnPct.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">{stock.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No solid long-term candidates found in your portfolio.</p>
              )}
            </div>
          </div>

          {/* Best Short-Term Stocks (Risky) */}
          <div className="relative bg-gradient-to-br from-orange-900/30 via-red-900/20 to-pink-900/20 rounded-xl p-5 border border-orange-500/40 backdrop-blur-sm shadow-xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/30 to-red-500/30 flex items-center justify-center border border-orange-400/40">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">Best for Short-Term</h3>
                  <span className="text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded-full border border-orange-400/30">Risky Portfolio</span>
                </div>
              </div>
              {data.bestShortTerm.length > 0 ? (
                <div className="space-y-3">
                  {data.bestShortTerm.map((stock, index) => (
                    <div key={stock.ticker} className="group/stock bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg p-4 border border-slate-700/40 hover:border-orange-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">{stock.ticker}</span>
                          {stock.metrics?.returnPct !== undefined && (
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm ${
                              stock.metrics.returnPct >= 0 
                                ? 'bg-green-500/20 text-green-400 border border-green-400/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-400/30'
                            }`}>
                              {stock.metrics.returnPct >= 0 ? '+' : ''}{stock.metrics.returnPct.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">{stock.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No high-momentum short-term candidates found in your portfolio.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Note - AI-Enhanced */}
        <div className="mt-6 pt-5 border-t border-slate-700/40">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse"></div>
            <p className="text-xs text-slate-400 text-center">
              Powered by AI analysis of portfolio performance, risk metrics, and decision engine signals
            </p>
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

