'use client';

import { useState } from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';
import Tooltip from './ui/Tooltip';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
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
        <h3 className="text-lg font-medium text-gray-300 mb-2">{t('portfolio.noStocks')}</h3>
        <p className="text-gray-400">{t('portfolio.addStocksPrompt')}</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/50 [data-theme='light']:bg-gray-100">
            <tr className="keep-ltr">
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-16 text-slate-200 [data-theme='light']:text-gray-700">{t('portfolio.exchange')}</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-16 text-slate-200 [data-theme='light']:text-gray-700">{t('portfolio.ticker')}</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-16 text-slate-200 [data-theme='light']:text-gray-700">{t('portfolio.shares')}</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-20 text-slate-200 [data-theme='light']:text-gray-700">{t('portfolio.entry')}</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-20 text-slate-200 [data-theme='light']:text-gray-700">{t('portfolio.current')}</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-20 text-slate-200 [data-theme='light']:text-gray-700">{t('portfolio.cost')}</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-20 text-slate-200 [data-theme='light']:text-gray-700">{t('portfolio.value')}</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-24 text-slate-200 [data-theme='light']:text-gray-700">{t('portfolio.pnl')}</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-20 text-slate-200 [data-theme='light']:text-gray-700">{t('portfolio.stopLoss')}</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-20 text-slate-200 [data-theme='light']:text-gray-700">{t('portfolio.takeProfit')}</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-20 text-slate-200 [data-theme='light']:text-gray-700">{t('portfolio.action')}</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-20 text-slate-200 [data-theme='light']:text-gray-700">{t('portfolio.date')}</th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium uppercase tracking-wider w-16 text-slate-200 [data-theme='light']:text-gray-700">{t('portfolio.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 [data-theme='light']:divide-gray-300">
            {portfolio.map((item) => {
              const { pnl, pnlPercent } = calculatePnL(item);
              const cost = item.entryPrice * item.shares;
              const value = item.currentPrice * item.shares;

              return (
                <tr key={item._id} className="table-row keep-ltr hover:bg-slate-800/30 [data-theme='light']:hover:bg-gray-50">
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    <div className="text-xs text-slate-400 [data-theme='light']:text-gray-600">{item.exchange || '—'}</div>
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    <div className="text-xs font-medium text-white [data-theme='light']:text-gray-900">{item.ticker}</div>
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-300 [data-theme='light']:text-gray-700">{item.shares.toLocaleString()}</div>
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
                      <div className="text-xs text-gray-300 [data-theme='light']:text-gray-700">{formatCurrency(item.entryPrice)}</div>
                    )}
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-300 [data-theme='light']:text-gray-700">{formatCurrency(item.currentPrice)}</div>
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-300 [data-theme='light']:text-gray-700">{formatCurrency(cost)}</div>
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-300 [data-theme='light']:text-gray-700">{formatCurrency(value)}</div>
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
                      <div className="text-xs text-gray-300 [data-theme='light']:text-gray-700">
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
                      <div className="text-xs text-gray-300 [data-theme='light']:text-gray-700">
                        {item.takeProfit ? formatCurrency(item.takeProfit) : '-'}
                      </div>
                    )}
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    <div className="flex justify-center">
                      <Tooltip 
                        content={item.reason || `${item.action} action - No reason available`}
                        position="top"
                        disabled={false}
                      >
                        <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${getActionColor(item.action)} cursor-help`}>
                          {item.action}
                        </span>
                      </Tooltip>
                    </div>
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-300 [data-theme='light']:text-gray-700">
                      {new Date(item.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-1 sm:px-2 py-2 whitespace-nowrap">
                    <div className="flex space-x-1">
                      {editingId === item._id ? (
                        <>
                          <button
                            onClick={handleSave}
                            className="text-success-400 hover:text-success-300 [data-theme='light']:text-success-600 [data-theme='light']:hover:text-success-500 text-xs font-medium"
                          >
                            {t('common.save')}
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-gray-300 [data-theme='light']:text-gray-600 [data-theme='light']:hover:text-gray-500 text-xs font-medium"
                          >
                            {t('common.cancel')}
                          </button>
                        </>
                      ) : (
                        <>
                          <Tooltip content={t('portfolio.editStockDetails')} position="top">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-primary-400 hover:text-primary-300 [data-theme='light']:text-blue-600 [data-theme='light']:hover:text-blue-500"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          </Tooltip>
                          <Tooltip content={t('portfolio.deleteStock')} position="top">
                            <button
                              onClick={() => onDelete(item._id)}
                              className="text-danger-400 hover:text-danger-300 [data-theme='light']:text-red-600 [data-theme='light']:hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Tooltip>
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
