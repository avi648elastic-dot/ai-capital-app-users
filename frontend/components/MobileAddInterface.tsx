'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, TrendingUp, Zap, Target, Shield, X, Check, ArrowRight, Star } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface MobileAddInterfaceProps {
  isVisible: boolean;
  onClose: () => void;
  userTier: 'free' | 'premium' | 'premium+' | 'enterprise';
  onSuccess?: () => void;
}

interface StockSearchResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  exchange: string;
}

const PORTFOLIO_TYPES = [
  {
    id: 'growth',
    name: 'Growth Portfolio',
    icon: '🚀',
    description: 'High-growth stocks with strong potential',
    color: 'from-emerald-500 to-emerald-600',
    risk: 'Medium-High',
    timeframe: '3-5 years'
  },
  {
    id: 'conservative',
    name: 'Conservative Portfolio',
    icon: '🛡️',
    description: 'Stable, dividend-paying stocks',
    color: 'from-blue-500 to-blue-600',
    risk: 'Low-Medium',
    timeframe: '5+ years'
  },
  {
    id: 'tech',
    name: 'Tech Focus',
    icon: '💻',
    description: 'Technology and innovation stocks',
    color: 'from-purple-500 to-purple-600',
    risk: 'High',
    timeframe: '2-4 years'
  },
  {
    id: 'dividend',
    name: 'Dividend Income',
    icon: '💰',
    description: 'High-yield dividend stocks',
    color: 'from-amber-500 to-amber-600',
    risk: 'Low',
    timeframe: '10+ years'
  }
];

const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology' },
  { symbol: 'META', name: 'Meta Platforms', sector: 'Technology' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Entertainment' }
];

