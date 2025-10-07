'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Plus, Trash2, Eye, TrendingUp, DollarSign } from 'lucide-react';

interface Portfolio {
  portfolioId: string;
  portfolioType: 'solid' | 'dangerous';
  portfolioName: string;
  stocks: any[];
  totals: {
    initial: number;
    current: number;
    totalPnL: number;
    totalPnLPercent: number;
  };
}

interface MultiPortfolioDashboardProps {
  user: any;
  onAddStock: (portfolioId: string) => void;
  onViewPortfolio: (portfolioId: string) => void;
}

export default function MultiPortfolioDashboard({ user, onAddStock, onViewPortfolio }: MultiPortfolioDashboardProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'solid' | 'dangerous'>('solid');

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolios`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      setPortfolios(response.data.portfolios);
    } catch (error) {
      console.error('Error fetching portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPortfolio = async (type: 'solid' | 'dangerous') => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolios/create`, {
        portfolioType: type,
        portfolioName: `${type.charAt(0).toUpperCase() + type.slice(1)} Portfolio ${portfolios.filter(p => p.portfolioType === type).length + 1}`
      }, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      
      await fetchPortfolios(); // Refresh the list
    } catch (error) {
      console.error('Error creating portfolio:', error);
      alert('Error creating portfolio. Please try again.');
    }
  };

  const deletePortfolio = async (portfolioId: string) => {
    if (!confirm('Are you sure you want to delete this portfolio? All stocks will be permanently removed.')) {
      return;
    }

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolios/${portfolioId}`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      
      await fetchPortfolios(); // Refresh the list
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      alert('Error deleting portfolio. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const filteredPortfolios = portfolios.filter(p => p.portfolioType === selectedType);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Type Tabs */}
      <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
        <button
          onClick={() => setSelectedType('solid')}
          className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
            selectedType === 'solid'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <span>Solid Portfolios</span>
          <span className="px-2 py-1 bg-slate-700 text-xs rounded-full">
            {portfolios.filter(p => p.portfolioType === 'solid').length}
          </span>
        </button>
        <button
          onClick={() => setSelectedType('dangerous')}
          className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
            selectedType === 'dangerous'
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          <span>Dangerous Portfolios</span>
          <span className="px-2 py-1 bg-slate-700 text-xs rounded-full">
            {portfolios.filter(p => p.portfolioType === 'dangerous').length}
          </span>
        </button>
      </div>

      {/* Create New Portfolio Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">
          {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Portfolios
        </h3>
        <button
          onClick={() => createPortfolio(selectedType)}
          disabled={filteredPortfolios.length >= 5}
          className={`btn-primary flex items-center space-x-2 ${
            filteredPortfolios.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={filteredPortfolios.length >= 5 ? 'Maximum 5 portfolios per type' : 'Create new portfolio'}
        >
          <Plus className="w-4 h-4" />
          <span>Add Portfolio</span>
        </button>
      </div>

      {/* Portfolios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPortfolios.map((portfolio) => (
          <div key={portfolio.portfolioId} className="card p-6 hover:bg-slate-800/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">
                  {portfolio.portfolioName}
                </h4>
                <p className="text-sm text-slate-400">
                  {portfolio.stocks.length} stocks
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onViewPortfolio(portfolio.portfolioId)}
                  className="text-primary-400 hover:text-primary-300"
                  title="View Portfolio"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {!portfolio.portfolioId.endsWith('-1') && (
                  <button
                    onClick={() => deletePortfolio(portfolio.portfolioId)}
                    className="text-red-400 hover:text-red-300"
                    title="Delete Portfolio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Portfolio Stats */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Current Value</span>
                <span className="text-lg font-semibold text-white">
                  {formatCurrency(portfolio.totals.current)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total P&L</span>
                <div className="text-right">
                  <div className={`font-semibold ${
                    portfolio.totals.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(portfolio.totals.totalPnL)}
                  </div>
                  <div className={`text-xs ${
                    portfolio.totals.totalPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatPercent(portfolio.totals.totalPnLPercent)}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => onAddStock(portfolio.portfolioId)}
                className="flex-1 btn-primary text-sm py-2"
              >
                Add Stock
              </button>
              <button
                onClick={() => onViewPortfolio(portfolio.portfolioId)}
                className="flex-1 btn-secondary text-sm py-2"
              >
                View Details
              </button>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredPortfolios.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No {selectedType} portfolios yet
            </h3>
            <p className="text-slate-400 mb-4">
              Create your first {selectedType} portfolio to start managing your investments
            </p>
            <button
              onClick={() => createPortfolio(selectedType)}
              className="btn-primary"
            >
              Create Portfolio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
