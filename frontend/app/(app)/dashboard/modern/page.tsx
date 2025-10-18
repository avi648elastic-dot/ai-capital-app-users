'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import GamifiedDashboard from '@/components/GamifiedDashboard';
import StockFormModern from '@/components/StockFormModern';
import PortfolioCardModern from '@/components/PortfolioCardModern';
import MobileNavigationModern from '@/components/MobileNavigationModern';
import ModernCard from '@/components/ui/ModernCard';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3, 
  PieChart,
  Activity,
  Trophy,
  Zap,
  Sparkles,
  Plus,
  Eye,
  Edit,
  Trash2,
  X
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: 'free' | 'premium' | 'premium+';
  isAdmin?: boolean;
  portfolioType?: 'solid' | 'risky' | 'imported';
  avatarUrl?: string;
}

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

interface Totals {
  initial: number;
  current: number;
  totalPnL: number;
  totalPnLPercent: number;
}

const ModernDashboard: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [totals, setTotals] = useState<Totals>({ initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 });
  const [loading, setLoading] = useState(true);
  const [showStockForm, setShowStockForm] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [selectedStock, setSelectedStock] = useState<PortfolioItem | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockUser: User = {
      id: '1',
      email: 'avi648elastic@gmail.com',
      name: 'Avi Cohen',
      subscriptionTier: 'premium+',
      isAdmin: true,
      portfolioType: 'solid'
    };

    const mockPortfolio: PortfolioItem[] = [
      {
        _id: '1',
        ticker: 'AAPL',
        shares: 100,
        entryPrice: 150.00,
        currentPrice: 155.50,
        stopLoss: 138.00,
        takeProfit: 172.50,
        date: '2025-01-15',
        notes: 'Strong fundamentals, AI integration',
        action: 'BUY',
        reason: 'Strong buy signal from AI analysis',
        color: 'green',
        exchange: 'NASDAQ'
      },
      {
        _id: '2',
        ticker: 'TSLA',
        shares: 50,
        entryPrice: 200.00,
        currentPrice: 195.25,
        stopLoss: 180.00,
        takeProfit: 230.00,
        date: '2025-01-10',
        notes: 'EV market leader',
        action: 'HOLD',
        reason: 'Volatile but long-term potential',
        color: 'yellow',
        exchange: 'NASDAQ'
      },
      {
        _id: '3',
        ticker: 'MSFT',
        shares: 75,
        entryPrice: 300.00,
        currentPrice: 315.75,
        stopLoss: 270.00,
        takeProfit: 345.00,
        date: '2025-01-08',
        notes: 'Cloud computing growth',
        action: 'BUY',
        reason: 'AI and cloud expansion',
        color: 'green',
        exchange: 'NASDAQ'
      }
    ];

    const mockTotals: Totals = {
      initial: 52500.00,
      current: 54312.50,
      totalPnL: 1812.50,
      totalPnLPercent: 3.45
    };

    setUser(mockUser);
    setPortfolio(mockPortfolio);
    setTotals(mockTotals);
    setLoading(false);
  }, []);

  const handleAddStock = (data: any) => {
    console.log('Adding stock:', data);
    // Here you would typically call your API
    setShowStockForm(false);
  };

  const handleEditStock = (stock: PortfolioItem) => {
    console.log('Editing stock:', stock);
    // Handle edit logic
  };

  const handleDeleteStock = (stockId: string) => {
    console.log('Deleting stock:', stockId);
    // Handle delete logic
  };

  const handleViewStock = (stock: PortfolioItem) => {
    setSelectedStock(stock);
    // Handle view logic
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading your portfolio...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Mobile Navigation */}
      <MobileNavigationModern user={user} notificationCount={5} />

      {/* Main Content */}
      <div className="pb-20">
        {viewMode === 'overview' ? (
          <GamifiedDashboard
            user={user}
            portfolio={portfolio}
            totals={totals}
            onAddStock={() => setShowStockForm(true)}
            onViewPortfolio={() => setViewMode('detailed')}
          />
        ) : (
          <div className="p-4 space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-3xl font-bold text-white">Portfolio Details</h1>
                <p className="text-purple-200">Manage your investments</p>
              </div>
              <div className="flex space-x-3">
                <motion.button
                  onClick={() => setViewMode('overview')}
                  className="px-4 py-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Overview
                </motion.button>
                <motion.button
                  onClick={() => setShowStockForm(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Stock</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Portfolio Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ModernCard
                title="Total Value"
                value={`$${totals.current.toLocaleString()}`}
                trend={totals.totalPnL >= 0 ? 'up' : 'down'}
                icon={TrendingUp}
                variant="gradient"
              />
              <ModernCard
                title="Total P&L"
                value={`$${totals.totalPnL.toFixed(2)}`}
                subtitle={`${totals.totalPnLPercent.toFixed(2)}%`}
                trend={totals.totalPnL >= 0 ? 'up' : 'down'}
                icon={BarChart3}
                variant="glass"
              />
              <ModernCard
                title="Positions"
                value={portfolio.length.toString()}
                icon={Target}
                variant="neon"
              />
            </div>

            {/* Portfolio Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolio.map((stock, index) => (
                <motion.div
                  key={stock._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PortfolioCardModern
                    stock={stock}
                    onEdit={handleEditStock}
                    onDelete={handleDeleteStock}
                    onView={handleViewStock}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stock Form Modal */}
      <StockFormModern
        isOpen={showStockForm}
        onClose={() => setShowStockForm(false)}
        onSubmit={handleAddStock}
        user={user}
      />

      {/* Stock Detail Modal */}
      <AnimatePresence>
        {selectedStock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedStock(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl p-8 w-full max-w-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Stock Details</h2>
                <button
                  onClick={() => setSelectedStock(null)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
              
              <PortfolioCardModern
                stock={selectedStock}
                onEdit={handleEditStock}
                onDelete={handleDeleteStock}
                onView={handleViewStock}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernDashboard;
