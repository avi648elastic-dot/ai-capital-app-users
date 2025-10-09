'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Eye, Plus, Trash2, TrendingUp, TrendingDown, Bell, BellOff } from 'lucide-react';

interface WatchlistItem {
  id: string;
  ticker: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  notifications: boolean;
  addedAt: string;
}

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newTicker, setNewTicker] = useState('');
  const [addingStock, setAddingStock] = useState(false);

  useEffect(() => {
    fetchUserAndWatchlist();
  }, []);

  const fetchUserAndWatchlist = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        window.location.href = '/';
        return;
      }

      // Fetch user data first
      const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userResponse.data.user);

      // For now, we'll use mock data since we don't have a watchlist API yet
      // In a real implementation, this would call your watchlist API endpoint
      const mockWatchlist: WatchlistItem[] = [
        {
          id: '1',
          ticker: 'NVDA',
          name: 'NVIDIA Corporation',
          currentPrice: 850.25,
          change: 2.50,
          changePercent: 0.29,
          notifications: true,
          addedAt: '2024-01-15'
        },
        {
          id: '2',
          ticker: 'GOOGL',
          name: 'Alphabet Inc.',
          currentPrice: 142.50,
          change: -1.20,
          changePercent: -0.83,
          notifications: false,
          addedAt: '2024-01-10'
        },
        {
          id: '3',
          ticker: 'META',
          name: 'Meta Platforms Inc.',
          currentPrice: 485.30,
          change: 5.80,
          changePercent: 1.21,
          notifications: true,
          addedAt: '2024-01-08'
        }
      ];

      setWatchlist(mockWatchlist);
    } catch (error) {
      console.error('Error fetching watchlist data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async () => {
    if (!newTicker.trim()) return;

    const maxStocks = user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'premium+' ? 20 : 5;
    
    if (watchlist.length >= maxStocks) {
      alert(`You've reached your limit of ${maxStocks} stocks. ${user?.subscriptionTier === 'free' ? 'Upgrade to Premium for up to 20 stocks.' : ''}`);
      return;
    }

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
        notifications: true,
        addedAt: new Date().toISOString().split('T')[0]
      };

      setWatchlist(prev => [newItem, ...prev]);
      setNewTicker('');
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

  const toggleNotifications = async (id: string) => {
    try {
      // Mock toggle - in real implementation, call API
      setWatchlist(prev => prev.map(item => 
        item.id === id ? { ...item, notifications: !item.notifications } : item
      ));
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const maxStocks = user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'premium+' ? 20 : 5;
  const isAtLimit = watchlist.length >= maxStocks;

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Watchlist</h1>
          <p className="text-lg text-slate-400">Track stocks and get notifications for price changes</p>
        </div>

        {/* Add Stock to Watchlist */}
        <div className="card p-6 sm:p-8 mb-6 sm:mb-8">
          <h3 className="text-xl font-semibold text-white mb-6">Add Stock to Watchlist</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                placeholder="Enter stock ticker (e.g., AAPL)"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
                disabled={isAtLimit}
              />
            </div>
            <button
              onClick={addToWatchlist}
              disabled={!newTicker.trim() || addingStock || isAtLimit}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 disabled:opacity-50 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 text-base font-medium"
            >
              {addingStock ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>+ Add</span>
                </>
              )}
            </button>
          </div>
          <div className="mt-4 text-sm text-slate-400">
            <span className={user?.subscriptionTier === 'free' ? 'text-amber-400' : 'text-green-400'}>
              {user?.subscriptionTier === 'free' ? 'Free users: up to 5 stocks' : 'Premium users: up to 20 stocks'}
            </span>
            {isAtLimit && (
              <span className="text-red-400 ml-4">
                • Limit reached ({watchlist.length}/{maxStocks})
              </span>
            )}
          </div>
        </div>

        {/* Your Watchlist */}
        <div className="card p-6 sm:p-8">
          <h3 className="text-xl font-semibold text-white mb-6">Your Watchlist</h3>
          
          {watchlist.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-white mb-2">No stocks in watchlist</h4>
              <p className="text-slate-400 mb-6">Add stocks you want to track to get started</p>
              <button
                onClick={() => document.querySelector('input[placeholder*="ticker"]')?.focus()}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Stock</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-4 px-2 text-slate-300 font-semibold">Stock</th>
                    <th className="text-right py-4 px-2 text-slate-300 font-semibold">Price</th>
                    <th className="text-right py-4 px-2 text-slate-300 font-semibold">Change</th>
                    <th className="text-center py-4 px-2 text-slate-300 font-semibold">Notifications</th>
                    <th className="text-center py-4 px-2 text-slate-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlist.map((stock) => (
                    <tr key={stock.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-4 px-2">
                        <div>
                          <span className="text-lg font-semibold text-white">{stock.ticker}</span>
                          <div className="text-sm text-slate-400">{stock.name}</div>
                        </div>
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
                      <td className="py-4 px-2 text-center">
                        <button
                          onClick={() => toggleNotifications(stock.id)}
                          className={`p-2 rounded-full transition-colors ${
                            stock.notifications 
                              ? 'text-green-400 hover:text-green-300' 
                              : 'text-slate-400 hover:text-slate-300'
                          }`}
                          title={stock.notifications ? 'Disable notifications' : 'Enable notifications'}
                        >
                          {stock.notifications ? (
                            <Bell className="w-5 h-5" />
                          ) : (
                            <BellOff className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <button
                          onClick={() => removeFromWatchlist(stock.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-2"
                          title="Remove from watchlist"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}