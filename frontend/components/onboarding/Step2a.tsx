'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface Stock {
  ticker: string;
  shares: number;
  entryPrice: number;
  currentPrice: number;
  notes?: string;
}

interface Step2aProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

// Version 2.1 - Auto-calculate total portfolio value
export default function Step2a({ onComplete, onBack }: Step2aProps) {
  const [stocks, setStocks] = useState<Stock[]>([
    { ticker: '', shares: 0, entryPrice: 0, currentPrice: 0, notes: '' }
  ]);
  const [riskTolerance, setRiskTolerance] = useState('7');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Auto-calculate total capital from stocks
  const totalCapital = stocks.reduce((total, stock) => {
    return total + (stock.currentPrice * stock.shares);
  }, 0);

  // Debug logging to track calculation
  useEffect(() => {
    console.log('📊 [STEP2A] Total capital recalculated:', totalCapital);
    console.log('📊 [STEP2A] Current stocks:', stocks);
  }, [totalCapital, stocks]);

  const addStock = () => {
    setStocks([...stocks, { ticker: '', shares: 0, entryPrice: 0, currentPrice: 0, notes: '' }]);
  };

  const removeStock = (index: number) => {
    if (stocks.length > 1) {
      setStocks(stocks.filter((_, i) => i !== index));
    }
  };

  const updateStock = (index: number, field: keyof Stock, value: string | number) => {
    const updatedStocks = [...stocks];
    updatedStocks[index] = { ...updatedStocks[index], [field]: value };
    setStocks(updatedStocks);
    
    // Force re-render to update total calculation
    console.log('📊 [STEP2A] Stock updated, new total:', updatedStocks.reduce((total, stock) => {
      return total + (stock.currentPrice * stock.shares);
    }, 0));
  };

  // Auto-fetch current price when ticker is entered
  const fetchCurrentPrice = async (ticker: string, index: number) => {
    if (ticker && ticker.length >= 2) {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/test-stock/${ticker.toUpperCase()}`);
        if (response.data.status === 'OK' && response.data.data) {
          const currentPrice = response.data.data.current;
          updateStock(index, 'currentPrice', currentPrice);
        }
      } catch (error) {
        console.error('Error fetching current price:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔍 [STEP2A] Starting portfolio import...');
      
      // Filter out empty stocks
      const validStocks = stocks.filter(stock => 
        stock.ticker && stock.shares > 0 && stock.entryPrice > 0 && stock.currentPrice > 0
      );

      console.log('🔍 [STEP2A] Valid stocks:', validStocks);

      if (validStocks.length === 0) {
        alert('Please add at least one valid stock');
        setLoading(false);
        return;
      }

      if (totalCapital <= 0) {
        alert('Please add stocks with valid prices to calculate total portfolio value');
        setLoading(false);
        return;
      }

      const payload = {
        stocks: validStocks,
        totalCapital: totalCapital, // Now auto-calculated
        riskTolerance: Number(riskTolerance),
      };

      console.log('🔍 [STEP2A] Sending payload:', payload);

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/import-portfolio`, payload, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });

      console.log('✅ [STEP2A] Portfolio import response:', response.data);
      
      // Show success message
      alert('Portfolio imported successfully! Redirecting to dashboard...');
      
      // Use onComplete callback to trigger redirect
      onComplete({ success: true, data: response.data });
    } catch (error) {
      console.error('❌ [STEP2A] Error importing portfolio:', error);
      
      if (error.response) {
        console.error('❌ [STEP2A] Error response:', error.response.data);
        alert(`Error: ${error.response.data.message || 'Failed to import portfolio'}`);
      } else {
        alert('Error importing portfolio. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-400 hover:text-white mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <h2 className="text-2xl font-bold text-white">Import Your Portfolio</h2>
      </div>

      <p className="text-gray-400 mb-6">
        Enter your current stock holdings. We'll automatically calculate stop losses and take profits based on your risk tolerance.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Portfolio Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Total Portfolio Value ($) - AUTO CALCULATED
            </label>
            <div className="input-field bg-slate-700 text-green-400 font-semibold cursor-not-allowed border-green-500">
              ${totalCapital.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              ✅ Automatically calculated from your stock holdings (shares × current price)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Risk Tolerance (%)
            </label>
            <input
              type="number"
              value={riskTolerance}
              onChange={(e) => setRiskTolerance(e.target.value)}
              className="input-field"
              placeholder="e.g., 7"
              min="1"
              max="20"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              This determines stop loss and take profit levels
            </p>
          </div>
        </div>

        {/* Stocks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Your Stocks</h3>
            <button
              type="button"
              onClick={addStock}
              className="btn-secondary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Stock
            </button>
          </div>

          <div className="space-y-4">
            {stocks.map((stock, index) => (
              <div key={index} className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-white">Stock #{index + 1}</h4>
                  {stocks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStock(index)}
                      className="text-danger-400 hover:text-danger-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Ticker
                    </label>
                    <input
                      type="text"
                      value={stock.ticker}
                      onChange={(e) => updateStock(index, 'ticker', e.target.value.toUpperCase())}
                      onBlur={() => fetchCurrentPrice(stock.ticker, index)}
                      className="input-field"
                      placeholder="e.g., AAPL"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Shares
                    </label>
                    <input
                      type="number"
                      value={stock.shares}
                      onChange={(e) => updateStock(index, 'shares', Number(e.target.value))}
                      className="input-field"
                      placeholder="100"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Entry Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={stock.entryPrice}
                      onChange={(e) => updateStock(index, 'entryPrice', Number(e.target.value))}
                      className="input-field"
                      placeholder="150.00"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Current Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={stock.currentPrice}
                      onChange={(e) => updateStock(index, 'currentPrice', Number(e.target.value))}
                      className="input-field"
                      placeholder="155.00"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={stock.notes}
                    onChange={(e) => updateStock(index, 'notes', e.target.value)}
                    className="input-field"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary"
            disabled={loading}
          >
            Back
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center"
            disabled={loading}
          >
            {loading ? 'Importing...' : 'Import Portfolio'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </form>
    </div>
  );
}