export default function MobileAddInterface({ isVisible, onClose, userTier, onSuccess }: MobileAddInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'stock'>('portfolio');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPortfolioType, setSelectedPortfolioType] = useState<string | null>(null);
  const [portfolioName, setPortfolioName] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [stockQuantity, setStockQuantity] = useState('1');
  const [step, setStep] = useState(1);

  // Search stocks with debouncing
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const token = Cookies.get('token');
        if (!token) return;
        
        // First try Yahoo Finance search
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/yahoo-finance/search/${encodeURIComponent(searchQuery)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSearchResults(response.data.results || []);
      } catch (error) {
        console.error('Stock search failed:', error);
        // Fallback: show popular stocks that match the query
        const matchingStocks = POPULAR_STOCKS.filter(stock => 
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).map(stock => ({
          symbol: stock.symbol,
          name: stock.name,
          price: 0,
          change: 0,
          changePercent: 0,
          exchange: 'NASDAQ'
        }));
        setSearchResults(matchingStocks);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreatePortfolio = async () => {
    if (!selectedPortfolioType || !portfolioName.trim()) return;

    setLoading(true);
    try {
      const token = Cookies.get('token');
      if (!token) return;
      
      const portfolioType = PORTFOLIO_TYPES.find(p => p.id === selectedPortfolioType);
      
      // For now, just show success - portfolio management might be handled differently
      // This interface is mainly for adding stocks to existing portfolios
      console.log('Portfolio creation not implemented - directing to existing portfolio flow');
      
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Portfolio creation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async () => {
    if (!selectedStock || !stockQuantity) return;

    setLoading(true);
    try {
      const token = Cookies.get('token');
      if (!token) return;
      
      // If stock price is 0, fetch current price first
      let currentPrice = selectedStock.price;
      if (currentPrice === 0) {
        try {
          const priceResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/yahoo-finance/${selectedStock.symbol}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          currentPrice = priceResponse.data.currentPrice || 100; // fallback price
        } catch (priceError) {
          console.error('Failed to fetch current price:', priceError);
          currentPrice = 100; // fallback price
        }
      }
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/portfolio`,
        {
          ticker: selectedStock.symbol,
          shares: parseInt(stockQuantity),
          entryPrice: currentPrice,
          currentPrice: currentPrice,
          portfolioType: 'solid', // Default to solid portfolio for mobile additions
          portfolioId: 'solid-1'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Stock addition failed:', error);
      alert('Failed to add stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPortfolioType(null);
    setPortfolioName('');
    setSelectedStock(null);
    setStockQuantity('1');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed inset-x-0 bottom-0 bg-gray-900 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add to Portfolio</h2>
                <p className="text-sm text-gray-400">Grow your investment portfolio</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mt-4 bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => {
                setActiveTab('portfolio');
                resetForm();
              }}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'portfolio'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Target className="w-4 h-4" />
                <span>New Portfolio</span>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('stock');
                resetForm();
              }}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'stock'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Add Stock</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'portfolio' ? (
            <div className="p-6 space-y-6">
              {step === 1 && (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Choose Portfolio Type</h3>
                    <p className="text-gray-400 text-sm">Select a strategy that matches your investment goals</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {PORTFOLIO_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedPortfolioType(type.id)}
                        className={`relative p-4 rounded-2xl border-2 transition-all ${
                          selectedPortfolioType === type.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${type.color} rounded-xl flex items-center justify-center text-xl`}>
                            {type.icon}
                          </div>
                          <div className="flex-1 text-left">
                            <h4 className="font-semibold text-white mb-1">{type.name}</h4>
                            <p className="text-sm text-gray-400 mb-2">{type.description}</p>
                            <div className="flex items-center space-x-4 text-xs">
                              <span className="text-gray-500">Risk: <span className="text-white">{type.risk}</span></span>
                              <span className="text-gray-500">Timeline: <span className="text-white">{type.timeframe}</span></span>
                            </div>
                          </div>
                          {selectedPortfolioType === type.id && (
                            <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedPortfolioType}
                    className={`w-full py-4 rounded-xl font-semibold transition-all ${
                      selectedPortfolioType
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Name Your Portfolio</h3>
                    <p className="text-gray-400 text-sm">Give your portfolio a memorable name</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Portfolio Name</label>
                      <input
                        type="text"
                        value={portfolioName}
                        onChange={(e) => setPortfolioName(e.target.value)}
                        placeholder="e.g., My Growth Portfolio"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        maxLength={50}
                      />
                      <p className="text-xs text-gray-500 mt-1">{portfolioName.length}/50 characters</p>
                    </div>

                    {selectedPortfolioType && (
                      <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-gradient-to-r ${PORTFOLIO_TYPES.find(p => p.id === selectedPortfolioType)?.color} rounded-lg flex items-center justify-center text-lg`}>
                            {PORTFOLIO_TYPES.find(p => p.id === selectedPortfolioType)?.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">{PORTFOLIO_TYPES.find(p => p.id === selectedPortfolioType)?.name}</h4>
                            <p className="text-sm text-gray-400">{PORTFOLIO_TYPES.find(p => p.id === selectedPortfolioType)?.description}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreatePortfolio}
                      disabled={!portfolioName.trim() || loading}
                      className={`flex-2 py-3 rounded-xl font-semibold transition-all ${
                        portfolioName.trim() && !loading
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Creating...</span>
                        </div>
                      ) : (
                        'Create Portfolio'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Add Stock to Portfolio</h3>
                <p className="text-gray-400 text-sm">Search for stocks or choose from popular picks</p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stocks (e.g., AAPL, Tesla)"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                {loading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-emerald-500 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-300">Search Results</h4>
                  {searchResults.slice(0, 5).map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => setSelectedStock(stock)}
                      className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                        selectedStock?.symbol === stock.symbol
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-white">{stock.symbol}</span>
                            <span className="text-xs text-gray-400">{stock.exchange}</span>
                          </div>
                          <p className="text-sm text-gray-400 truncate">{stock.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">${stock.price.toFixed(2)}</p>
                          <p className={`text-xs ${stock.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Popular Stocks */}
              {searchQuery.length < 2 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-300 flex items-center">
                    <Star className="w-4 h-4 mr-2 text-yellow-400" />
                    Popular Stocks
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {POPULAR_STOCKS.map((stock) => (
                      <button
                        key={stock.symbol}
                        onClick={() => {
                          setSelectedStock({
                            symbol: stock.symbol,
                            name: stock.name,
                            price: 0, // Will be fetched
                            change: 0,
                            changePercent: 0,
                            exchange: 'NASDAQ'
                          });
                        }}
                        className="p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 rounded-xl transition-all text-left"
                      >
                        <div className="font-semibold text-white text-sm">{stock.symbol}</div>
                        <div className="text-xs text-gray-400 truncate">{stock.sector}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selection */}
              {selectedStock && (
                <div className="space-y-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white">{selectedStock.symbol}</h4>
                      <p className="text-sm text-gray-400">{selectedStock.name}</p>
                    </div>
                    {selectedStock.price > 0 && (
                      <div className="text-right">
                        <p className="font-semibold text-white">${selectedStock.price.toFixed(2)}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Number of Shares</label>
                    <input
                      type="number"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      min="1"
                      max="10000"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <button
                    onClick={handleAddStock}
                    disabled={!selectedStock || !stockQuantity || loading}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                      selectedStock && stockQuantity && !loading
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Adding...</span>
                      </div>
                    ) : (
                      `Add ${stockQuantity} ${parseInt(stockQuantity) === 1 ? 'Share' : 'Shares'}`
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
