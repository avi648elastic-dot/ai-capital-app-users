'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  Rocket, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  DollarSign,
  Percent,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface PortfolioCardModernProps {
  stock: {
    _id: string;
    ticker: string;
    shares: number;
    entryPrice: number;
    currentPrice: number;
    stopLoss?: number;
    takeProfit?: number;
    date: string;
    notes?: string;
    action: 'BUY' | 'HOLD' | 'SELL';
    reason?: string;
    color?: string;
    exchange?: string;
  };
  onEdit?: (stock: any) => void;
  onDelete?: (stockId: string) => void;
  onView?: (stock: any) => void;
  compact?: boolean;
}

const PortfolioCardModern: React.FC<PortfolioCardModernProps> = ({
  stock,
  onEdit,
  onDelete,
  onView,
  compact = false
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const cost = stock.entryPrice * stock.shares;
  const value = stock.currentPrice * stock.shares;
  const pnl = value - cost;
  const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;
  const isProfit = pnl >= 0;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY': return <TrendingUp className="w-4 h-4" />;
      case 'SELL': return <TrendingDown className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY': return 'text-green-400 bg-green-400/20';
      case 'SELL': return 'text-red-400 bg-red-400/20';
      default: return 'text-yellow-400 bg-yellow-400/20';
    }
  };

  const getRiskLevel = () => {
    if (stock.stopLoss && stock.currentPrice <= stock.stopLoss * 1.05) return 'high';
    if (stock.takeProfit && stock.currentPrice >= stock.takeProfit * 0.95) return 'target';
    return 'normal';
  };

  const riskLevel = getRiskLevel();

  const getRiskIcon = () => {
    switch (riskLevel) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'target': return <CheckCircle className="w-4 h-4 text-green-400" />;
      default: return <Shield className="w-4 h-4 text-blue-400" />;
    }
  };

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'high': return 'border-red-400/50 bg-red-500/10';
      case 'target': return 'border-green-400/50 bg-green-500/10';
      default: return 'border-blue-400/50 bg-blue-500/10';
    }
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-4 rounded-2xl border-2 ${getRiskColor()} bg-white/5 backdrop-blur-lg`}
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              {getActionIcon(stock.action)}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{stock.ticker}</h3>
              <p className="text-gray-300 text-sm">{stock.shares} shares</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              {isProfit ? '+' : ''}${pnl.toFixed(2)}
            </div>
            <div className={`text-sm ${isProfit ? 'text-green-300' : 'text-red-300'}`}>
              {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-6 rounded-3xl border-2 ${getRiskColor()} bg-white/5 backdrop-blur-lg hover:bg-white/10 transition-all duration-300`}
      whileHover={{ scale: 1.02, y: -5 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl">
            <span className="text-white font-bold text-xl">{stock.ticker}</span>
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-white font-bold text-xl">{stock.shares}</span>
              <span className="text-gray-300">shares</span>
            </div>
            <div className="flex items-center space-x-2">
              {getRiskIcon()}
              <span className="text-sm text-gray-300">
                {riskLevel === 'high' ? 'Near Stop Loss' : 
                 riskLevel === 'target' ? 'Near Take Profit' : 'Normal Risk'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full flex items-center space-x-1 ${getActionColor(stock.action)}`}>
            {getActionIcon(stock.action)}
            <span className="text-sm font-semibold">{stock.action}</span>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-slate-800 rounded-2xl border border-white/20 shadow-2xl z-10"
                >
                  <div className="p-2">
                    {onView && (
                      <button
                        onClick={() => { onView(stock); setShowMenu(false); }}
                        className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
                      >
                        <Eye className="w-4 h-4 text-blue-400" />
                        <span className="text-white">View Details</span>
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => { onEdit(stock); setShowMenu(false); }}
                        className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
                      >
                        <Edit className="w-4 h-4 text-yellow-400" />
                        <span className="text-white">Edit Position</span>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => { onDelete(stock._id); setShowMenu(false); }}
                        className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                        <span className="text-red-400">Delete Position</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Price Information */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm">Entry Price</span>
          </div>
          <div className="text-white font-bold text-xl">${stock.entryPrice.toFixed(2)}</div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm">Current Price</span>
          </div>
          <div className="text-white font-bold text-xl">${stock.currentPrice.toFixed(2)}</div>
        </div>
      </div>

      {/* P&L Information */}
      <div className="bg-white/5 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300 text-sm">Total P&L</span>
          <div className={`flex items-center space-x-1 ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-bold text-lg">
              {isProfit ? '+' : ''}${pnl.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-300 text-sm">Percentage</span>
          <span className={`font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Stop Loss & Take Profit */}
      {(stock.stopLoss || stock.takeProfit) && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {stock.stopLoss && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-gray-300 text-sm">Stop Loss</span>
              </div>
              <div className="text-white font-semibold">${stock.stopLoss.toFixed(2)}</div>
            </div>
          )}
          
          {stock.takeProfit && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-gray-300 text-sm">Take Profit</span>
              </div>
              <div className="text-white font-semibold">${stock.takeProfit.toFixed(2)}</div>
            </div>
          )}
        </div>
      )}

      {/* Reason */}
      {stock.reason && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm">AI Analysis</span>
          </div>
          <p className="text-white text-sm bg-white/5 rounded-xl p-3">
            {stock.reason}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4" />
          <span>{new Date(stock.date).toLocaleDateString()}</span>
        </div>
        {stock.exchange && (
          <span className="px-2 py-1 bg-white/10 rounded-lg">
            {stock.exchange}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default PortfolioCardModern;


