'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Eye, Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Activity, Star } from 'lucide-react';

interface WatchlistItem {
  id: string;
  ticker: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: string;
  addedAt: string;
  notes?: string;
}

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingStock, setAddingStock] = useState(false);
  const [newTicker, setNewTicker] = useState('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        window.location.href = '/';
        return;
      }

      // For now, we'll create some mock data since we don't have a watchlist API yet
      // In a real implementation, this would call your watchlist API endpoint
      const mockWatchlist: WatchlistItem[] = [
        {
          id: '1',
          ticker: 'AAPL',
          name: 'Apple Inc.',
          currentPrice: 175.43,
          change: 2.15,
          changePercent: 1.24,
          volume: 45234567,
          marketCap: '2.75T',
          addedAt: '2024-01-15',
          notes: 'Tech giant, watching for earnings'
        },
        {
          id: '2',
          ticker: 'GOOGL',
          name: 'Alphabet Inc.',
          currentPrice: 142.56,
          change: -1.23,
          changePercent: -0.86,
          volume: 28456789,
          marketCap: '1.78T',
          addedAt: '2024-01-10',
          notes: 'AI developments'
        },
        {
          id: '3',
          ticker: 'MSFT',
          name: 'Microsoft Corporation',
          currentPrice: 378.85,
          change: 4.67,
          changePercent: 1.25,
          volume: 19345678,
          marketCap: '2.81T',
          addedAt: '2024-01-08',
          notes: 'Cloud computing leader'
        }
      ];

      setWatchlist(mockWatchlist);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async () => {
    if (!newTicker.trim()) return;

    setAddingStock(true);
    try {
      // Mock adding to watchlist - in real implementation, call API
      const newItem: WatchlistItem = {
        id: Date.now().toString(),
        ticker: newTicker.toUpperCase(),
        name: `${newTicker.toUpperCase()} Corp.`, // Mock name
        currentPrice: Math.random() * 200 + 50, // Mock price
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
        volume: Math.floor(Math.random() * 10000000),
        marketCap: `${(Math.random() * 500 + 50).toFixed(1)}B`,
        addedAt: new Date().toISOString().split('T')[0],
        notes: newNotes.trim() || undefined
      };

      setWatchlist(prev => [newItem, ...prev]);
      setNewTicker('');
      setNewNotes('');
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    } finally {
      setAddingStock(false);
    }
  };

  const removeFromWatchlist = async (id: string) => {
    try {
      // Mock removal - in real implementation, call API
      setWatchlist(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Watchlist</h1>
              <p className="text-lg text-slate-400">Track stocks you're interested in</p>
            </div>
            <button
              onClick={() => setAddingStock(!addingStock)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 text-base font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Add Stock</span>
            </button>
          </div>
        </div>

        {/* Add Stock Form */}
        {addingStock && (
          <div className="card p-6 sm:p-8 mb-6 sm:mb-8">
            <h3 className="text-xl font-semibold text-white mb-6">Add Stock to Watchlist</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Ticker Symbol</label>
                <input
                  type="text"
                  value={newTicker}
                  onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                  placeholder="e.g., AAPL, GOOGL, MSFT"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notes (Optional)</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Why are you watching this stock?"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setAddingStock(false);
                  setNewTicker('');
                  setNewNotes('');
                }}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addToWatchlist}
                disabled={!newTicker.trim() || addingStock}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {addingStock ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add to Watchlist</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Watchlist Content */}
        {watchlist.length === 0 ? (
          <div className="card p-8 text-center">
            <Eye className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Stocks in Watchlist</h3>
            <p className="text-slate-400 mb-6">Add stocks you want to track to get started</p>
            <button
              onClick={() => setAddingStock(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Stock</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Watchlist Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Total Stocks</p>
                    <p className="text-3xl font-bold text-white">{watchlist.length}</p>
                  </div>
                  <Eye className="w-8 h-8 text-primary-400" />
                </div>
              </div>

              <div className="card p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Gainers</p>
                    <p className="text-3xl font-bold text-green-400">
                      {watchlist.filter(stock => stock.change > 0).length}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </div>

              <div className="card p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Losers</p>
                    <p className="text-3xl font-bold text-red-400">
                      {watchlist.filter(stock => stock.change < 0).length}
                    </p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-400" />
                </div>
              </div>
            </div>

            {/* Watchlist Table */}
            <div className="card p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Star className="w-6 h-6 mr-3" />
                Your Watchlist
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-4 px-2 text-slate-300 font-semibold">Symbol</th>
                      <th className="text-left py-4 px-2 text-slate-300 font-semibold">Company</th>
                      <th className="text-right py-4 px-2 text-slate-300 font-semibold">Price</th>
                      <th className="text-right py-4 px-2 text-slate-300 font-semibold">Change</th>
                      <th className="text-right py-4 px-2 text-slate-300 font-semibold">Volume</th>
                      <th className="text-right py-4 px-2 text-slate-300 font-semibold">Market Cap</th>
                      <th className="text-left py-4 px-2 text-slate-300 font-semibold">Notes</th>
                      <th className="text-center py-4 px-2 text-slate-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {watchlist.map((stock) => (
                      <tr key={stock.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="py-4 px-2">
                          <span className="text-lg font-semibold text-white">{stock.ticker}</span>
                        </td>
                        <td className="py-4 px-2">
                          <span className="text-slate-300">{stock.name}</span>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <span className="text-white font-semibold">${stock.currentPrice.toFixed(2)}</span>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <div className={`flex items-center justify-end space-x-1 ${
                            stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {stock.change >= 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="font-semibold">
                              {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                            </span>
                            <span className="text-sm">
                              ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <span className="text-slate-300">{stock.volume.toLocaleString()}</span>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <span className="text-slate-300">{stock.marketCap}</span>
                        </td>
                        <td className="py-4 px-2">
                          <span className="text-slate-400 text-sm">{stock.notes || '-'}</span>
                        </td>
                        <td className="py-4 px-2 text-center">
                          <button
                            onClick={() => removeFromWatchlist(stock.id)}
                            className="text-red-400 hover:text-red-300 transition-colors p-2"
                            title="Remove from watchlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
