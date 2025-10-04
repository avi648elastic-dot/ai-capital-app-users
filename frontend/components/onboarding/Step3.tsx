'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface GeneratedStock {
  ticker: string;
  shares: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  allocation: number;
  riskScore: number;
  action?: string;
  reason?: string;
  color?: string;
}

interface Step3Props {
  onboardingData: any;
  onComplete: () => void;
  onBack: () => void;
}

export default function Step3({ onboardingData, onComplete, onBack }: Step3Props) {
  const [portfolio, setPortfolio] = useState<GeneratedStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (onboardingData.generatedPortfolio) {
      setPortfolio(onboardingData.generatedPortfolio);
    } else if (onboardingData.stocks) {
      // Convert imported stocks to the same format
      const convertedStocks = onboardingData.stocks.map((stock: any) => ({
        ticker: stock.ticker,
        shares: stock.shares,
        entryPrice: stock.entryPrice,
        currentPrice: stock.currentPrice,
        stopLoss: 0, // Will be calculated
        takeProfit: 0, // Will be calculated
        allocation: 0, // Will be calculated
        riskScore: 0,
        action: 'HOLD',
        reason: 'Imported portfolio',
        color: 'yellow',
      }));
      setPortfolio(convertedStocks);
    }
  }, [onboardingData]);

  const handleConfirm = async () => {
    setConfirming(true);

    try {
      if (onboardingData.generatedPortfolio) {
        // Confirm AI-generated portfolio
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/confirm-portfolio`, {
          portfolio: portfolio,
        }, {
          headers: { Authorization: `Bearer ${Cookies.get('token')}` }
        });
      }
      // For imported portfolios, they're already saved in Step2a
      
      onComplete();
    } catch (error) {
      console.error('Error confirming portfolio:', error);
      alert('Error confirming portfolio. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent.toFixed(1)}%`;
  };

  const calculateTotals = () => {
    return portfolio.reduce((acc, stock) => {
      const cost = stock.entryPrice * stock.shares;
      const value = stock.currentPrice * stock.shares;
      const pnl = value - cost;
      
      return {
        totalCost: acc.totalCost + cost,
        totalValue: acc.totalValue + value,
        totalPnL: acc.totalPnL + pnl,
      };
    }, { totalCost: 0, totalValue: 0, totalPnL: 0 });
  };

  const totals = calculateTotals();

  return (
    <div>
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-400 hover:text-white mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <h2 className="text-2xl font-bold text-white">Portfolio Summary</h2>
      </div>

      <p className="text-gray-400 mb-8">
        Review your {onboardingData.portfolioType === 'imported' ? 'imported' : 'AI-generated'} portfolio below. 
        You can make changes or confirm to proceed to your dashboard.
      </p>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Investment</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totals.totalCost)}</p>
            </div>
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Current Value</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totals.totalValue)}</p>
            </div>
            <div className="w-12 h-12 bg-success-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">P&L</p>
              <p className={`text-2xl font-bold ${
                totals.totalPnL >= 0 ? 'text-success-400' : 'text-danger-400'
              }`}>
                {formatCurrency(totals.totalPnL)}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              totals.totalPnL >= 0 ? 'bg-success-600' : 'bg-danger-600'
            }`}>
              {totals.totalPnL >= 0 ? (
                <TrendingUp className="w-6 h-6 text-white" />
              ) : (
                <TrendingDown className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Details */}
      <div className="card overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Portfolio Holdings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ticker</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Shares</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Entry Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Current Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Stop Loss</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Take Profit</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Allocation</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {portfolio.map((stock, index) => {
                const cost = stock.entryPrice * stock.shares;
                const value = stock.currentPrice * stock.shares;
                const pnl = value - cost;
                const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

                return (
                  <tr key={index} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{stock.ticker}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{stock.shares.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{formatCurrency(stock.entryPrice)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{formatCurrency(stock.currentPrice)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{formatCurrency(stock.stopLoss)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{formatCurrency(stock.takeProfit)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{formatPercent(stock.allocation)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        stock.action === 'BUY' ? 'text-success-400 bg-success-900' :
                        stock.action === 'SELL' ? 'text-danger-400 bg-danger-900' :
                        'text-warning-400 bg-warning-900'
                      }`}>
                        {stock.action}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={onBack}
          className="btn-secondary"
          disabled={confirming}
        >
          Back
        </button>
        <button
          onClick={handleConfirm}
          className="btn-primary flex items-center"
          disabled={confirming}
        >
          {confirming ? 'Confirming...' : 'Confirm Portfolio'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
}
