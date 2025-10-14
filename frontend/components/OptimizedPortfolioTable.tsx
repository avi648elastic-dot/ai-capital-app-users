/**
 * 🚀 OPTIMIZED PORTFOLIO TABLE
 * Implements React.memo, useMemo, useCallback, and virtual scrolling for maximum performance
 */

'use client';

import React, { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, MoreVertical, DollarSign, Target, AlertTriangle } from 'lucide-react';

interface PortfolioItem {
  _id: string;
  ticker: string;
  shares: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  notes?: string;
  portfolioType: 'solid' | 'risky';
  decision?: 'BUY' | 'SELL' | 'HOLD';
  score?: number;
  pnlPercent?: number;
  totalPnL?: number;
}

interface OptimizedPortfolioTableProps {
  portfolio: PortfolioItem[];
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
}

// Memoized row component to prevent unnecessary re-renders
const PortfolioRow = memo(({ 
  item, 
  onEdit, 
  onDelete 
}: { 
  item: PortfolioItem; 
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (id: string) => void;
}) => {
  const handleEdit = useCallback(() => {
    onEdit?.(item);
  }, [item, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete?.(item._id);
  }, [item._id, onDelete]);

  // Memoize expensive calculations
  const calculations = useMemo(() => {
    const totalValue = item.shares * item.currentPrice;
    const totalPnL = totalValue - (item.shares * item.entryPrice);
    const pnlPercent = ((item.currentPrice - item.entryPrice) / item.entryPrice) * 100;
    
    return {
      totalValue,
      totalPnL,
      pnlPercent
    };
  }, [item.shares, item.currentPrice, item.entryPrice]);

  // Memoize decision styling
  const decisionStyle = useMemo(() => {
    switch (item.decision) {
      case 'BUY':
        return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      case 'SELL':
        return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'HOLD':
        return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  }, [item.decision]);

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Ticker */}
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-900 dark:text-white">
            {item.ticker}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${
            item.portfolioType === 'solid' 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
          }`}>
            {item.portfolioType}
          </span>
        </div>
      </td>

      {/* Shares */}
      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
        {item.shares.toLocaleString()}
      </td>

      {/* Entry Price */}
      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
        ${item.entryPrice.toFixed(2)}
      </td>

      {/* Current Price */}
      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
        ${item.currentPrice.toFixed(2)}
      </td>

      {/* Total Value */}
      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
        ${calculations.totalValue.toLocaleString()}
      </td>

      {/* P&L */}
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className={`font-semibold ${
            calculations.totalPnL >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            ${calculations.totalPnL >= 0 ? '+' : ''}{calculations.totalPnL.toFixed(2)}
          </span>
          <span className={`text-sm ${
            calculations.pnlPercent >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {calculations.pnlPercent >= 0 ? '+' : ''}{calculations.pnlPercent.toFixed(2)}%
          </span>
        </div>
      </td>

      {/* Decision */}
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${decisionStyle}`}>
            {item.decision || 'N/A'}
          </span>
          {item.score && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({item.score.toFixed(1)})
            </span>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleEdit}
            className="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Edit"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

PortfolioRow.displayName = 'PortfolioRow';

// Virtual scrolling hook for large datasets
const useVirtualScroll = (items: any[], itemHeight: number = 60, containerHeight: number = 400) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(visibleStart + Math.ceil(containerHeight / itemHeight), items.length);
  
  const visibleItems = useMemo(() => 
    items.slice(visibleStart, visibleEnd).map((item, index) => ({
      ...item,
      index: visibleStart + index
    })), [items, visibleStart, visibleEnd]
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  };
};

const OptimizedPortfolioTable: React.FC<OptimizedPortfolioTableProps> = memo(({ 
  portfolio, 
  onEdit, 
  onDelete, 
  loading = false 
}) => {
  // Memoize sorted portfolio to prevent unnecessary re-sorting
  const sortedPortfolio = useMemo(() => {
    return [...portfolio].sort((a, b) => {
      // Sort by P&L percentage (highest first)
      const aPnL = ((a.currentPrice - a.entryPrice) / a.entryPrice) * 100;
      const bPnL = ((b.currentPrice - b.entryPrice) / b.entryPrice) * 100;
      return bPnL - aPnL;
    });
  }, [portfolio]);

  // Memoize totals calculation
  const totals = useMemo(() => {
    return sortedPortfolio.reduce((acc, item) => {
      const totalValue = item.shares * item.currentPrice;
      const totalPnL = totalValue - (item.shares * item.entryPrice);
      const pnlPercent = ((item.currentPrice - item.entryPrice) / item.entryPrice) * 100;
      
      return {
        initial: acc.initial + (item.shares * item.entryPrice),
        current: acc.current + totalValue,
        totalPnL: acc.totalPnL + totalPnL,
        totalPnLPercent: acc.totalPnLPercent + pnlPercent
      };
    }, { initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 });
  }, [sortedPortfolio]);

  // Use virtual scrolling for large portfolios (>50 items)
  const useVirtual = portfolio.length > 50;
  const { containerRef, visibleItems, totalHeight, offsetY, handleScroll } = useVirtualScroll(
    sortedPortfolio, 
    60, 
    400
  );

  // Memoize callbacks to prevent child re-renders
  const handleEdit = useCallback((item: PortfolioItem) => {
    onEdit?.(item);
  }, [onEdit]);

  const handleDelete = useCallback((id: string) => {
    onDelete?.(id);
  }, [onDelete]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (portfolio.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No stocks in portfolio
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Add your first stock to get started with AI-powered portfolio management.
        </p>
      </div>
    );
  }

  const TableContent = () => (
    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
      {useVirtual ? (
        <tr>
          <td colSpan={7} className="h-0 p-0">
            <div 
              ref={containerRef}
              className="overflow-auto"
              style={{ height: '400px' }}
              onScroll={handleScroll}
            >
              <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                  {visibleItems.map((item) => (
                    <PortfolioRow
                      key={item._id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : (
        sortedPortfolio.map((item) => (
          <PortfolioRow
            key={item._id}
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))
      )}
    </tbody>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Portfolio Summary */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${totals.current.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Initial Investment</p>
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              ${totals.initial.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total P&L</p>
            <p className={`text-xl font-semibold ${
              totals.totalPnL >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              ${totals.totalPnL >= 0 ? '+' : ''}{totals.totalPnL.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">P&L %</p>
            <p className={`text-xl font-semibold ${
              totals.totalPnLPercent >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {totals.totalPnLPercent >= 0 ? '+' : ''}{totals.totalPnLPercent.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Portfolio Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Shares
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Entry Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Current Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Total Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                P&L
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Decision
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <TableContent />
        </table>
      </div>
    </div>
  );
});

OptimizedPortfolioTable.displayName = 'OptimizedPortfolioTable';

export default OptimizedPortfolioTable;
