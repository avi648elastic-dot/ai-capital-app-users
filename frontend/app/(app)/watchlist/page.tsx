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
    console.log('🔔 Opening alert modal for', stock.ticker, 'with alert:', stock.priceAlert);
    setSelectedStock(stock);
    if (stock.priceAlert && stock.priceAlert.enabled) {
      // Load existing alert values
      setAlertType(stock.priceAlert.type);
      setHighPrice(stock.priceAlert.highPrice?.toString() || '');
      setLowPrice(stock.priceAlert.lowPrice?.toString() || '');
      console.log('✅ Loaded existing alert:', {
        type: stock.priceAlert.type,
        high: stock.priceAlert.highPrice,
        low: stock.priceAlert.lowPrice
      });
    } else {
      // No alert set - use suggested prices
      setAlertType('both');
      const suggestedHigh = (stock.currentPrice * 1.1).toFixed(2);
      const suggestedLow = (stock.currentPrice * 0.9).toFixed(2);
      setHighPrice(suggestedHigh);
      setLowPrice(suggestedLow);
      console.log('💡 Setting suggested prices:', { high: suggestedHigh, low: suggestedLow });
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
      if (!token) {
        showToast('error', '❌ Please login to set price alerts');
        return;
      }

      const alertData = {
        type: alertType,
        highPrice: (alertType === 'high' || alertType === 'both') ? parseFloat(highPrice) : undefined,
        lowPrice: (alertType === 'low' || alertType === 'both') ? parseFloat(lowPrice) : undefined,
        enabled: true
      };

      console.log('🔔 Setting price alert for', selectedStock.ticker, ':', alertData);

      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/${selectedStock.id}/alert`,
        alertData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Price alert set successfully:', response.data);

      await fetchUserAndWatchlist();
      closeAlertModal();
      showToast('success', `✅ ${t('watchlist.alertSetSuccess')}`);
    } catch (error) {
      console.error('❌ Error setting price alert:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.error || error.message || t('watchlist.failedToSetAlert');
        console.error('❌ Backend error:', error.response?.data);
        showToast('error', `❌ ${errorMsg}`);
      } else {
        showToast('error', `❌ ${t('watchlist.failedToSetAlert')}`);
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

              {/* Quick Alert Setup - Simple & Direct */}
              <div className="mb-4 p-3 bg-slate-700/30 [data-theme='light']:bg-gray-100 rounded-lg border border-slate-600/30 [data-theme='light']:border-gray-300">
                <div className="text-xs font-semibold text-slate-300 [data-theme='light']:text-gray-700 mb-2 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Quick Price Alerts
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 [data-theme='light']:text-gray-600 block mb-1">High Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={(item.currentPrice * 1.1).toFixed(2)}
                      defaultValue={item.priceAlert?.highPrice?.toString() || ''}
                      onBlur={async (e) => {
                        const value = parseFloat(e.target.value);
                        if (value > 0 && value > item.currentPrice) {
                          try {
                            const token = Cookies.get('token');
                            await axios.patch(
                              `${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/${item.id}/alert`,
                              {
                                type: item.priceAlert?.lowPrice ? 'both' : 'high',
                                highPrice: value,
                                lowPrice: item.priceAlert?.lowPrice,
                                enabled: true
                              },
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            await fetchUserAndWatchlist();
                            showToast('success', `✅ High alert set at $${value.toFixed(2)}`);
                          } catch (error) {
                            showToast('error', '❌ Failed to set alert');
                          }
                        }
                      }}
                      className="w-full px-2 py-1.5 text-xs bg-slate-800 [data-theme='light']:bg-white border border-slate-600 [data-theme='light']:border-gray-300 rounded text-white [data-theme='light']:text-gray-900 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 [data-theme='light']:text-gray-600 block mb-1">Low Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={(item.currentPrice * 0.9).toFixed(2)}
                      defaultValue={item.priceAlert?.lowPrice?.toString() || ''}
                      onBlur={async (e) => {
                        const value = parseFloat(e.target.value);
                        if (value > 0 && value < item.currentPrice) {
                          try {
                            const token = Cookies.get('token');
                            await axios.patch(
                              `${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/${item.id}/alert`,
                              {
                                type: item.priceAlert?.highPrice ? 'both' : 'low',
                                highPrice: item.priceAlert?.highPrice,
                                lowPrice: value,
                                enabled: true
                              },
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            await fetchUserAndWatchlist();
                            showToast('success', `✅ Low alert set at $${value.toFixed(2)}`);
                          } catch (error) {
                            showToast('error', '❌ Failed to set alert');
                          }
                        }
                      }}
                      className="w-full px-2 py-1.5 text-xs bg-slate-800 [data-theme='light']:bg-white border border-slate-600 [data-theme='light']:border-gray-300 rounded text-white [data-theme='light']:text-gray-900 focus:ring-1 focus:ring-red-500"
                    />
                  </div>
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
                  <span>Advanced</span>
                </button>
              </div>

              {/* Price Display */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xl sm:text-2xl font-bold text-white [data-theme='light']:text-gray-900">
                    ${item.currentPrice?.toFixed(2) || 'N/A'}
                  </div>
                  {/* Simple Price Targets Display */}
                  {item.priceAlert && item.priceAlert.enabled ? (
                    <div className="flex flex-col items-end space-y-1">
                      {(item.priceAlert.type === 'high' || item.priceAlert.type === 'both') && item.priceAlert.highPrice && (
                        <div className="flex items-center text-xs bg-emerald-900/30 [data-theme='light']:bg-emerald-100 text-emerald-300 [data-theme='light']:text-emerald-700 px-2 py-1 rounded-full border border-emerald-500/30">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          ${item.priceAlert.highPrice.toFixed(2)}
                        </div>
                      )}
                      {(item.priceAlert.type === 'low' || item.priceAlert.type === 'both') && item.priceAlert.lowPrice && (
                        <div className="flex items-center text-xs bg-red-900/30 [data-theme='light']:bg-red-100 text-red-300 [data-theme='light']:text-red-700 px-2 py-1 rounded-full border border-red-500/30">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          ${item.priceAlert.lowPrice.toFixed(2)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center text-xs bg-slate-700/50 [data-theme='light']:bg-gray-200 text-slate-400 [data-theme='light']:text-gray-500 px-2 py-1 rounded-full border border-slate-600/30 [data-theme='light']:border-gray-300">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      No alerts
                    </div>
                  )}
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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 [data-theme='light']:from-yellow-300 [data-theme='light']:via-orange-400 [data-theme='light']:to-red-400 rounded-3xl shadow-2xl border-4 border-white/20 [data-theme='light']:border-gray-200 w-full max-w-sm sm:max-w-lg max-h-[90vh] overflow-y-auto transform scale-100 animate-in zoom-in-95 duration-300">
            {/* ULTRA PROMINENT HEADER */}
            <div className="relative p-4 sm:p-6 border-b border-white/20 [data-theme='light']:border-gray-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg animate-pulse">
                    <AlertCircle className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-2xl font-black text-white mb-1">
                      🚨 PRICE ALERT
                    </h3>
                    <p className="text-sm sm:text-base text-white/90 font-medium">
                      Set your targets
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeAlertModal}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all duration-200 flex items-center justify-center border border-white/30"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
            
            {/* CONTENT AREA */}
            <div className="p-4 sm:p-6">

              {/* STOCK INFO - ULTRA PROMINENT */}
              <div className="mb-6 p-4 sm:p-6 bg-white/10 [data-theme='light']:bg-gray-900/10 rounded-2xl border-2 border-white/20 [data-theme='light']:border-gray-300 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-black text-white [data-theme='light']:text-gray-900 mb-2">
                    {selectedStock.ticker}
                  </div>
                  <div className="text-sm sm:text-base text-white/80 [data-theme='light']:text-gray-700 mb-3 font-medium">
                    {selectedStock.name}
                  </div>
                  <div className="bg-white/20 [data-theme='light']:bg-gray-800/20 rounded-xl p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-white/70 [data-theme='light']:text-gray-400 mb-1 font-medium">
                      CURRENT PRICE
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white [data-theme='light']:text-gray-900">
                      ${selectedStock.currentPrice?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* ALERT TYPE SELECTION - ULTRA PROMINENT */}
              <div className="mb-6">
                <label className="block text-sm sm:text-base font-black text-white [data-theme='light']:text-gray-900 mb-4 text-center">
                  🎯 CHOOSE ALERT TYPE
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setAlertType('high')}
                    className={`p-4 sm:p-5 rounded-2xl border-3 transition-all transform hover:scale-105 ${
                      alertType === 'high'
                        ? 'border-green-400 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl shadow-green-500/50'
                        : 'border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-green-300'
                    }`}
                  >
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" />
                    <div className="text-sm sm:text-base font-black">HIGH ONLY</div>
                    <div className="text-xs opacity-80">Price goes up</div>
                  </button>
                  <button
                    onClick={() => setAlertType('low')}
                    className={`p-4 sm:p-5 rounded-2xl border-3 transition-all transform hover:scale-105 ${
                      alertType === 'low'
                        ? 'border-red-400 bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-xl shadow-red-500/50'
                        : 'border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-red-300'
                    }`}
                  >
                    <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" />
                    <div className="text-sm sm:text-base font-black">LOW ONLY</div>
                    <div className="text-xs opacity-80">Price goes down</div>
                  </button>
                  <button
                    onClick={() => setAlertType('both')}
                    className={`p-4 sm:p-5 rounded-2xl border-3 transition-all transform hover:scale-105 sm:col-span-1 ${
                      alertType === 'both'
                        ? 'border-blue-400 bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl shadow-blue-500/50'
                        : 'border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-blue-300'
                    }`}
                  >
                    <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" />
                    <div className="text-sm sm:text-base font-black">BOTH</div>
                    <div className="text-xs opacity-80">Up & down alerts</div>
                  </button>
                </div>
              </div>

              {/* PRICE INPUTS - ULTRA PROMINENT */}
              <div className="space-y-4 mb-6">
                {(alertType === 'high' || alertType === 'both') && (
                  <div className="bg-white/10 [data-theme='light']:bg-gray-900/10 p-4 sm:p-6 rounded-2xl border-2 border-green-400/50 [data-theme='light']:border-green-300 backdrop-blur-sm">
                    <label className="block text-sm sm:text-base font-black text-white [data-theme='light']:text-gray-900 mb-3 text-center">
                      📈 HIGH PRICE ALERT
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-white [data-theme='light']:text-gray-900">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={highPrice}
                        onChange={(e) => setHighPrice(e.target.value)}
                        placeholder={(selectedStock.currentPrice * 1.1).toFixed(2)}
                        className="w-full pl-12 pr-4 py-4 sm:py-5 text-xl sm:text-2xl font-black text-white [data-theme='light']:text-gray-900 bg-white/20 [data-theme='light']:bg-gray-800/20 rounded-xl border-2 border-green-400/30 [data-theme='light']:border-green-300 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 outline-none"
                      />
                    </div>
                    <div className="text-xs text-white/70 [data-theme='light']:text-gray-400 mt-2 text-center">
                      When price goes ABOVE this amount
                    </div>
                  </div>
                )}

                {(alertType === 'low' || alertType === 'both') && (
                  <div className="bg-white/10 [data-theme='light']:bg-gray-900/10 p-4 sm:p-6 rounded-2xl border-2 border-red-400/50 [data-theme='light']:border-red-300 backdrop-blur-sm">
                    <label className="block text-sm sm:text-base font-black text-white [data-theme='light']:text-gray-900 mb-3 text-center">
                      📉 LOW PRICE ALERT
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-white [data-theme='light']:text-gray-900">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={lowPrice}
                        onChange={(e) => setLowPrice(e.target.value)}
                        placeholder={(selectedStock.currentPrice * 0.9).toFixed(2)}
                        className="w-full pl-12 pr-4 py-4 sm:py-5 text-xl sm:text-2xl font-black text-white [data-theme='light']:text-gray-900 bg-white/20 [data-theme='light']:bg-gray-800/20 rounded-xl border-2 border-red-400/30 [data-theme='light']:border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-400/20 outline-none"
                      />
                    </div>
                    <div className="text-xs text-white/70 [data-theme='light']:text-gray-400 mt-2 text-center">
                      When price goes BELOW this amount
                    </div>
                  </div>
                )}
              </div>

              {/* INFO BOX - PROMINENT */}
              <div className="mb-6 p-4 sm:p-5 bg-white/10 [data-theme='light']:bg-gray-900/10 rounded-2xl border-2 border-white/20 [data-theme='light']:border-gray-300 backdrop-blur-sm">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Info className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div className="text-sm sm:text-base text-white [data-theme='light']:text-gray-900">
                    <div className="font-black text-white [data-theme='light']:text-gray-900 mb-2">⚡ SMART MONITORING</div>
                    <p className="text-xs sm:text-sm leading-relaxed text-white/80 [data-theme='light']:text-gray-700">
                      We check prices every 5 minutes and send instant notifications when your targets are reached!
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS - ULTRA PROMINENT */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={closeAlertModal}
                  disabled={savingAlert}
                  className="flex-1 py-4 sm:py-5 px-6 bg-white/20 hover:bg-white/30 text-white rounded-2xl transition-all font-black text-lg disabled:opacity-50 border-2 border-white/30"
                >
                  CANCEL
                </button>
                <button
                  onClick={savePriceAlert}
                  disabled={savingAlert}
                  className="flex-1 py-4 sm:py-5 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl transition-all shadow-xl shadow-green-500/50 font-black text-lg disabled:opacity-50 flex items-center justify-center space-x-2 border-2 border-green-400"
                >
                  {savingAlert ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>SAVING...</span>
                    </>
                  ) : (
                    <span>💾 SAVE ALERT</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
