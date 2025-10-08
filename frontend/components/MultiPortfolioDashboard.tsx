'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Plus, Trash2, TrendingUp, Activity, Shield, AlertTriangle } from 'lucide-react';

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
  volatility?: number;
  lastVolatilityUpdate?: string;
}

interface MultiPortfolioDashboardProps {
  user: any;
  onAddStock: (portfolioId: string) => void;
  onViewPortfolio: (portfolioId: string) => void;
  onPortfolioSelect?: (portfolio: Portfolio | null) => void;
}

export default function MultiPortfolioDashboard({ user, onAddStock, onViewPortfolio, onPortfolioSelect }: MultiPortfolioDashboardProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  // Notify parent when selected portfolio changes
  useEffect(() => {
    if (selectedPortfolioId && portfolios.length > 0) {
      const selectedPortfolio = portfolios.find(p => p.portfolioId === selectedPortfolioId);
      console.log('🔍 [MULTI-PORTFOLIO] Selected portfolio changed:', selectedPortfolioId, selectedPortfolio);
      if (onPortfolioSelect) {
        onPortfolioSelect(selectedPortfolio || null);
      }
    }
  }, [selectedPortfolioId, portfolios, onPortfolioSelect]);

  const fetchPortfolios = async () => {
    try {
      // Add cache buster to force fresh data
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      
      console.log('📊 [MULTI-PORTFOLIO] Fetched stocks:', response.data.portfolio?.length || 0);
      
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
            totals: { initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 },
            volatility: stock.volatility,
            lastVolatilityUpdate: stock.lastVolatilityUpdate
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
  console.log('📊 [MULTI-PORTFOLIO] Grouped portfolios:', portfolioArray.length);
          portfolioArray.forEach(p => {
            console.log(`  - ${p.portfolioId}: ${p.stocks.length} stocks, $${p.totals.current.toFixed(2)}`);
          });
          
          console.log('🔍 [MULTI-PORTFOLIO] Auto-selecting first portfolio:', portfolioArray[0]?.portfolioId);
      
       setPortfolios(portfolioArray);
       
       // Auto-select first portfolio if none selected
       if (portfolioArray.length > 0 && !selectedPortfolioId) {
         console.log('🔍 [MULTI-PORTFOLIO] Auto-selecting first portfolio:', portfolioArray[0].portfolioId);
         setSelectedPortfolioId(portfolioArray[0].portfolioId);
       }
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

  const getVolatility = (portfolio: Portfolio) => {
    // Use real volatility data from backend if available
    if (portfolio.volatility !== undefined && portfolio.volatility > 0) {
      return portfolio.volatility.toFixed(1);
    }
    
    // Fallback to estimated volatility based on portfolio type
    const baseVolatility = portfolio.portfolioType === 'risky' ? 25 : 12;
    return baseVolatility.toFixed(1);
  };

  const getVolatilityStatus = (volatility: number) => {
    if (volatility >= 30) return { color: 'text-red-400', level: 'High' };
    if (volatility >= 20) return { color: 'text-orange-400', level: 'Medium' };
    return { color: 'text-yellow-400', level: 'Low' };
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const solidPortfolios = portfolios.filter(p => p.portfolioType === 'solid');
  const riskyPortfolios = portfolios.filter(p => p.portfolioType === 'risky');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Multi-Portfolio Overview</h2>
        <p className="text-slate-400 text-sm">
          {portfolios.length} portfolios • 
          {solidPortfolios.length} solid • 
          {riskyPortfolios.length} risky
        </p>
        <div className="mt-2 text-xs text-slate-500">
          ⚡ Volatility updates daily at 6:00 PM EST • Decisions update every 5 minutes during market hours
        </div>
        <div className="mt-2 text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded">
          🔧 DEBUG: Selected Portfolio: {selectedPortfolioId || 'None'}
        </div>
      </div>

      {/* Portfolio Boxes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {portfolios.map((portfolio) => {
          const volatility = parseFloat(getVolatility(portfolio));
          const volatilityStatus = getVolatilityStatus(volatility);
          const isHighVolatility = volatility >= 20;
          
          return (
            <div key={portfolio.portfolioId}>
               <div 
                 className={`card p-5 transition-all duration-200 border-2 cursor-pointer ${
                   selectedPortfolioId === portfolio.portfolioId
                     ? 'border-blue-500 bg-blue-500/10'
                     : 'border-transparent hover:border-slate-600'
                 }`}
                 onClick={() => {
                   console.log('🔍 [MULTI-PORTFOLIO] Portfolio box clicked:', portfolio.portfolioId);
                   setSelectedPortfolioId(portfolio.portfolioId);
                 }}
               >
                {/* Header with Type Badge */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    {portfolio.portfolioType === 'solid' ? (
                      <Shield className="w-5 h-5 text-blue-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                    )}
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {portfolio.portfolioName}
                      </h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        portfolio.portfolioType === 'solid'
                          ? 'bg-blue-900/30 text-blue-300'
                          : 'bg-orange-900/30 text-orange-300'
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
                  </div>
                </div>

                    {/* Volatility Indicator */}
                    <div className="mb-3 flex items-center justify-between bg-slate-700/50 rounded-lg p-2">
                      <div className="flex items-center space-x-2">
                        <Activity className={`w-4 h-4 ${volatilityStatus.color}`} />
                        <span className="text-xs text-slate-300">Volatility</span>
                        {portfolio.lastVolatilityUpdate && (
                          <span className="text-xs text-slate-500">
                            ({new Date(portfolio.lastVolatilityUpdate).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${volatilityStatus.color}`}>
                          {volatility.toFixed(1)}%
                        </span>
                        <div className="text-xs text-slate-400">
                          {volatilityStatus.level}
                        </div>
                      </div>
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

              {/* No expanded details in multi-portfolio view - only portfolio boxes */}
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
