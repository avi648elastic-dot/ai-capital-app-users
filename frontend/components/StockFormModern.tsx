'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  TrendingUp, 
  Target, 
  DollarSign, 
  Calculator,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  Zap,
  Shield,
  Rocket
} from 'lucide-react';

interface StockFormModernProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
  user?: any;
}

const StockFormModern: React.FC<StockFormModernProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  user
}) => {
  const [formData, setFormData] = useState({
    ticker: '',
    shares: '',
    entryPrice: '',
    currentPrice: '',
    stopLoss: '',
    takeProfit: '',
    notes: '',
    portfolioType: 'solid'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [autoCalculated, setAutoCalculated] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.ticker.trim()) newErrors.ticker = 'Ticker symbol is required';
    if (!formData.shares || Number(formData.shares) <= 0) newErrors.shares = 'Valid number of shares required';
    if (!formData.entryPrice || Number(formData.entryPrice) <= 0) newErrors.entryPrice = 'Valid entry price required';
    if (!formData.currentPrice || Number(formData.currentPrice) <= 0) newErrors.currentPrice = 'Valid current price required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const autoCalculateSLTP = () => {
    const entryPrice = Number(formData.entryPrice);
    if (entryPrice > 0) {
      const stopLoss = (entryPrice * 0.92).toFixed(2); // 8% below
      const takeProfit = (entryPrice * 1.15).toFixed(2); // 15% above
      
      setFormData(prev => ({
        ...prev,
        stopLoss,
        takeProfit
      }));
      
      setAutoCalculated(true);
      setTimeout(() => setAutoCalculated(false), 2000);
    }
  };

  const getPortfolioTypeInfo = (type: string) => {
    const types = {
      solid: { name: 'Solid Portfolio', icon: Shield, color: 'from-green-500 to-emerald-500', desc: 'Conservative, stable investments' },
      risky: { name: 'Risky Portfolio', icon: Rocket, color: 'from-red-500 to-pink-500', desc: 'High-risk, high-reward plays' }
    };
    return types[type as keyof typeof types] || types.solid;
  };

  const portfolioInfo = getPortfolioTypeInfo(formData.portfolioType);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Add New Stock</h2>
                  <p className="text-purple-200">Enter details below. Real-time price is fetched automatically.</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Ticker Symbol */}
              <div className="space-y-2">
                <label className="text-white font-semibold flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Ticker Symbol *</span>
                </label>
                <input
                  type="text"
                  value={formData.ticker}
                  onChange={(e) => handleInputChange('ticker', e.target.value.toUpperCase())}
                  placeholder="e.g., AAPL, TSLA, MSFT"
                  className={`w-full p-4 rounded-2xl bg-white/10 border-2 transition-all duration-300 ${
                    errors.ticker 
                      ? 'border-red-400 focus:border-red-400' 
                      : 'border-white/20 focus:border-purple-400'
                  } text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-400/20`}
                />
                {errors.ticker && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm flex items-center space-x-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.ticker}</span>
                  </motion.p>
                )}
              </div>

              {/* Shares and Prices Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-white font-semibold flex items-center space-x-2">
                    <Calculator className="w-5 h-5" />
                    <span>Number of Shares *</span>
                  </label>
                  <input
                    type="number"
                    value={formData.shares}
                    onChange={(e) => handleInputChange('shares', e.target.value)}
                    placeholder="100"
                    className={`w-full p-4 rounded-2xl bg-white/10 border-2 transition-all duration-300 ${
                      errors.shares 
                        ? 'border-red-400 focus:border-red-400' 
                        : 'border-white/20 focus:border-purple-400'
                    } text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-400/20`}
                  />
                  {errors.shares && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm flex items-center space-x-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.shares}</span>
                    </motion.p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-white font-semibold flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span>Entry Price *</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.entryPrice}
                    onChange={(e) => handleInputChange('entryPrice', e.target.value)}
                    placeholder="150.00"
                    className={`w-full p-4 rounded-2xl bg-white/10 border-2 transition-all duration-300 ${
                      errors.entryPrice 
                        ? 'border-red-400 focus:border-red-400' 
                        : 'border-white/20 focus:border-purple-400'
                    } text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-400/20`}
                  />
                  {errors.entryPrice && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm flex items-center space-x-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.entryPrice}</span>
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Current Price */}
              <div className="space-y-2">
                <label className="text-white font-semibold flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Current Price * / Real-time</span>
                  <div className="flex items-center space-x-1 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Live</span>
                  </div>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.currentPrice}
                  onChange={(e) => handleInputChange('currentPrice', e.target.value)}
                  placeholder="155.00"
                  className={`w-full p-4 rounded-2xl bg-white/10 border-2 transition-all duration-300 ${
                    errors.currentPrice 
                      ? 'border-red-400 focus:border-red-400' 
                      : 'border-white/20 focus:border-purple-400'
                  } text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-400/20`}
                />
                {errors.currentPrice && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm flex items-center space-x-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.currentPrice}</span>
                  </motion.p>
                )}
              </div>

              {/* Portfolio Type */}
              <div className="space-y-4">
                <label className="text-white font-semibold">Adding to:</label>
                <div className="grid grid-cols-2 gap-4">
                  {['solid', 'risky'].map((type) => {
                    const info = getPortfolioTypeInfo(type);
                    const Icon = info.icon;
                    const isSelected = formData.portfolioType === type;
                    
                    return (
                      <motion.button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, portfolioType: type }))}
                        className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                          isSelected 
                            ? 'border-purple-400 bg-purple-500/20' 
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${info.color}`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-white font-semibold">{info.name}</p>
                            <p className="text-gray-300 text-sm">{info.desc}</p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Stop Loss and Take Profit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-white font-semibold">Stop Loss (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stopLoss}
                    onChange={(e) => handleInputChange('stopLoss', e.target.value)}
                    placeholder="138.00"
                    className="w-full p-4 rounded-2xl bg-white/10 border-2 border-white/20 focus:border-purple-400 text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-400/20 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white font-semibold">Take Profit (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.takeProfit}
                    onChange={(e) => handleInputChange('takeProfit', e.target.value)}
                    placeholder="172.50"
                    className="w-full p-4 rounded-2xl bg-white/10 border-2 border-white/20 focus:border-purple-400 text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-400/20 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Auto-calculate Button */}
              <motion.button
                type="button"
                onClick={autoCalculateSLTP}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-300 flex items-center justify-center space-x-3"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Zap className="w-5 h-5 text-blue-400" />
                <span className="text-blue-200 font-semibold">Auto-calc SL (8% below) & TP (15% above)</span>
              </motion.button>

              {autoCalculated && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-green-500/20 border border-green-400/30 rounded-2xl flex items-center space-x-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-200">Stop Loss and Take Profit calculated automatically!</span>
                </motion.div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-white font-semibold">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any additional notes about this position..."
                  rows={3}
                  className="w-full p-4 rounded-2xl bg-white/10 border-2 border-white/20 focus:border-purple-400 text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-400/20 transition-all duration-300 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6">
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 px-6 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Add Stock</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StockFormModern;




