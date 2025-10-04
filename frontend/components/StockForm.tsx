'use client';

import { useState } from 'react';

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
  });

  const [loading, setLoading] = useState(false);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
