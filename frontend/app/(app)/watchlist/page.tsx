'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Eye, Plus, Trash2, TrendingUp, TrendingDown, Bell, BellOff, AlertCircle, Settings, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

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
      alert(`${t('watchlist.trackingStocks')} ${maxStocks} ${t('watchlist.stocks')}. ${user?.subscriptionTier === 'free' ? t('watchlist.upgradeMessage') : ''}`);
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
      setNewTicker('');
      alert(`${newTicker.toUpperCase()} ${t('watchlist.stockAdded')}`);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.error || t('watchlist.failedToAdd'));
      }
    } finally {
      setAddingStock(false);
    }
  };

  const removeFromWatchlist = async (id: string) => {
    if (!confirm(t('watchlist.removeStockConfirm'))) return;

    try {
      const token = Cookies.get('token');
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWatchlist(watchlist.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      alert(t('watchlist.failedToRemove'));
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
      alert(t('watchlist.failedToUpdate'));
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
      alert(t('watchlist.validHighPrice'));
      return;
    }

    if ((alertType === 'low' || alertType === 'both') && (!lowPrice || parseFloat(lowPrice) <= 0)) {
      alert(t('watchlist.validLowPrice'));
      return;
    }

    if (alertType === 'both' && parseFloat(lowPrice) >= parseFloat(highPrice)) {
      alert(t('watchlist.lowLessThanHigh'));
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
      alert(t('watchlist.alertSetSuccess'));
    } catch (error) {
      console.error('Error setting price alert:', error);
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.error || t('watchlist.failedToSetAlert'));
      }
    }
  };

  const removePriceAlert = async (id: string) => {
    if (!confirm(t('watchlist.removeAlertConfirm'))) return;

    try {
      const token = Cookies.get('token');
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/${id}/alert`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchUserAndWatchlist();
      alert(t('common.success'));
    } catch (error) {
      console.error('Error removing price alert:', error);
      alert(t('watchlist.failedToRemoveAlert'));
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
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white [data-theme='light']:text-gray-900 mb-2">{t('watchlist.title')}</h1>
        <p className="text-sm sm:text-base text-slate-400 [data-theme='light']:text-gray-600">{t('watchlist.subtitle')}</p>
      </div>

      {/* Add Stock Form */}
      <div className="card p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-white [data-theme='light']:text-gray-900 mb-4 flex items-center">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          {t('watchlist.addStock')}
        </h2>
        <div className="flex gap-3 sm:gap-4">
          <input
            type="text"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
            placeholder={t('watchlist.enterSymbol')}
            className="input-field flex-1 text-sm sm:text-base"
            onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()}
          />
          <button
            onClick={addToWatchlist}
            disabled={addingStock || !newTicker.trim()}
            className="btn-primary px-4 sm:px-6 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addingStock ? t('watchlist.adding') : t('watchlist.addButton')}
          </button>
        </div>
      </div>

      {/* Watchlist Grid */}
      {watchlist.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center">
          <Eye className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 [data-theme='light']:text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-white [data-theme='light']:text-gray-900 mb-2">{t('watchlist.emptyTitle')}</h3>
          <p className="text-sm sm:text-base text-slate-400 [data-theme='light']:text-gray-600 mb-6">{t('watchlist.emptyDescription')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {watchlist.map((item) => (
            <div key={item.id} className="card p-4 sm:p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-white [data-theme='light']:text-gray-900">{item.ticker}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 [data-theme='light']:text-gray-600">{item.name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleNotifications(item.id, item.notifications)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.notifications 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600 [data-theme="light"]:bg-gray-200 [data-theme="light"]:text-gray-600 [data-theme="light"]:hover:bg-gray-300'
                    }`}
                    title={item.notifications ? t('watchlist.notificationsEnabled') : t('watchlist.notificationsDisabled')}
                  >
                    {item.notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openAlertModal(item)}
                    className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    title={t('watchlist.setPriceAlert')}
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xl sm:text-2xl font-bold text-white [data-theme='light']:text-gray-900 mb-1">
                  ${item.currentPrice.toFixed(2)}
                </div>
                <div className={`flex items-center text-xs sm:text-sm ${
                  item.change >= 0 ? 'text-emerald-400 [data-theme="light"]:text-emerald-600' : 'text-red-400 [data-theme="light"]:text-red-600'
                }`}>
                  {item.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)} ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                </div>
              </div>

              {/* Price Alert Status */}
              {item.priceAlert && item.priceAlert.enabled && (
                <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg [data-theme='light']:bg-blue-50 [data-theme='light']:border-blue-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center text-blue-400 [data-theme='light']:text-blue-600 text-xs sm:text-sm font-medium mb-1">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {t('watchlist.priceAlertActive')}
                      </div>
                      {(item.priceAlert.type === 'high' || item.priceAlert.type === 'both') && item.priceAlert.highPrice && (
                        <div className="text-xs text-slate-300 [data-theme='light']:text-gray-700">
                          📈 {t('watchlist.high')}: ${item.priceAlert.highPrice.toFixed(2)}
                        </div>
                      )}
                      {(item.priceAlert.type === 'low' || item.priceAlert.type === 'both') && item.priceAlert.lowPrice && (
                        <div className="text-xs text-slate-300 [data-theme='light']:text-gray-700">
                          📉 {t('watchlist.low')}: ${item.priceAlert.lowPrice.toFixed(2)}
                        </div>
                      )}
                      {item.priceAlert.triggeredCount > 0 && (
                        <div className="text-xs text-slate-400 [data-theme='light']:text-gray-500 mt-1">
                          {t('watchlist.triggered')} {item.priceAlert.triggeredCount} {item.priceAlert.triggeredCount > 1 ? t('watchlist.times') : t('watchlist.time')}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removePriceAlert(item.id)}
                      className="text-red-400 hover:text-red-300 [data-theme='light']:text-red-600 [data-theme='light']:hover:text-red-700 transition-colors p-1"
                      title={t('watchlist.removeAlert')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-400 [data-theme='light']:text-gray-500">
                <span>{t('watchlist.addedDate')}: {new Date(item.addedAt).toLocaleDateString()}</span>
                <button
                  onClick={() => removeFromWatchlist(item.id)}
                  className="text-red-400 hover:text-red-300 [data-theme='light']:text-red-600 [data-theme='light']:hover:text-red-700 transition-colors"
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
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-slate-800/50 [data-theme='light']:bg-gray-100 rounded-lg">
          <p className="text-xs sm:text-sm text-slate-400 [data-theme='light']:text-gray-600">
            {t('watchlist.trackingStocks')} {watchlist.length} {t('watchlist.of')} {user.subscriptionTier === 'premium' || user.subscriptionTier === 'premium+' ? 20 : 5} {t('watchlist.stocks')}. 
            {user.subscriptionTier === 'free' && (
              <span className="text-emerald-400 [data-theme='light']:text-emerald-600 ml-1">{t('watchlist.upgradeMessage')}</span>
            )}
          </p>
        </div>
      )}

      {/* Price Alert Modal */}
      {showAlertModal && selectedStock && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card p-4 sm:p-6 max-w-md w-full modal-content">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-white [data-theme='light']:text-gray-900">{t('watchlist.priceAlertTitle')}</h3>
              <button
                onClick={closeAlertModal}
                className="text-slate-400 hover:text-white [data-theme='light']:text-gray-600 [data-theme='light']:hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 sm:mb-6">
              <div className="text-base sm:text-lg font-semibold text-white [data-theme='light']:text-gray-900 mb-2">{selectedStock.ticker}</div>
              <div className="text-sm sm:text-base text-slate-400 [data-theme='light']:text-gray-600">{t('watchlist.currentPrice')}: ${selectedStock.currentPrice.toFixed(2)}</div>
            </div>

            {/* Alert Type Selection */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-slate-300 [data-theme='light']:text-gray-700 mb-3">{t('watchlist.alertType')}</label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  onClick={() => setAlertType('high')}
                  className={`p-2 sm:p-3 rounded-lg border-2 transition-colors ${
                    alertType === 'high'
                      ? 'border-emerald-500 bg-emerald-900/30 text-white [data-theme="light"]:bg-emerald-50 [data-theme="light"]:text-emerald-700'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 [data-theme="light"]:border-gray-300 [data-theme="light"]:bg-gray-50 [data-theme="light"]:text-gray-600 [data-theme="light"]:hover:border-gray-400'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">{t('watchlist.highOnly')}</div>
                </button>
                <button
                  onClick={() => setAlertType('low')}
                  className={`p-2 sm:p-3 rounded-lg border-2 transition-colors ${
                    alertType === 'low'
                      ? 'border-red-500 bg-red-900/30 text-white [data-theme="light"]:bg-red-50 [data-theme="light"]:text-red-700'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 [data-theme="light"]:border-gray-300 [data-theme="light"]:bg-gray-50 [data-theme="light"]:text-gray-600 [data-theme="light"]:hover:border-gray-400'
                  }`}
                >
                  <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">{t('watchlist.lowOnly')}</div>
                </button>
                <button
                  onClick={() => setAlertType('both')}
                  className={`p-2 sm:p-3 rounded-lg border-2 transition-colors ${
                    alertType === 'both'
                      ? 'border-blue-500 bg-blue-900/30 text-white [data-theme="light"]:bg-blue-50 [data-theme="light"]:text-blue-700'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 [data-theme="light"]:border-gray-300 [data-theme="light"]:bg-gray-50 [data-theme="light"]:text-gray-600 [data-theme="light"]:hover:border-gray-400'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">{t('watchlist.both')}</div>
                </button>
              </div>
            </div>

            {/* Price Inputs */}
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              {(alertType === 'high' || alertType === 'both') && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 [data-theme='light']:text-gray-700 mb-2">
                    {t('watchlist.highPriceLabel')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={highPrice}
                    onChange={(e) => setHighPrice(e.target.value)}
                    placeholder={`${(selectedStock.currentPrice * 1.1).toFixed(2)}`}
                    className="input-field w-full text-sm sm:text-base"
                  />
                </div>
              )}

              {(alertType === 'low' || alertType === 'both') && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 [data-theme='light']:text-gray-700 mb-2">
                    {t('watchlist.lowPriceLabel')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={lowPrice}
                    onChange={(e) => setLowPrice(e.target.value)}
                    placeholder={`${(selectedStock.currentPrice * 0.9).toFixed(2)}`}
                    className="input-field w-full text-sm sm:text-base"
                  />
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg [data-theme='light']:bg-blue-50 [data-theme='light']:border-blue-200">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 [data-theme='light']:text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-300 [data-theme='light']:text-gray-700">
                  <div className="font-medium text-blue-400 [data-theme='light']:text-blue-600 mb-1">{t('watchlist.smartMonitoring')}</div>
                  <p className="text-xs">
                    {t('watchlist.smartMonitoringDesc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={closeAlertModal}
                className="flex-1 py-2 sm:py-3 px-3 sm:px-4 bg-slate-700 text-white rounded-lg hover:bg-slate-600 [data-theme='light']:bg-gray-200 [data-theme='light']:text-gray-900 [data-theme='light']:hover:bg-gray-300 transition-colors text-sm sm:text-base"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={savePriceAlert}
                className="flex-1 py-2 sm:py-3 px-3 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
