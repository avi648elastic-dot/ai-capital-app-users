'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import PortfolioTable from '@/components/PortfolioTable';
import PortfolioSummary from '@/components/PortfolioSummary';
import ErrorBoundary from '@/components/ErrorBoundary';
import StockForm from '@/components/StockForm';
import Charts from '@/components/Charts';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';

interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: 'free' | 'premium';
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
  portfolioType: 'solid' | 'dangerous';
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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/status`, {
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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
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
      console.log('🔍 [DASHBOARD] Fetching portfolio...');
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` },
        timeout: 15000 // 15 second timeout
      });
      
      console.log('✅ [DASHBOARD] Portfolio fetched successfully:', response.data);
      
      if (response.data && response.data.portfolio) {
        setPortfolio(response.data.portfolio);
        setTotals(response.data.totals || { initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 });
      } else {
        console.warn('⚠️ [DASHBOARD] Invalid portfolio data received');
        setPortfolio([]);
        setTotals({ initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 });
      }
    } catch (error: any) {
      console.error('❌ [DASHBOARD] Error fetching portfolio:', error);
      
      // Handle different types of errors
      if (error.response?.status === 401) {
        console.error('❌ [DASHBOARD] Unauthorized - redirecting to login');
        Cookies.remove('token');
        router.push('/');
        return;
      } else if (error.response?.status === 403) {
        console.error('❌ [DASHBOARD] Forbidden - subscription required');
        alert('Subscription required to access portfolio features');
        return;
      } else if (error.code === 'ECONNABORTED') {
        console.error('❌ [DASHBOARD] Request timeout');
        alert('Request timed out. Please check your connection and try again.');
      } else {
        console.error('❌ [DASHBOARD] Unknown error:', error);
        alert('Failed to load portfolio. Please refresh the page and try again.');
      }
      
      // Set empty state on error
      setPortfolio([]);
      setTotals({ initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (stockData: any) => {
    try {
      console.log('🔍 [DASHBOARD] Adding stock:', stockData);
      
      // Validate required fields
      if (!stockData.ticker || !stockData.shares || !stockData.entryPrice || !stockData.currentPrice) {
        throw new Error('All required fields must be filled');
      }

      // Ensure numeric values
      const validatedData = {
        ...stockData,
        shares: Number(stockData.shares),
        entryPrice: Number(stockData.entryPrice),
        currentPrice: Number(stockData.currentPrice),
        stopLoss: stockData.stopLoss ? Number(stockData.stopLoss) : undefined,
        takeProfit: stockData.takeProfit ? Number(stockData.takeProfit) : undefined,
      };

      console.log('🔍 [DASHBOARD] Validated data:', validatedData);

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio/add`, validatedData, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` },
        timeout: 15000 // 15 second timeout
      });

      console.log('✅ [DASHBOARD] Stock added successfully:', response.data);
      
      // Show success message
      alert(`✅ Successfully added ${validatedData.ticker} to your portfolio!`);
      
      setShowStockForm(false);
      await fetchPortfolio(); // Wait for portfolio to refresh
      
    } catch (error: any) {
      console.error('❌ [DASHBOARD] Error adding stock:', error);
      
      let errorMessage = 'Failed to add stock. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      alert(`❌ Error: ${errorMessage}`);
    }
  };

  const handleUpdateStock = async (id: string, stockData: any) => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio/${id}`, stockData, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      fetchPortfolio();
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const handleDeleteStock = async (id: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio/${id}`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      fetchPortfolio();
    } catch (error) {
      console.error('Error deleting stock:', error);
    }
  };

  const handleUpgrade = async () => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/upgrade`, {}, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      
      if (response.data.isPremium) {
        alert('🎉 Successfully upgraded to Premium! You now have access to all features.');
        // Refresh user data
        fetchUserData();
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('Error upgrading subscription. Please try again.');
    }
  };

  const handleUpdateDecisions = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio/decisions`, {
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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/status`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      setDebugInfo(response.data);
      console.log('🔍 [DEBUG] Onboarding status:', response.data);
    } catch (error) {
      console.error('❌ [DEBUG] Error checking status:', error);
      setDebugInfo({ error: error.message });
    }
  };

  // Filter portfolio based on portfolio type (robust against missing field)
  const filteredPortfolio = portfolio.filter(item => {
    const type = (item as any)?.portfolioType || 'solid';
    return activeTab === 'solid' ? type === 'solid' : type === 'dangerous';
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
    <div className="min-h-screen flex">
      {/* Navigation Sidebar */}
      <Navigation 
        userName={user?.name} 
        subscriptionTier={user?.subscriptionTier}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Professional Header */}
        <Header userName={user?.name} />

        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Enhanced Subscription Status Banner */}
        <div className={`mb-6 p-6 rounded-xl border-2 ${
          user?.subscriptionTier === 'premium' 
            ? 'bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
            : 'bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-500/50 shadow-lg shadow-amber-500/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-4 h-4 rounded-full ${
                user?.subscriptionTier === 'premium' ? 'bg-emerald-400' : 'bg-amber-400'
              } animate-pulse`}></div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className={`text-xl font-bold ${
                    user?.subscriptionTier === 'premium' ? 'text-emerald-300' : 'text-amber-300'
                  }`}>
                    {user?.subscriptionTier === 'premium' ? '✨ Premium Account' : '🔒 Free Account'}
                  </h3>
                  {user?.subscriptionTier === 'premium' && (
                    <span className="px-2 py-1 bg-emerald-600 text-white text-xs rounded-full font-semibold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-300 mb-2">
                  {user?.subscriptionTier === 'premium' 
                    ? 'Full access to all features, unlimited portfolios, and advanced analytics' 
                    : 'Limited to 1 portfolio. Upgrade to unlock unlimited portfolios and premium features'
                  }
                </p>
                <div className="flex items-center space-x-4 text-xs">
                  <span className={`px-2 py-1 rounded-full ${
                    user?.subscriptionTier === 'premium' 
                      ? 'bg-emerald-600/20 text-emerald-300' 
                      : 'bg-amber-600/20 text-amber-300'
                  }`}>
                    {user?.subscriptionTier === 'premium' ? 'Unlimited Portfolios' : '1 Portfolio Limit'}
                  </span>
                  <span className={`px-2 py-1 rounded-full ${
                    user?.subscriptionTier === 'premium' 
                      ? 'bg-blue-600/20 text-blue-300' 
                      : 'bg-slate-600/20 text-slate-400'
                  }`}>
                    {user?.subscriptionTier === 'premium' ? 'Advanced Analytics' : 'Basic Analytics'}
                  </span>
                  <span className={`px-2 py-1 rounded-full ${
                    user?.subscriptionTier === 'premium' 
                      ? 'bg-purple-600/20 text-purple-300' 
                      : 'bg-slate-600/20 text-slate-400'
                  }`}>
                    {user?.subscriptionTier === 'premium' ? 'Real-time Alerts' : 'No Alerts'}
                  </span>
                </div>
              </div>
            </div>
            {user?.subscriptionTier === 'free' && (
              <div className="flex flex-col items-end space-y-2">
                <button 
                  onClick={handleUpgrade}
                  className="btn-primary flex items-center space-x-2 px-6 py-3 text-sm font-bold"
                >
                  <span>🚀</span>
                  <span>Upgrade to Premium</span>
                </button>
                <p className="text-xs text-slate-400">Unlock all features</p>
              </div>
            )}
          </div>
        </div>

        {debugInfo && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Debug Info:</h3>
            <pre className="text-sm text-gray-300 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
        {/* Portfolio Summary */}
        <ErrorBoundary label="summary">
          <PortfolioSummary totals={totals} />
        </ErrorBoundary>

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

        {/* Enhanced Portfolio Tabs */}
        <div className="flex mb-6 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
          <button
            onClick={() => setActiveTab('solid')}
            className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
              activeTab === 'solid'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Solid Portfolio</span>
            <span className="px-2 py-1 bg-slate-700 text-xs rounded-full">
              {portfolio.filter(p => p.portfolioType === 'solid').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('dangerous')}
            className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
              activeTab === 'dangerous'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                : user?.subscriptionTier === 'free' 
                  ? 'text-slate-500 cursor-not-allowed opacity-50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
            disabled={user?.subscriptionTier === 'free'}
            title={user?.subscriptionTier === 'free' ? 'Upgrade to Premium to access Dangerous Portfolio' : ''}
          >
            <div className={`w-2 h-2 rounded-full ${
              user?.subscriptionTier === 'free' ? 'bg-slate-500' : 'bg-red-400'
            }`}></div>
            <span>Dangerous Portfolio</span>
            <span className="px-2 py-1 bg-slate-700 text-xs rounded-full">
              {portfolio.filter(p => p.portfolioType === 'dangerous').length}
            </span>
            {user?.subscriptionTier === 'free' && (
              <span className="text-yellow-400">🔒</span>
            )}
            {user?.subscriptionTier === 'premium' && (
              <span className="text-yellow-400">✨</span>
            )}
          </button>
        </div>

        {/* Portfolio Table */}
        <ErrorBoundary label="table">
          <PortfolioTable
            portfolio={filteredPortfolio}
            onUpdate={handleUpdateStock}
            onDelete={handleDeleteStock}
          />
        </ErrorBoundary>

        {/* Charts */}
        <div className="mt-8">
          <ErrorBoundary label="charts">
            <Charts portfolio={portfolio} />
          </ErrorBoundary>
        </div>
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
