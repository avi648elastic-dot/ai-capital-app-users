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
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-6 border border-slate-700/50 shadow-xl mb-6">
      {/* Header - Clear Visual Separator */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Your Portfolio Details</h2>
            <p className="text-sm text-slate-400">Personal investment analysis and recommendations</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(data.insights.riskLevel)}`}>
          {data.insights.riskLevel} Risk
        </div>
      </div>

      {/* 3-Sentence Summary */}
      <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/30">
        <div className="flex items-start space-x-3 mb-2">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-slate-200 leading-relaxed text-sm sm:text-base">{data.summary}</p>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
          <div className="text-xs text-slate-400 mb-1">30D Return</div>
          <div className={`text-lg font-bold ${data.insights.performance30D >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.insights.performance30D >= 0 ? '+' : ''}{data.insights.performance30D.toFixed(2)}%
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
          <div className="text-xs text-slate-400 mb-1">Volatility</div>
          <div className="text-lg font-bold text-yellow-400">
            {data.insights.volatility.toFixed(1)}%
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
          <div className="text-xs text-slate-400 mb-1">Winners</div>
          <div className="text-lg font-bold text-green-400">
            {data.insights.winningStocks}/{data.insights.totalStocks}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
          <div className="text-xs text-slate-400 mb-1">Total P&L</div>
          <div className={`text-lg font-bold ${data.insights.totalPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.insights.totalPnLPercent >= 0 ? '+' : ''}{data.insights.totalPnLPercent.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Best Stocks Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Best Long-Term Stocks (Solid) */}
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-lg p-4 border border-green-500/30">
          <div className="flex items-center space-x-2 mb-3">
            <Target className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Best for Long-Term</h3>
            <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">Solid</span>
          </div>
          {data.bestLongTerm.length > 0 ? (
            <div className="space-y-3">
              {data.bestLongTerm.map((stock, index) => (
                <div key={stock.ticker} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-green-400">{stock.ticker}</span>
                      {stock.metrics?.returnPct !== undefined && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          stock.metrics.returnPct >= 0 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {stock.metrics.returnPct >= 0 ? '+' : ''}{stock.metrics.returnPct.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{stock.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No solid long-term candidates found in your portfolio.</p>
          )}
        </div>

        {/* Best Short-Term Stocks (Risky) */}
        <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-lg p-4 border border-orange-500/30">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Best for Short-Term</h3>
            <span className="text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded-full">Risky</span>
          </div>
          {data.bestShortTerm.length > 0 ? (
            <div className="space-y-3">
              {data.bestShortTerm.map((stock, index) => (
                <div key={stock.ticker} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-orange-400">{stock.ticker}</span>
                      {stock.metrics?.returnPct !== undefined && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          stock.metrics.returnPct >= 0 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {stock.metrics.returnPct >= 0 ? '+' : ''}{stock.metrics.returnPct.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{stock.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No high-momentum short-term candidates found in your portfolio.</p>
          )}
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-6 pt-4 border-t border-slate-700/30">
        <p className="text-xs text-slate-500 text-center">
          Recommendations are based on your portfolio's performance, risk analysis, and decision engine signals.
        </p>
      </div>
    </div>
  );
}

