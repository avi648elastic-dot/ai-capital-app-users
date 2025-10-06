'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import PortfolioTable from '@/components/PortfolioTable';
import PortfolioSummary from '@/components/PortfolioSummary';
import StockForm from '@/components/StockForm';
import Charts from '@/components/Charts';

interface User {
  id: string;
  email: string;
  name: string;
  subscriptionActive: boolean;
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
}

interface PortfolioTotals {
  initial: number;
  current: number;
  totalPnL: number;
  totalPnLPercent: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [totals, setTotals] = useState<PortfolioTotals>({
    initial: 0,
    current: 0,
    totalPnL: 0,
    totalPnLPercent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showStockForm, setShowStockForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'solid' | 'dangerous'>('solid');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/');
      return;
    }

    checkOnboardingStatus();
  }, [router]);

  const checkOnboardingStatus = async () => {
    try {
      const response = await axios.get(`${https://ai-capital-app7.onrender.com}/api/onboarding/status`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      
      if (!response.data.onboardingCompleted) {
        router.push('/onboarding');
        return;
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      router.push('/onboarding');
      return;
    }
    
    // Only reach here if onboarding is completed
    fetchUserData();
    fetchPortfolio();
  };

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${https://ai-capital-app7.onrender.com}/api/auth/me`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user data:', error);
      Cookies.remove('token');
      router.push('/');
    }
  };

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${https://ai-capital-app7.onrender.com}/api/portfolio`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      setPortfolio(response.data.portfolio);
      setTotals(response.data.totals);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (stockData: any) => {
    try {
      await axios.post(`${https://ai-capital-app7.onrender.com}/api/portfolio/add`, stockData, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      setShowStockForm(false);
      fetchPortfolio();
    } catch (error) {
      console.error('Error adding stock:', error);
    }
  };

  const handleUpdateStock = async (id: string, stockData: any) => {
    try {
      await axios.put(`${https://ai-capital-app7.onrender.com}/api/portfolio/${id}`, stockData, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      fetchPortfolio();
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const handleDeleteStock = async (id: string) => {
    try {
      await axios.delete(`${https://ai-capital-app7.onrender.com}/api/portfolio/${id}`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      fetchPortfolio();
    } catch (error) {
      console.error('Error deleting stock:', error);
    }
  };

  const handleUpdateDecisions = async () => {
    try {
      const response = await axios.get(`${https://ai-capital-app7.onrender.com}/api/portfolio/decisions`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      setPortfolio(response.data.portfolio);
    } catch (error) {
      console.error('Error updating decisions:', error);
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/');
  };

  const checkDebugInfo = async () => {
    try {
      const response = await axios.get(`${https://ai-capital-app7.onrender.com}/api/onboarding/status`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      setDebugInfo(response.data);
      console.log('🔍 [DEBUG] Onboarding status:', response.data);
    } catch (error) {
      console.error('❌ [DEBUG] Error checking status:', error);
      setDebugInfo({ error: error.message });
    }
  };

  const filteredPortfolio = portfolio.filter(item => {
    if (activeTab === 'solid') {
      return item.action === 'BUY' || item.action === 'HOLD';
    } else {
      return item.action === 'SELL';
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">AiCapital</h1>
              <span className="ml-2 px-2 py-1 bg-primary-600 text-xs rounded-full">
                {user?.subscriptionActive ? 'PRO' : 'FREE'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Welcome, {user?.name}</span>
              {user?.email === 'admin@aicapital.com' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="text-danger-400 hover:text-danger-300 transition-colors"
                >
                  Admin
                </button>
              )}
              <button
                onClick={checkDebugInfo}
                className="text-blue-400 hover:text-blue-300 transition-colors ml-4"
              >
                Debug Status
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {debugInfo && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Debug Info:</h3>
            <pre className="text-sm text-gray-300 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
        {/* Portfolio Summary */}
        <PortfolioSummary totals={totals} />

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setShowStockForm(true)}
              className="btn-primary"
            >
              Add Stock
            </button>
            <button
              onClick={handleUpdateDecisions}
              className="btn-secondary"
            >
              Update Decisions
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('solid')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'solid'
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Solid Portfolio ({portfolio.filter(p => p.action === 'BUY' || p.action === 'HOLD').length})
          </button>
          <button
            onClick={() => setActiveTab('dangerous')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'dangerous'
                ? 'bg-danger-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Dangerous Portfolio ({portfolio.filter(p => p.action === 'SELL').length})
          </button>
        </div>

        {/* Portfolio Table */}
        <PortfolioTable
          portfolio={filteredPortfolio}
          onUpdate={handleUpdateStock}
          onDelete={handleDeleteStock}
        />

        {/* Charts */}
        <div className="mt-8">
          <Charts portfolio={portfolio} />
        </div>
      </div>

      {/* Stock Form Modal */}
      {showStockForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <StockForm
              onSubmit={handleAddStock}
              onCancel={() => setShowStockForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
