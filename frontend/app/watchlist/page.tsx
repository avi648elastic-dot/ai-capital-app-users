'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Bell, BellOff } from 'lucide-react';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [newTicker, setNewTicker] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock watchlist data
  useEffect(() => {
    setWatchlist([
      { id: 1, ticker: 'NVDA', price: 850.25, change: 2.5, changePercent: 0.29, notifications: true },
      { id: 2, ticker: 'GOOGL', price: 142.50, change: -1.2, changePercent: -0.83, notifications: false },
      { id: 3, ticker: 'META', price: 485.30, change: 5.8, changePercent: 1.21, notifications: true },
    ]);
  }, []);

  const addToWatchlist = async () => {
    if (!newTicker.trim()) return;
    
    setLoading(true);
    try {
      // TODO: implement add to watchlist API
      const newItem = {
        id: Date.now(),
        ticker: newTicker.toUpperCase(),
        price: Math.random() * 1000 + 50,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
        notifications: true
      };
      
      setWatchlist([...watchlist, newItem]);
      setNewTicker('');
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = (id: number) => {
    setWatchlist(watchlist.filter(item => item.id !== id));
  };

  const toggleNotifications = (id: number) => {
    setWatchlist(watchlist.map(item => 
      item.id === id ? { ...item, notifications: !item.notifications } : item
    ));
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Watchlist</h1>
          <p className="text-slate-400">Track stocks and get notifications for price changes</p>
        </div>

        {/* Add to Watchlist */}
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Add Stock to Watchlist</h3>
          <div className="flex space-x-4">
            <input
              type="text"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              placeholder="Enter stock ticker (e.g., AAPL)"
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={addToWatchlist}
              disabled={loading || !newTicker.trim()}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Adding...' : 'Add'}</span>
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            Free users: up to 5 stocks • Premium users: up to 20 stocks
          </p>
        </div>

        {/* Watchlist Table */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Your Watchlist</h3>
          {watchlist.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">No stocks in your watchlist</p>
              <p className="text-sm text-slate-500">Add stocks above to start tracking</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400">Stock</th>
                    <th className="text-right py-3 px-4 text-slate-400">Price</th>
                    <th className="text-right py-3 px-4 text-slate-400">Change</th>
                    <th className="text-center py-3 px-4 text-slate-400">Notifications</th>
                    <th className="text-center py-3 px-4 text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlist.map((stock) => (
                    <tr key={stock.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">{stock.ticker}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="text-white">${stock.price.toFixed(2)}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className={`flex items-center justify-end space-x-1 ${
                          stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          <span>{stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}</span>
                          <span>({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleNotifications(stock.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            stock.notifications 
                              ? 'text-green-400 bg-green-400/10' 
                              : 'text-slate-400 bg-slate-800'
                          }`}
                          title={stock.notifications ? 'Disable notifications' : 'Enable notifications'}
                        >
                          {stock.notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => removeFromWatchlist(stock.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
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
          )}
        </div>
      </div>
    </div>
  );
}
