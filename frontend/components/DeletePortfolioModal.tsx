'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { X, Trash2, AlertTriangle, Shield, TrendingUp } from 'lucide-react';

interface Portfolio {
  portfolioId: string;
  portfolioType: 'solid' | 'risky';
  portfolioName: string;
  stocks: any[];
  totals: {
    initial: number;
    current: number;
    totalPnL: number;
    totalPnLPercent: number;
  };
}

interface DeletePortfolioModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeletePortfolioModal({ onClose, onSuccess }: DeletePortfolioModalProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      
      // Group stocks by portfolioId to create portfolio objects
      const portfolioMap = new Map<string, Portfolio>();
      const stocks = response.data.portfolio || [];
      
      stocks.forEach((stock: any) => {
        const portfolioId = stock.portfolioId || `${stock.portfolioType}-1`;
        
        if (!portfolioMap.has(portfolioId)) {
          portfolioMap.set(portfolioId, {
            portfolioId,
            portfolioType: stock.portfolioType,
            portfolioName: stock.portfolioName || `${stock.portfolioType.charAt(0).toUpperCase() + stock.portfolioType.slice(1)} Portfolio`,
            stocks: [],
            totals: { initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 }
          });
        }
        
        portfolioMap.get(portfolioId)!.stocks.push(stock);
      });
      
      // Calculate totals for each portfolio
      portfolioMap.forEach((portfolio) => {
        const initial = portfolio.stocks.reduce((sum, s) => sum + (s.entryPrice * s.shares), 0);
        const current = portfolio.stocks.reduce((sum, s) => sum + (s.currentPrice * s.shares), 0);
        const totalPnL = current - initial;
        const totalPnLPercent = initial > 0 ? (totalPnL / initial) * 100 : 0;

        portfolio.totals = { initial, current, totalPnL, totalPnLPercent };
      });

      const portfolioArray = Array.from(portfolioMap.values());
      setPortfolios(portfolioArray);
    } catch (error) {
      console.error('Error fetching portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPortfolioId) return;

    setDeleting(true);
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/portfolios/${selectedPortfolioId}`,
        { headers: { Authorization: `Bearer ${Cookies.get('token')}` } }
      );
      
      if (response.data.success) {
        alert(`Portfolio deleted successfully!`);
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error deleting portfolio:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete portfolio';
      alert(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const selectedPortfolio = portfolios.find(p => p.portfolioId === selectedPortfolioId);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-3"></div>
            <span className="text-white">Loading portfolios...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Trash2 className="w-5 h-5 mr-2 text-red-400" />
            Delete Portfolio
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Portfolio Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Portfolio to Delete <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
              {portfolios.map((portfolio) => (
                <button
                  key={portfolio.portfolioId}
                  onClick={() => {
                    setSelectedPortfolioId(portfolio.portfolioId);
                    setConfirmDelete(false);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedPortfolioId === portfolio.portfolioId
                      ? 'border-red-500 bg-red-500/20 text-red-300'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-red-400 hover:bg-red-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {portfolio.portfolioType === 'solid' ? (
                        <Shield className="w-5 h-5 text-blue-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-orange-400" />
                      )}
                      <div>
                        <div className="font-semibold">{portfolio.portfolioName}</div>
                        <div className="text-sm text-slate-400">
                          {portfolio.portfolioType.toUpperCase()} • {portfolio.stocks.length} stocks
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ${portfolio.totals.current.toLocaleString()}
                      </div>
                      <div className={`text-sm ${
                        portfolio.totals.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {portfolio.totals.totalPnL >= 0 ? '+' : ''}
                        {portfolio.totals.totalPnLPercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Confirmation Step */}
          {selectedPortfolio && !confirmDelete && (
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">Confirm Deletion</span>
              </div>
              <p className="text-slate-300 text-sm mb-4">
                You are about to delete <strong>{selectedPortfolio.portfolioName}</strong> with {selectedPortfolio.stocks.length} stocks worth ${selectedPortfolio.totals.current.toLocaleString()}. This action cannot be undone.
              </p>
              <button
                onClick={() => {
                  console.log('🔍 [DELETE PORTFOLIO] Confirmation button clicked');
                  setConfirmDelete(true);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Yes, I want to delete this portfolio
              </button>
            </div>
          )}

          {/* Final Confirmation */}
          {selectedPortfolio && confirmDelete && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Trash2 className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-semibold">Final Confirmation</span>
              </div>
              <div className="mb-3 p-2 bg-slate-800 rounded text-xs text-green-400">
                🔧 DEBUG: selectedPortfolio: {selectedPortfolio ? 'YES' : 'NO'} | confirmDelete: {confirmDelete ? 'YES' : 'NO'} | deleting: {deleting ? 'YES' : 'NO'}
              </div>
              <div className="space-y-3">
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {selectedPortfolio.portfolioType === 'solid' ? (
                        <Shield className="w-5 h-5 text-blue-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-orange-400" />
                      )}
                      <div>
                        <div className="font-semibold text-white">{selectedPortfolio.portfolioName}</div>
                        <div className="text-sm text-slate-400">
                          {selectedPortfolio.portfolioType.toUpperCase()} • {selectedPortfolio.stocks.length} stocks
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-white">
                        ${selectedPortfolio.totals.current.toLocaleString()}
                      </div>
                      <div className={`text-sm ${
                        selectedPortfolio.totals.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {selectedPortfolio.totals.totalPnL >= 0 ? '+' : ''}
                        {selectedPortfolio.totals.totalPnLPercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-red-300 text-sm">
                  ⚠️ This will permanently delete all stocks and data in this portfolio. This action cannot be undone.
                </p>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                console.log('🔍 [DELETE PORTFOLIO] Delete button clicked');
                console.log('🔍 [DELETE PORTFOLIO] selectedPortfolio:', selectedPortfolio);
                console.log('🔍 [DELETE PORTFOLIO] confirmDelete:', confirmDelete);
                console.log('🔍 [DELETE PORTFOLIO] deleting:', deleting);
                console.log('🔍 [DELETE PORTFOLIO] Button disabled?', !selectedPortfolio || !confirmDelete || deleting);
                handleDelete();
              }}
              disabled={!selectedPortfolio || !confirmDelete || deleting}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                !selectedPortfolio || !confirmDelete || deleting
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Portfolio
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
