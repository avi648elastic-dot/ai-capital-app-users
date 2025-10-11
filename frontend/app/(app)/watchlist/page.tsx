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
      // Mock API call - replace with actual implementation
      const newItem: WatchlistItem = {
        id: Date.now().toString(),
        ticker: newTicker.toUpperCase(),
        name: newTicker.toUpperCase(), // In real implementation, fetch company name
        currentPrice: Math.random() * 500 + 50,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
        notifications: true,
        addedAt: new Date().toISOString().split('T')[0]
      };

      setWatchlist([...watchlist, newItem]);
      setNewTicker('');
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    } finally {
      setAddingStock(false);
    }
  };

  const removeFromWatchlist = async (id: string) => {
    try {
      // Mock API call - replace with actual implementation
      setWatchlist(watchlist.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const toggleNotifications = async (id: string) => {
    try {
      // Mock API call - replace with actual implementation
      setWatchlist(watchlist.map(item => 
        item.id === id ? { ...item, notifications: !item.notifications } : item
      ));
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Watchlist</h1>
        <p className="text-slate-400">Track your favorite stocks and get real-time updates</p>
      </div>

      {/* Add Stock Form */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Add Stock to Watchlist
        </h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
            placeholder="Enter stock symbol (e.g., AAPL)"
            className="input-field flex-1"
            onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()}
          />
          <button
            onClick={addToWatchlist}
            disabled={addingStock || !newTicker.trim()}
            className="btn-primary px-6"
          >
            {addingStock ? 'Adding...' : 'Add Stock'}
          </button>
        </div>
      </div>

      {/* Watchlist Grid */}
      {watchlist.length === 0 ? (
        <div className="card p-12 text-center">
          <Eye className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Your Watchlist is Empty</h3>
          <p className="text-slate-400 mb-6">Add stocks you want to track and get notified about price changes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watchlist.map((item) => (
            <div key={item.id} className="card p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{item.ticker}</h3>
                  <p className="text-slate-400 text-sm">{item.name}</p>
                </div>
                <button
                  onClick={() => toggleNotifications(item.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    item.notifications 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {item.notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </button>
              </div>

              <div className="mb-4">
                <div className="text-2xl font-bold text-white mb-1">
                  ${item.currentPrice.toFixed(2)}
                </div>
                <div className={`flex items-center text-sm ${
                  item.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {item.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)} ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Added: {new Date(item.addedAt).toLocaleDateString()}</span>
                <button
                  onClick={() => removeFromWatchlist(item.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subscription Limit Info */}
      {user && (
        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
          <p className="text-slate-400 text-sm">
            You're tracking {watchlist.length} stocks. 
            {user.subscriptionTier === 'free' && watchlist.length >= 5 && (
              <span className="text-emerald-400 ml-1">Upgrade to Premium+ to track up to 20 stocks!</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
