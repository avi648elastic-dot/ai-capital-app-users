'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface StockFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function StockForm({ onSubmit, onCancel }: StockFormProps) {
  const [formData, setFormData] = useState({
    ticker: '',
    shares: '',
    entryPrice: '',
    currentPrice: '',
    stopLoss: '',
    takeProfit: '',
    notes: '',
    portfolioType: 'solid' as 'solid' | 'dangerous',
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

  // Auto-fetch current price when ticker is entered
  useEffect(() => {
    const fetchCurrentPrice = async () => {
      if (formData.ticker && formData.ticker.length >= 2) {
        console.log('🔍 [STOCK FORM] Fetching price for:', formData.ticker.toUpperCase());
        setFetchingPrice(true);
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/test-stock/${formData.ticker.toUpperCase()}`);
          console.log('✅ [STOCK FORM] API response:', response.data);
          
          if (response.data.status === 'OK' && response.data.data) {
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
            console.warn('⚠️ [STOCK FORM] No data received for:', formData.ticker);
          }
        } catch (error) {
          console.error('❌ [STOCK FORM] Error fetching current price:', error);
          console.error('❌ [STOCK FORM] Error details:', error.response?.data);
        } finally {
          setFetchingPrice(false);
        }
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(fetchCurrentPrice, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.ticker, formData.entryPrice, autoCalculate]);

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

        {/* Portfolio Type Selector */}
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
              Current Price * {fetchingPrice && <span className="text-blue-400 text-xs">(Fetching...)</span>}
            </label>
            <input
              type="number"
              id="currentPrice"
              name="currentPrice"
              value={formData.currentPrice}
              onChange={handleInputChange}
              className="input-field"
              placeholder="e.g., 155.00"
              step="0.01"
              min="0"
              required
            />
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
