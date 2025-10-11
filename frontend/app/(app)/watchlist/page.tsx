'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Eye, Plus, Trash2, TrendingUp, TrendingDown, Bell, BellOff, AlertCircle, Settings, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PriceAlert {
  type: 'high' | 'low' | 'both';
  highPrice?: number;
  lowPrice?: number;
  enabled: boolean;
  lastTriggered?: string;
  triggeredCount: number;
}

interface WatchlistItem {
  id: string;
  ticker: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  notifications: boolean;
  priceAlert?: PriceAlert;
  addedAt: string;
  lastChecked?: string;
}

export default function Watchlist() {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newTicker, setNewTicker] = useState('');
  const [addingStock, setAddingStock] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<WatchlistItem | null>(null);
  const [alertType, setAlertType] = useState<'high' | 'low' | 'both'>('both');
  const [highPrice, setHighPrice] = useState<string>('');
  const [lowPrice, setLowPrice] = useState<string>('');

  useEffect(() => {
    fetchUserAndWatchlist();
    // Refresh watchlist every 5 minutes
    const interval = setInterval(fetchUserAndWatchlist, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserAndWatchlist = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        router.push('/');
        return;
      }

      // Fetch user data
      const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userResponse.data.user);

      // Fetch watchlist
      const watchlistResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/watchlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setWatchlist(watchlistResponse.data.watchlist || []);
    } catch (error) {
      console.error('Error fetching watchlist data:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async () => {
    if (!newTicker.trim()) return;

    const maxStocks = user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'premium+' ? 20 : 5;
    
    if (watchlist.length >= maxStocks) {
      alert(`You've reached your limit of ${maxStocks} stocks. ${user?.subscriptionTier === 'free' ? 'Upgrade to Premium+ for up to 20 stocks.' : ''}`);
      return;
    }

    setAddingStock(true);
    try {
      const token = Cookies.get('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/add`,
        { ticker: newTicker.toUpperCase() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh watchlist
      await fetchUserAndWatchlist();
      setNewTicker('');
      alert(`${newTicker.toUpperCase()} added to watchlist!`);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.error || 'Failed to add stock to watchlist');
      }
    } finally {
      setAddingStock(false);
    }
  };

  const removeFromWatchlist = async (id: string) => {
    if (!confirm('Are you sure you want to remove this stock from your watchlist?')) return;

    try {
      const token = Cookies.get('token');
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWatchlist(watchlist.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      alert('Failed to remove stock from watchlist');
    }
  };

  const toggleNotifications = async (id: string, currentStatus: boolean) => {
    try {
      const token = Cookies.get('token');
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/${id}/notifications`,
        { notifications: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWatchlist(watchlist.map(item => 
        item.id === id ? { ...item, notifications: !currentStatus } : item
      ));
    } catch (error) {
      console.error('Error toggling notifications:', error);
      alert('Failed to update notifications');
    }
  };

  const openAlertModal = (stock: WatchlistItem) => {
    setSelectedStock(stock);
    if (stock.priceAlert) {
      setAlertType(stock.priceAlert.type);
      setHighPrice(stock.priceAlert.highPrice?.toString() || '');
      setLowPrice(stock.priceAlert.lowPrice?.toString() || '');
    } else {
      setAlertType('both');
      setHighPrice('');
      setLowPrice('');
    }
    setShowAlertModal(true);
  };

  const closeAlertModal = () => {
    setShowAlertModal(false);
    setSelectedStock(null);
    setAlertType('both');
    setHighPrice('');
    setLowPrice('');
  };

  const savePriceAlert = async () => {
    if (!selectedStock) return;

    // Validation
    if ((alertType === 'high' || alertType === 'both') && (!highPrice || parseFloat(highPrice) <= 0)) {
      alert('Please enter a valid high price');
      return;
    }

    if ((alertType === 'low' || alertType === 'both') && (!lowPrice || parseFloat(lowPrice) <= 0)) {
      alert('Please enter a valid low price');
      return;
    }

    if (alertType === 'both' && parseFloat(lowPrice) >= parseFloat(highPrice)) {
      alert('Low price must be less than high price');
      return;
    }

    try {
      const token = Cookies.get('token');
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/${selectedStock.id}/alert`,
        {
          type: alertType,
          highPrice: (alertType === 'high' || alertType === 'both') ? parseFloat(highPrice) : undefined,
          lowPrice: (alertType === 'low' || alertType === 'both') ? parseFloat(lowPrice) : undefined,
          enabled: true
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchUserAndWatchlist();
      closeAlertModal();
      alert('Price alert set successfully!');
    } catch (error) {
      console.error('Error setting price alert:', error);
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.error || 'Failed to set price alert');
      }
    }
  };

  const removePriceAlert = async (id: string) => {
    if (!confirm('Are you sure you want to remove this price alert?')) return;

    try {
      const token = Cookies.get('token');
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/${id}/alert`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchUserAndWatchlist();
      alert('Price alert removed');
    } catch (error) {
      console.error('Error removing price alert:', error);
      alert('Failed to remove price alert');
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
        <p className="text-slate-400">Track your favorite stocks and get real-time price alerts</p>
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
            className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleNotifications(item.id, item.notifications)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.notifications 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                    title={item.notifications ? 'Notifications enabled' : 'Notifications disabled'}
                  >
                    {item.notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openAlertModal(item)}
                    className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    title="Set price alert"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
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

              {/* Price Alert Status */}
              {item.priceAlert && item.priceAlert.enabled && (
                <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center text-blue-400 text-sm font-medium mb-1">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Price Alert Active
                      </div>
                      {(item.priceAlert.type === 'high' || item.priceAlert.type === 'both') && item.priceAlert.highPrice && (
                        <div className="text-xs text-slate-300">
                          📈 High: ${item.priceAlert.highPrice.toFixed(2)}
                        </div>
                      )}
                      {(item.priceAlert.type === 'low' || item.priceAlert.type === 'both') && item.priceAlert.lowPrice && (
                        <div className="text-xs text-slate-300">
                          📉 Low: ${item.priceAlert.lowPrice.toFixed(2)}
                        </div>
                      )}
                      {item.priceAlert.triggeredCount > 0 && (
                        <div className="text-xs text-slate-400 mt-1">
                          Triggered {item.priceAlert.triggeredCount} time{item.priceAlert.triggeredCount > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removePriceAlert(item.id)}
                      className="text-red-400 hover:text-red-300 transition-colors p-1"
                      title="Remove alert"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Added: {new Date(item.addedAt).toLocaleDateString()}</span>
                <button
                  onClick={() => removeFromWatchlist(item.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  title="Remove from watchlist"
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
            You're tracking {watchlist.length} of {user.subscriptionTier === 'premium' || user.subscriptionTier === 'premium+' ? 20 : 5} stocks. 
            {user.subscriptionTier === 'free' && (
              <span className="text-emerald-400 ml-1">Upgrade to Premium+ to track up to 20 stocks!</span>
            )}
          </p>
        </div>
      )}

      {/* Price Alert Modal */}
      {showAlertModal && selectedStock && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Set Price Alert</h3>
              <button
                onClick={closeAlertModal}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="text-lg font-semibold text-white mb-2">{selectedStock.ticker}</div>
              <div className="text-slate-400">Current Price: ${selectedStock.currentPrice.toFixed(2)}</div>
            </div>

            {/* Alert Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">Alert Type</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setAlertType('high')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    alertType === 'high'
                      ? 'border-emerald-500 bg-emerald-900/30 text-white'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <TrendingUp className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">High Only</div>
                </button>
                <button
                  onClick={() => setAlertType('low')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    alertType === 'low'
                      ? 'border-red-500 bg-red-900/30 text-white'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <TrendingDown className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">Low Only</div>
                </button>
                <button
                  onClick={() => setAlertType('both')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    alertType === 'both'
                      ? 'border-blue-500 bg-blue-900/30 text-white'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <AlertCircle className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">Both</div>
                </button>
              </div>
            </div>

            {/* Price Inputs */}
            <div className="space-y-4 mb-6">
              {(alertType === 'high' || alertType === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    High Price Alert (When price goes above)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={highPrice}
                    onChange={(e) => setHighPrice(e.target.value)}
                    placeholder={`e.g., ${(selectedStock.currentPrice * 1.1).toFixed(2)}`}
                    className="input-field w-full"
                  />
                </div>
              )}

              {(alertType === 'low' || alertType === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Low Price Alert (When price goes below)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={lowPrice}
                    onChange={(e) => setLowPrice(e.target.value)}
                    placeholder={`e.g., ${(selectedStock.currentPrice * 0.9).toFixed(2)}`}
                    className="input-field w-full"
                  />
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-300">
                  <div className="font-medium text-blue-400 mb-1">Smart Monitoring</div>
                  <p className="text-xs">
                    Our system automatically checks prices every 5 minutes and sends you instant notifications when your targets are reached.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={closeAlertModal}
                className="flex-1 py-3 px-4 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePriceAlert}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Set Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
