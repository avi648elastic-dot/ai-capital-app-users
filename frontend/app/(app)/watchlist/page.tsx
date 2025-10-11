'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Eye, Plus, Trash2, TrendingUp, TrendingDown, Bell, BellOff, AlertCircle, Settings, X, Loader2, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import Toast from '@/components/ui/Toast';

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

interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export default function Watchlist() {
  const router = useRouter();
  const { t } = useLanguage();
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
  const [savingAlert, setSavingAlert] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

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
      } else {
        showToast('error', 'Failed to load watchlist. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async () => {
    if (!newTicker.trim()) {
      showToast('warning', 'Please enter a stock symbol');
      return;
    }

    const maxStocks = user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'premium+' ? 20 : 5;
    
    if (watchlist.length >= maxStocks) {
      showToast('warning', `You've reached your limit of ${maxStocks} stocks. ${user?.subscriptionTier === 'free' ? t('watchlist.upgradeMessage') : ''}`);
      return;
    }

    setAddingStock(true);
    try {
      const token = Cookies.get('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/add`,
        { ticker: newTicker.toUpperCase() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchUserAndWatchlist();
      showToast('success', `✅ ${newTicker.toUpperCase()} ${t('watchlist.stockAdded')}`);
      setNewTicker('');
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      if (axios.isAxiosError(error)) {
        showToast('error', error.response?.data?.error || t('watchlist.failedToAdd'));
      } else {
        showToast('error', t('watchlist.failedToAdd'));
      }
    } finally {
      setAddingStock(false);
    }
  };

  const removeFromWatchlist = async (id: string, ticker: string) => {
    try {
      const token = Cookies.get('token');
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWatchlist(watchlist.filter(item => item.id !== id));
      showToast('success', `${ticker} removed from watchlist`);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      showToast('error', t('watchlist.failedToRemove'));
    }
  };

  const toggleNotifications = async (id: string, ticker: string, currentStatus: boolean) => {
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
      
      showToast('success', `Notifications ${!currentStatus ? 'enabled' : 'disabled'} for ${ticker}`);
    } catch (error) {
      console.error('Error toggling notifications:', error);
      showToast('error', t('watchlist.failedToUpdate'));
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
      // Set suggested prices
      setHighPrice((stock.currentPrice * 1.1).toFixed(2));
      setLowPrice((stock.currentPrice * 0.9).toFixed(2));
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
      showToast('warning', t('watchlist.validHighPrice'));
      return;
    }

    if ((alertType === 'low' || alertType === 'both') && (!lowPrice || parseFloat(lowPrice) <= 0)) {
      showToast('warning', t('watchlist.validLowPrice'));
      return;
    }

    if (alertType === 'both' && parseFloat(lowPrice) >= parseFloat(highPrice)) {
      showToast('warning', t('watchlist.lowLessThanHigh'));
      return;
    }

    setSavingAlert(true);
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
      showToast('success', `✅ ${t('watchlist.alertSetSuccess')}`);
    } catch (error) {
      console.error('Error setting price alert:', error);
      if (axios.isAxiosError(error)) {
        showToast('error', error.response?.data?.error || t('watchlist.failedToSetAlert'));
      } else {
        showToast('error', t('watchlist.failedToSetAlert'));
      }
    } finally {
      setSavingAlert(false);
    }
  };

  const removePriceAlert = async (id: string, ticker: string) => {
    try {
      const token = Cookies.get('token');
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/${id}/alert`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchUserAndWatchlist();
      showToast('success', `Price alert removed for ${ticker}`);
    } catch (error) {
      console.error('Error removing price alert:', error);
      showToast('error', t('watchlist.failedToRemoveAlert'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white [data-theme='light']:text-gray-900 mb-2">{t('watchlistTitle')}</h1>
        <p className="text-sm sm:text-base text-slate-400 [data-theme='light']:text-gray-600">{t('watchlistSubtitle')}</p>
      </div>

      {/* Add Stock Form - Professional */}
      <div className="card p-4 sm:p-6 mb-4 sm:mb-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 [data-theme='light']:from-white [data-theme='light']:to-gray-50">
        <h2 className="text-lg sm:text-xl font-semibold text-white [data-theme='light']:text-gray-900 mb-4 flex items-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3">
            <Plus className="w-5 h-5 text-white" />
          </div>
          {t('addStock')}
        </h2>
        <div className="flex gap-3 sm:gap-4">
          <input
            type="text"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
            placeholder={t('enterSymbol')}
            className="input-field flex-1 text-sm sm:text-base"
            onKeyPress={(e) => e.key === 'Enter' && !addingStock && addToWatchlist()}
            disabled={addingStock}
          />
          <button
            onClick={addToWatchlist}
            disabled={addingStock || !newTicker.trim()}
            className="btn-primary px-4 sm:px-6 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 min-w-[120px] justify-center"
          >
            {addingStock ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('watchlist.adding')}</span>
              </>
            ) : (
              <span>{t('watchlist.addButton')}</span>
            )}
          </button>
        </div>
      </div>

      {/* Watchlist Grid */}
      {watchlist.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center bg-gradient-to-br from-slate-800/30 to-slate-900/30 [data-theme='light']:from-gray-50 [data-theme='light']:to-white">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <Eye className="w-10 h-10 text-blue-400 [data-theme='light']:text-blue-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-white [data-theme='light']:text-gray-900 mb-2">{t('watchlist.emptyTitle')}</h3>
          <p className="text-sm sm:text-base text-slate-400 [data-theme='light']:text-gray-600 max-w-md mx-auto">{t('watchlist.emptyDescription')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {watchlist.map((item) => (
            <div 
              key={item.id} 
              className="card p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-slate-800/50 to-slate-900/50 [data-theme='light']:from-white [data-theme='light']:to-gray-50 hover:scale-[1.02]"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-white [data-theme='light']:text-gray-900">{item.ticker}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 [data-theme='light']:text-gray-600 truncate">{item.name}</p>
                </div>
              </div>

              {/* Action Buttons - Clear and User-Friendly */}
              <div className="flex items-center space-x-2 mb-4">
                <button
                  onClick={() => toggleNotifications(item.id, item.ticker, item.notifications)}
                  className={`flex-1 py-2.5 px-3 rounded-lg transition-all font-medium text-sm flex items-center justify-center space-x-2 ${
                    item.notifications 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600 [data-theme="light"]:bg-gray-200 [data-theme="light"]:text-gray-700 [data-theme="light"]:hover:bg-gray-300'
                  }`}
                >
                  {item.notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  <span>{item.notifications ? 'Notifications ON' : 'Notifications OFF'}</span>
                </button>
                <button
                  onClick={() => openAlertModal(item)}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-md font-medium text-sm flex items-center justify-center space-x-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Set Alert</span>
                </button>
              </div>

              {/* Price Display */}
              <div className="mb-4">
                <div className="text-xl sm:text-2xl font-bold text-white [data-theme='light']:text-gray-900 mb-1">
                  ${item.currentPrice?.toFixed(2) || 'N/A'}
                </div>
                <div className={`flex items-center text-xs sm:text-sm font-medium ${
                  item.change >= 0 ? 'text-emerald-400 [data-theme="light"]:text-emerald-600' : 'text-red-400 [data-theme="light"]:text-red-600'
                }`}>
                  {item.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)} ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                </div>
              </div>

              {/* Price Alert Status */}
              {item.priceAlert && item.priceAlert.enabled && (
                <div className="mb-4 p-3 bg-gradient-to-br from-blue-900/40 to-blue-800/40 border-2 border-blue-500/50 rounded-lg [data-theme='light']:from-blue-50 [data-theme='light']:to-blue-100 [data-theme='light']:border-blue-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center text-blue-300 [data-theme='light']:text-blue-700 text-xs sm:text-sm font-semibold mb-2">
                        <AlertCircle className="w-4 h-4 mr-1 animate-pulse" />
                        {t('watchlist.priceAlertActive')}
                      </div>
                      <div className="space-y-1">
                        {(item.priceAlert.type === 'high' || item.priceAlert.type === 'both') && item.priceAlert.highPrice && (
                          <div className="text-xs text-emerald-300 [data-theme='light']:text-emerald-700 font-medium">
                            ↗️ {t('watchlist.high')}: ${item.priceAlert.highPrice.toFixed(2)}
                          </div>
                        )}
                        {(item.priceAlert.type === 'low' || item.priceAlert.type === 'both') && item.priceAlert.lowPrice && (
                          <div className="text-xs text-red-300 [data-theme='light']:text-red-700 font-medium">
                            ↘️ {t('watchlist.low')}: ${item.priceAlert.lowPrice.toFixed(2)}
                          </div>
                        )}
                      </div>
                      {item.priceAlert.triggeredCount > 0 && (
                        <div className="text-xs text-slate-400 [data-theme='light']:text-gray-500 mt-2 flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5 animate-pulse"></div>
                          {t('watchlist.triggered')} {item.priceAlert.triggeredCount} {item.priceAlert.triggeredCount > 1 ? t('watchlist.times') : t('watchlist.time')}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePriceAlert(item.id, item.ticker);
                      }}
                      className="text-red-400 hover:text-red-300 [data-theme='light']:text-red-600 [data-theme='light']:hover:text-red-700 transition-colors p-1 hover:bg-red-500/20 rounded"
                      title={t('watchlist.removeAlert')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-slate-400 [data-theme='light']:text-gray-500 pt-3 border-t border-slate-700/50 [data-theme='light']:border-gray-200">
                <span className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5"></div>
                  {t('watchlist.addedDate')}: {new Date(item.addedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t('watchlist.removeStockConfirm'))) {
                      removeFromWatchlist(item.id, item.ticker);
                    }
                  }}
                  className="text-red-400 hover:text-red-300 [data-theme='light']:text-red-600 [data-theme='light']:hover:text-red-700 transition-colors hover:bg-red-500/20 rounded p-1"
                  title={t('watchlist.removeStock')}
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
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 [data-theme='light']:from-gray-100 [data-theme='light']:to-gray-50 rounded-lg border border-slate-700/50 [data-theme='light']:border-gray-200">
          <p className="text-xs sm:text-sm text-slate-300 [data-theme='light']:text-gray-700 flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
            {t('watchlist.trackingStocks')} <span className="font-bold mx-1">{watchlist.length}</span> {t('watchlist.of')} <span className="font-bold mx-1">{user.subscriptionTier === 'premium' || user.subscriptionTier === 'premium+' ? 20 : 5}</span> {t('watchlist.stocks')}
            {user.subscriptionTier === 'free' && watchlist.length >= 3 && (
              <span className="text-emerald-400 [data-theme='light']:text-emerald-600 ml-2">✨ {t('watchlist.upgradeMessage')}</span>
            )}
          </p>
        </div>
      )}

      {/* Price Alert Modal - IMPROVED UX */}
      {showAlertModal && selectedStock && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card p-4 sm:p-6 max-w-md w-full modal-content shadow-2xl bg-gradient-to-br from-slate-800 to-slate-900 [data-theme='light']:from-white [data-theme='light']:to-gray-50">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white [data-theme='light']:text-gray-900">{t('priceAlertTitle')}</h3>
              </div>
              <button
                onClick={closeAlertModal}
                className="text-slate-400 hover:text-white [data-theme='light']:text-gray-600 [data-theme='light']:hover:text-gray-900 transition-colors hover:bg-slate-700 [data-theme='light']:hover:bg-gray-200 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stock Info - Prominent */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 [data-theme='light']:from-blue-50 [data-theme='light']:to-purple-50 rounded-lg border border-blue-700/50 [data-theme='light']:border-blue-200">
              <div className="text-2xl font-bold text-white [data-theme='light']:text-gray-900 mb-1">{selectedStock.ticker}</div>
              <div className="text-sm text-slate-300 [data-theme='light']:text-gray-600 mb-2">{selectedStock.name}</div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xs text-slate-400 [data-theme='light']:text-gray-500">{t('currentPrice')}:</span>
                <span className="text-xl font-bold text-blue-400 [data-theme='light']:text-blue-600">${selectedStock.currentPrice?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>

            {/* Alert Type Selection - Visual */}
            <div className="mb-6">
              <label className="block text-xs sm:text-sm font-medium text-slate-300 [data-theme='light']:text-gray-700 mb-3">{t('alertType')}</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setAlertType('high')}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                    alertType === 'high'
                      ? 'border-emerald-500 bg-gradient-to-br from-emerald-900/50 to-emerald-800/50 text-white shadow-lg shadow-emerald-500/30 [data-theme="light"]:from-emerald-50 [data-theme="light"]:to-emerald-100 [data-theme="light"]:text-emerald-800'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-emerald-600/50 [data-theme="light"]:border-gray-300 [data-theme="light"]:bg-gray-50 [data-theme="light"]:text-gray-600 [data-theme="light"]:hover:border-emerald-400'
                  }`}
                >
                  <TrendingUp className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-semibold">{t('highOnly')}</div>
                </button>
                <button
                  onClick={() => setAlertType('low')}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                    alertType === 'low'
                      ? 'border-red-500 bg-gradient-to-br from-red-900/50 to-red-800/50 text-white shadow-lg shadow-red-500/30 [data-theme="light"]:from-red-50 [data-theme="light"]:to-red-100 [data-theme="light"]:text-red-800'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-red-600/50 [data-theme="light"]:border-gray-300 [data-theme="light"]:bg-gray-50 [data-theme="light"]:text-gray-600 [data-theme="light"]:hover:border-red-400'
                  }`}
                >
                  <TrendingDown className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-semibold">{t('lowOnly')}</div>
                </button>
                <button
                  onClick={() => setAlertType('both')}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                    alertType === 'both'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-900/50 to-purple-900/50 text-white shadow-lg shadow-blue-500/30 [data-theme="light"]:from-blue-50 [data-theme="light"]:to-purple-100 [data-theme="light"]:text-blue-800'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-blue-600/50 [data-theme="light"]:border-gray-300 [data-theme="light"]:bg-gray-50 [data-theme="light"]:text-gray-600 [data-theme="light"]:hover:border-blue-400'
                  }`}
                >
                  <AlertCircle className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-semibold">{t('both')}</div>
                </button>
              </div>
            </div>

            {/* Price Inputs - Clear and Simple */}
            <div className="space-y-4 mb-6">
              {(alertType === 'high' || alertType === 'both') && (
                <div className="bg-emerald-900/20 [data-theme='light']:bg-emerald-50 p-4 rounded-lg border border-emerald-700/50 [data-theme='light']:border-emerald-200">
                  <label className="block text-xs sm:text-sm font-semibold text-emerald-300 [data-theme='light']:text-emerald-700 mb-2 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1.5" />
                    {t('highPriceLabel')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={highPrice}
                      onChange={(e) => setHighPrice(e.target.value)}
                      placeholder={(selectedStock.currentPrice * 1.1).toFixed(2)}
                      className="input-field w-full pl-8 text-lg font-bold"
                    />
                  </div>
                </div>
              )}

              {(alertType === 'low' || alertType === 'both') && (
                <div className="bg-red-900/20 [data-theme='light']:bg-red-50 p-4 rounded-lg border border-red-700/50 [data-theme='light']:border-red-200">
                  <label className="block text-xs sm:text-sm font-semibold text-red-300 [data-theme='light']:text-red-700 mb-2 flex items-center">
                    <TrendingDown className="w-4 h-4 mr-1.5" />
                    {t('lowPriceLabel')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={lowPrice}
                      onChange={(e) => setLowPrice(e.target.value)}
                      placeholder={(selectedStock.currentPrice * 0.9).toFixed(2)}
                      className="input-field w-full pl-8 text-lg font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="mb-6 p-4 bg-blue-900/20 [data-theme='light']:bg-blue-50 border border-blue-700/50 [data-theme='light']:border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-blue-400 [data-theme='light']:text-blue-600" />
                </div>
                <div className="text-xs sm:text-sm text-slate-300 [data-theme='light']:text-gray-700">
                  <div className="font-semibold text-blue-300 [data-theme='light']:text-blue-700 mb-1">{t('smartMonitoring')}</div>
                  <p className="text-xs leading-relaxed">
                    {t('smartMonitoringDesc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons - Clear and Prominent */}
            <div className="flex space-x-3">
              <button
                onClick={closeAlertModal}
                disabled={savingAlert}
                className="flex-1 py-3 px-4 bg-slate-700 text-white rounded-lg hover:bg-slate-600 [data-theme='light']:bg-gray-200 [data-theme='light']:text-gray-900 [data-theme='light']:hover:bg-gray-300 transition-all font-medium disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={savePriceAlert}
                disabled={savingAlert}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/50 font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {savingAlert ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{t('common.save')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
