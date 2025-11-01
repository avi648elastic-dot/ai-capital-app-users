'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { TrendingUp, TrendingDown, Target, AlertCircle, BarChart3, Shield, ArrowUp, ArrowDown } from 'lucide-react';
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
  investmentRecommendations?: Array<{
    ticker: string;
    action: 'INCREASE' | 'REDUCE' | 'HOLD';
    reason: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    currentWeight: number;
    suggestedWeight: number;
    qualityScore: number;
    qualityLevel: string;
  }>;
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
      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
        <CardSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return null; // Hide on error
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'HIGH':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4 border border-slate-700/30">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700/30">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs sm:text-sm font-bold text-white">AI Portfolio Insights</h3>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getRiskColor(data.insights.riskLevel)}`}>
          {data.insights.riskLevel}
        </span>
      </div>

      {/* Summary - Compact */}
      <div className="mb-3 text-xs text-slate-300 leading-relaxed">
        {data.summary}
      </div>

      {/* Key Metrics - Inline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <div className="bg-slate-900/40 rounded p-2 border border-slate-700/20">
          <div className="text-[10px] text-slate-400 mb-0.5">30D Return</div>
          <div className={`text-sm font-bold ${data.insights.performance30D >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.insights.performance30D >= 0 ? '+' : ''}{data.insights.performance30D.toFixed(1)}%
          </div>
        </div>
        <div className="bg-slate-900/40 rounded p-2 border border-slate-700/20">
          <div className="text-[10px] text-slate-400 mb-0.5">Volatility</div>
          <div className="text-sm font-bold text-yellow-400">
            {data.insights.volatility.toFixed(1)}%
          </div>
        </div>
        <div className="bg-slate-900/40 rounded p-2 border border-slate-700/20">
          <div className="text-[10px] text-slate-400 mb-0.5">Winners</div>
          <div className="text-sm font-bold text-green-400">
            {data.insights.winningStocks}/{data.insights.totalStocks}
          </div>
        </div>
        <div className="bg-slate-900/40 rounded p-2 border border-slate-700/20">
          <div className="text-[10px] text-slate-400 mb-0.5">Total P&L</div>
          <div className={`text-sm font-bold ${data.insights.totalPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.insights.totalPnLPercent >= 0 ? '+' : ''}{data.insights.totalPnLPercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Best Solid & Risky Stocks - Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        {/* Best Long-Term (Solid) */}
        {data.bestLongTerm.length > 0 && (
          <div className="bg-green-900/20 rounded-lg p-2 border border-green-500/30">
            <div className="flex items-center space-x-1 mb-2">
              <Target className="w-3 h-3 text-green-400" />
              <span className="text-[10px] font-bold text-green-400 uppercase">Best Long-Term</span>
            </div>
            <div className="space-y-1">
              {data.bestLongTerm.slice(0, 2).map((stock, index) => (
                <div key={index} className="text-xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-white">{stock.ticker}</span>
                    {stock.metrics?.returnPct !== undefined && (
                      <span className={`text-[10px] font-semibold ${
                        stock.metrics.returnPct >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {stock.metrics.returnPct >= 0 ? '+' : ''}{stock.metrics.returnPct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-300 leading-tight line-clamp-2">{stock.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Best Short-Term (Risky) */}
        {data.bestShortTerm.length > 0 && (
          <div className="bg-orange-900/20 rounded-lg p-2 border border-orange-500/30">
            <div className="flex items-center space-x-1 mb-2">
              <TrendingUp className="w-3 h-3 text-orange-400" />
              <span className="text-[10px] font-bold text-orange-400 uppercase">Best Short-Term</span>
            </div>
            <div className="space-y-1">
              {data.bestShortTerm.slice(0, 2).map((stock, index) => (
                <div key={index} className="text-xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-white">{stock.ticker}</span>
                    {stock.metrics?.returnPct !== undefined && (
                      <span className={`text-[10px] font-semibold ${
                        stock.metrics.returnPct >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {stock.metrics.returnPct >= 0 ? '+' : ''}{stock.metrics.returnPct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-300 leading-tight line-clamp-2">{stock.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Action Recommendations - Compact */}
      {data.investmentRecommendations && data.investmentRecommendations.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Action Recommendations</div>
          {data.investmentRecommendations.slice(0, 2).map((rec, index) => (
            <div key={index} className={`p-2 rounded border text-xs ${
              rec.action === 'INCREASE' 
                ? 'bg-green-900/20 border-green-500/30' 
                : 'bg-red-900/20 border-red-500/30'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  {rec.action === 'INCREASE' ? (
                    <ArrowUp className="w-3 h-3 text-green-400" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-red-400" />
                  )}
                  <span className="font-bold text-white">{rec.ticker}</span>
                  <span className={`px-1 py-0.5 rounded text-[9px] ${
                    rec.qualityLevel === 'EXCELLENT' ? 'bg-green-500/20 text-green-400' :
                    rec.qualityLevel === 'GOOD' ? 'bg-blue-500/20 text-blue-400' :
                    rec.qualityLevel === 'FAIR' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {rec.qualityLevel}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {rec.currentWeight.toFixed(1)}% → {rec.suggestedWeight.toFixed(1)}%
                </div>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed line-clamp-2">
                {rec.reason}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-slate-700/20">
        <p className="text-[9px] text-slate-500 text-center">
          AI-powered analysis • Updated daily
        </p>
      </div>
    </div>
  );
}
