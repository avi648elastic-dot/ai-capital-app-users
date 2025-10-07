'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface StockFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isPremium?: boolean;
  defaultPortfolioType?: 'solid' | 'dangerous';
}

export default function StockForm({ onSubmit, onCancel, isPremium = false, defaultPortfolioType = 'solid' }: StockFormProps) {
  const [formData, setFormData] = useState({
    ticker: '',
    shares: '',
    entryPrice: '',
    currentPrice: '',
    stopLoss: '',
    takeProfit: '',
    notes: '',
    portfolioType: defaultPortfolioType as 'solid' | 'dangerous',
  });

  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        shares: Number(formData.shares),
        entryPrice: Number(formData.entryPrice),
        currentPrice: Number(formData.currentPrice),
        stopLoss: formData.stopLoss ? Number(formData.stopLoss) : undefined,
        takeProfit: formData.takeProfit ? Number(formData.takeProfit) : undefined,
      };

      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch current price when ticker is entered - with debounce
  useEffect(() => {
    const fetchCurrentPrice = async () => {
      if (formData.ticker && formData.ticker.length >= 2) {
        console.log('🔍 [STOCK FORM] Fetching price for:', formData.ticker.toUpperCase());
        setFetchingPrice(true);
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/test-stock/${formData.ticker.toUpperCase()}`, {
            timeout: 10000 // 10 second timeout
          });
          console.log('✅ [STOCK FORM] API response:', response.data);
          
          if (response.data.status === 'OK' && response.data.data && response.data.data.current) {
            const currentPrice = response.data.data.current;
            console.log('✅ [STOCK FORM] Setting current price:', currentPrice);
            
            setFormData(prev => ({
              ...prev,
              currentPrice: currentPrice.toString()
            }));
            
            // Auto-calculate stop loss and take profit if enabled
            if (autoCalculate && formData.entryPrice) {
              const entryPrice = parseFloat(formData.entryPrice);
              const stopLoss = (entryPrice * 0.92).toFixed(2); // 8% below entry
              const takeProfit = (entryPrice * 1.15).toFixed(2); // 15% above entry
              
              setFormData(prev => ({
                ...prev,
                stopLoss: stopLoss,
                takeProfit: takeProfit
              }));
            }
          } else {
            console.warn('⚠️ [STOCK FORM] No valid data received for:', formData.ticker);
            // Try to get a reasonable fallback price
            const fallbackPrice = getFallbackPrice(formData.ticker);
            setFormData(prev => ({
              ...prev,
              currentPrice: fallbackPrice
            }));
          }
        } catch (error) {
          console.error('❌ [STOCK FORM] Error fetching current price:', error);
          console.error('❌ [STOCK FORM] Error details:', error.response?.data);
          // Try to get a reasonable fallback price
          const fallbackPrice = getFallbackPrice(formData.ticker);
          setFormData(prev => ({
            ...prev,
            currentPrice: fallbackPrice
          }));
        } finally {
          setFetchingPrice(false);
        }
      }
    };

    // Add a small debounce to avoid too many API calls
    const timeoutId = setTimeout(fetchCurrentPrice, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.ticker, autoCalculate, formData.entryPrice]);

  // Fallback price function for common stocks
  const getFallbackPrice = (ticker: string): string => {
    const fallbackPrices: Record<string, string> = {
      'AAPL': '150.00',
      'MSFT': '300.00',
      'GOOGL': '120.00',
      'AMZN': '130.00',
      'TSLA': '200.00',
      'NVDA': '400.00',
      'AMD': '100.00',
      'PLTR': '15.00',
      'ARKK': '45.00',
      'GME': '20.00',
      'SPY': '400.00',
      'QQQ': '350.00',
      'IWM': '180.00'
    };
    
    return fallbackPrices[ticker.toUpperCase()] || '50.00';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAutoCalculateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoCalculate(e.target.checked);
    
    if (e.target.checked && formData.entryPrice && formData.currentPrice) {
      const entryPrice = parseFloat(formData.entryPrice);
      const stopLoss = (entryPrice * 0.92).toFixed(2); // 8% below entry
      const takeProfit = (entryPrice * 1.15).toFixed(2); // 15% above entry
      
      setFormData(prev => ({
        ...prev,
        stopLoss: stopLoss,
        takeProfit: takeProfit
      }));
    } else if (!e.target.checked) {
      setFormData(prev => ({
        ...prev,
        stopLoss: '',
        takeProfit: ''
      }));
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Add New Stock</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="ticker" className="block text-sm font-medium text-gray-300 mb-1">
              Ticker Symbol *
            </label>
            <input
              type="text"
              id="ticker"
              name="ticker"
              value={formData.ticker}
              onChange={handleInputChange}
              className="input-field"
              placeholder="e.g., AAPL"
              required
            />
          </div>

          <div>
            <label htmlFor="shares" className="block text-sm font-medium text-gray-300 mb-1">
              Number of Shares *
            </label>
            <input
              type="number"
              id="shares"
              name="shares"
              value={formData.shares}
              onChange={handleInputChange}
              className="input-field"
              placeholder="e.g., 100"
              min="1"
              required
            />
          </div>
        </div>

        {/* Portfolio Type Selector (Premium only) */}
        {isPremium ? (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Portfolio Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="portfolioType"
                  value="solid"
                  checked={formData.portfolioType === 'solid'}
                  onChange={(e) => setFormData({ ...formData, portfolioType: e.target.value as 'solid' | 'dangerous' })}
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-slate-300">Solid Portfolio</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="portfolioType"
                  value="dangerous"
                  checked={formData.portfolioType === 'dangerous'}
                  onChange={(e) => setFormData({ ...formData, portfolioType: e.target.value as 'solid' | 'dangerous' })}
                  className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-slate-300">Dangerous Portfolio</span>
              </label>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="entryPrice" className="block text-sm font-medium text-gray-300 mb-1">
              Entry Price *
            </label>
            <input
              type="number"
              id="entryPrice"
              name="entryPrice"
              value={formData.entryPrice}
              onChange={handleInputChange}
              className="input-field"
              placeholder="e.g., 150.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div>
            <label htmlFor="currentPrice" className="block text-sm font-medium text-gray-300 mb-1">
              Current Price * 
              {fetchingPrice && (
                <span className="ml-2 text-blue-400 text-xs flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400 mr-1"></div>
                  Fetching real-time price...
                </span>
              )}
              {!fetchingPrice && formData.currentPrice && formData.currentPrice !== '0.00' && (
                <span className="ml-2 text-green-400 text-xs">✓ Real-time data loaded</span>
              )}
            </label>
            <div className="relative">
              <input
                type="number"
                id="currentPrice"
                name="currentPrice"
                value={formData.currentPrice}
                onChange={handleInputChange}
                className={`input-field pr-10 ${
                  fetchingPrice ? 'bg-blue-900/20 border-blue-500' : 
                  formData.currentPrice && formData.currentPrice !== '0.00' ? 'bg-green-900/20 border-green-500' : ''
                }`}
                placeholder="e.g., 155.00"
                step="0.01"
                min="0"
                required
              />
              {fetchingPrice && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                </div>
              )}
              {!fetchingPrice && formData.currentPrice && formData.currentPrice !== '0.00' && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
              )}
            </div>
            {formData.currentPrice === '0.00' && (
              <p className="text-xs text-amber-400 mt-1">
                ⚠️ Using fallback price. Real-time data unavailable for this ticker.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="stopLoss" className="block text-sm font-medium text-gray-300 mb-1">
              Stop Loss (Optional)
            </label>
            <input
              type="number"
              id="stopLoss"
              name="stopLoss"
              value={formData.stopLoss}
              onChange={handleInputChange}
              className="input-field"
              placeholder="e.g., 140.00"
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <label htmlFor="takeProfit" className="block text-sm font-medium text-gray-300 mb-1">
              Take Profit (Optional)
            </label>
            <input
              type="number"
              id="takeProfit"
              name="takeProfit"
              value={formData.takeProfit}
              onChange={handleInputChange}
              className="input-field"
              placeholder="e.g., 170.00"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        {/* Auto-calculate checkbox */}
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            id="autoCalculate"
            checked={autoCalculate}
            onChange={handleAutoCalculateChange}
            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label htmlFor="autoCalculate" className="text-sm font-medium text-gray-300">
            Auto-calculate Stop Loss (8% below entry) and Take Profit (15% above entry)
          </label>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className="input-field"
            placeholder="Add any additional notes about this position..."
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Stock'}
          </button>
        </div>
      </form>
    </div>
  );
}
