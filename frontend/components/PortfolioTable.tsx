'use client';

import { useState } from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';

interface PortfolioItem {
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
}

interface PortfolioTableProps {
  portfolio: PortfolioItem[];
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
}

export default function PortfolioTable({ portfolio, onUpdate, onDelete }: PortfolioTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PortfolioItem>>({});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const calculatePnL = (item: PortfolioItem) => {
    const cost = item.entryPrice * item.shares;
    const value = item.currentPrice * item.shares;
    const pnl = value - cost;
    const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;
    return { pnl, pnlPercent };
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingId(item._id);
    setEditData({
      entryPrice: item.entryPrice,
      stopLoss: item.stopLoss,
      takeProfit: item.takeProfit,
      notes: item.notes,
    });
  };

  const handleSave = () => {
    if (editingId) {
      onUpdate(editingId, editData);
      setEditingId(null);
      setEditData({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY':
        return 'action-buy';
      case 'SELL':
        return 'action-sell';
      case 'HOLD':
        return 'action-hold';
      default:
        return 'text-slate-400 bg-slate-700';
    }
  };

  if (portfolio.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-300 mb-2">No stocks in this portfolio</h3>
        <p className="text-gray-400">Add some stocks to get started with AI-powered portfolio management.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-16">Exchange</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-16">Ticker</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-16">Shares</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-20">Entry</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-20">Current</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-20">Cost</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-20">Value</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-24">P&L</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-20">Stop Loss</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-20">Take Profit</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-20">Action</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-20">Date</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {portfolio.map((item) => {
              const { pnl, pnlPercent } = calculatePnL(item);
              const cost = item.entryPrice * item.shares;
              const value = item.currentPrice * item.shares;

              return (
                <tr key={item._id} className="table-row">
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    <div className="text-xs text-slate-400">{item.exchange || '—'}</div>
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    <div className="text-xs font-medium text-white">{item.ticker}</div>
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-300">{item.shares.toLocaleString()}</div>
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    {editingId === item._id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editData.entryPrice ?? item.entryPrice}
                        onChange={(e) => setEditData({ ...editData, entryPrice: Number(e.target.value) })}
                        className="input-field w-16 text-xs"
                      />
                    ) : (
                      <div className="text-xs text-gray-300">{formatCurrency(item.entryPrice)}</div>
                    )}
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-300">{formatCurrency(item.currentPrice)}</div>
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-300">{formatCurrency(cost)}</div>
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-300">{formatCurrency(value)}</div>
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    <div className={`text-xs font-medium ${pnl >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                      {formatCurrency(pnl)} ({formatPercent(pnlPercent)})
                    </div>
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    {editingId === item._id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editData.stopLoss || ''}
                        onChange={(e) => setEditData({ ...editData, stopLoss: Number(e.target.value) })}
                        className="input-field w-16 text-xs"
                      />
                    ) : (
                      <div className="text-xs text-gray-300">
                        {item.stopLoss ? formatCurrency(item.stopLoss) : '-'}
                      </div>
                    )}
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    {editingId === item._id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editData.takeProfit || ''}
                        onChange={(e) => setEditData({ ...editData, takeProfit: Number(e.target.value) })}
                        className="input-field w-16 text-xs"
                      />
                    ) : (
                      <div className="text-xs text-gray-300">
                        {item.takeProfit ? formatCurrency(item.takeProfit) : '-'}
                      </div>
                    )}
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    <div className="flex justify-center">
                      <div className="relative group">
                        <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${getActionColor(item.action)} cursor-help`}>
                          {item.action}
                        </span>
                        {item.reason && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 border border-slate-700">
                            {item.reason}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-300">
                      {new Date(item.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    <div className="flex space-x-1">
                      {editingId === item._id ? (
                        <>
                          <button
                            onClick={handleSave}
                            className="text-success-400 hover:text-success-300 text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-gray-300 text-xs"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-primary-400 hover:text-primary-300"
                            title="Edit"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDelete(item._id)}
                            className="text-danger-400 hover:text-danger-300"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
