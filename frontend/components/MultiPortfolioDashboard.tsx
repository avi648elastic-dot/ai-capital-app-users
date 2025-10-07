'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Plus, Trash2, ChevronDown, ChevronUp, TrendingUp, Activity, Shield, AlertTriangle } from 'lucide-react';
import PortfolioTable from './PortfolioTable';

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
  const [expandedPortfolioId, setExpandedPortfolioId] = useState<string | null>(null);

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
      
      setPortfolios(Array.from(portfolioMap.values()));
    } catch (error) {
      console.error('Error fetching portfolios:', error);
    } finally {
      setLoading(false);
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

  const calculateVolatility = (portfolio: Portfolio) => {
    // Mock volatility calculation - in real app, calculate from historical data
    const baseVolatility = portfolio.portfolioType === 'dangerous' ? 25 : 12;
    const stockCount = portfolio.stocks.length;
    const volatility = baseVolatility + (Math.random() * 5 - 2.5); // Add some variance
    return volatility.toFixed(1);
  };

  const toggleExpanded = (portfolioId: string) => {
    setExpandedPortfolioId(expandedPortfolioId === portfolioId ? null : portfolioId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const solidPortfolios = portfolios.filter(p => p.portfolioType === 'solid');
  const dangerousPortfolios = portfolios.filter(p => p.portfolioType === 'dangerous');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Multi-Portfolio Overview</h2>
          <p className="text-slate-400 text-sm">
            {portfolios.length} portfolios • 
            {solidPortfolios.length} solid • 
            {dangerousPortfolios.length} dangerous
          </p>
        </div>
      </div>

      {/* Portfolio Boxes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {portfolios.map((portfolio) => {
          const isExpanded = expandedPortfolioId === portfolio.portfolioId;
          const volatility = calculateVolatility(portfolio);
          const isHighVolatility = parseFloat(volatility) > 20;
          
          return (
            <div key={portfolio.portfolioId}>
              <div 
                className={`card p-5 cursor-pointer transition-all duration-200 border-2 ${
                  isExpanded 
                    ? 'border-primary-500 bg-slate-800' 
                    : 'border-transparent hover:border-slate-600'
                }`}
                onClick={() => toggleExpanded(portfolio.portfolioId)}
              >
                {/* Header with Type Badge */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    {portfolio.portfolioType === 'solid' ? (
                      <Shield className="w-5 h-5 text-blue-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {portfolio.portfolioName}
                      </h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        portfolio.portfolioType === 'solid'
                          ? 'bg-blue-900/30 text-blue-300'
                          : 'bg-red-900/30 text-red-300'
                      }`}>
                        {portfolio.portfolioType.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!portfolio.portfolioId.endsWith('-1') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePortfolio(portfolio.portfolioId);
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Delete Portfolio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Volatility Indicator */}
                <div className="mb-3 flex items-center justify-between bg-slate-700/50 rounded-lg p-2">
                  <div className="flex items-center space-x-2">
                    <Activity className={`w-4 h-4 ${isHighVolatility ? 'text-red-400' : 'text-yellow-400'}`} />
                    <span className="text-xs text-slate-300">Volatility</span>
                  </div>
                  <span className={`text-sm font-bold ${isHighVolatility ? 'text-red-400' : 'text-yellow-400'}`}>
                    {volatility}%
                  </span>
                </div>

                {/* Quick Stats */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Stocks</span>
                    <span className="text-sm font-semibold text-white">{portfolio.stocks.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Value</span>
                    <span className="text-sm font-semibold text-white">
                      {formatCurrency(portfolio.totals.current)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">P&L</span>
                    <span className={`text-sm font-semibold ${
                      portfolio.totals.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatPercent(portfolio.totals.totalPnLPercent)}
                    </span>
                  </div>
                </div>

                {/* Quick Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddStock(portfolio.portfolioId);
                  }}
                  className="w-full mt-3 btn-primary text-xs py-2 flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Stock</span>
                </button>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 card p-6 border-2 border-primary-500/30">
                  <h4 className="text-lg font-semibold text-white mb-4">Portfolio Details</h4>
                  
                  {/* Detailed Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-800 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">Initial Investment</div>
                      <div className="text-lg font-semibold text-white">
                        {formatCurrency(portfolio.totals.initial)}
                      </div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">Current Value</div>
                      <div className="text-lg font-semibold text-white">
                        {formatCurrency(portfolio.totals.current)}
                      </div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">Total P&L</div>
                      <div className={`text-lg font-semibold ${
                        portfolio.totals.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(portfolio.totals.totalPnL)}
                      </div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">P&L %</div>
                      <div className={`text-lg font-semibold ${
                        portfolio.totals.totalPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatPercent(portfolio.totals.totalPnLPercent)}
                      </div>
                    </div>
                  </div>

                  {/* Stocks Table */}
                  <div className="mt-4">
                    <h5 className="text-sm font-semibold text-white mb-3">Stocks ({portfolio.stocks.length})</h5>
                    <PortfolioTable 
                      portfolio={portfolio.stocks}
                      onDeleteStock={async (ticker) => {
                        // Handle stock deletion
                        console.log('Delete stock:', ticker);
                        await fetchPortfolios();
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {portfolios.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No portfolios yet
          </h3>
          <p className="text-slate-400 mb-4">
            Create your first portfolio to start managing your investments
          </p>
        </div>
      )}
    </div>
  );
}
