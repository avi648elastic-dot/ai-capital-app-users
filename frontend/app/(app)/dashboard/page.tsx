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
import MarketOverview from '@/components/MarketOverview';
import MobileHeader from '@/components/MobileHeader';
import { getSubscriptionLimits, canCreatePortfolio, canAddStock, getUpgradeMessage } from '@/utils/subscriptionLimits';
import MultiPortfolioDashboard from '@/components/MultiPortfolioDashboard';
import CreatePortfolioModal from '@/components/CreatePortfolioModal';
import DeletePortfolioModal from '@/components/DeletePortfolioModal';

interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: 'free' | 'premium' | 'premium+';
  isAdmin?: boolean;
  portfolioType?: 'solid' | 'risky';
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
  portfolioType: 'solid' | 'risky';
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
  const [activeTab, setActiveTab] = useState<'solid' | 'risky'>('solid');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [showMultiPortfolio, setShowMultiPortfolio] = useState(false);
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [showDeletePortfolio, setShowDeletePortfolio] = useState(false);
  const [selectedMultiPortfolio, setSelectedMultiPortfolio] = useState<any>(null);
  const [portfolioMeta, setPortfolioMeta] = useState({ total: 0, solid: 0, risky: 0 });
  const [portfolioPerformance, setPortfolioPerformance] = useState<any[]>([]);
  const [sectorPerformance, setSectorPerformance] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const router = useRouter();

  // Get subscription limits
  const subscriptionLimits = getSubscriptionLimits(user?.subscriptionTier || 'free');

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
      
      console.log('🔍 [DASHBOARD] Onboarding status:', response.data);
      
      // Only redirect to onboarding if user has no portfolios AND onboarding not completed
      if (!response.data.onboardingCompleted && (!response.data.portfolio || response.data.portfolio.length === 0)) {
        console.log('🔍 [DASHBOARD] No portfolios found and onboarding not completed, redirecting to onboarding');
        router.push('/onboarding');
        return;
      }
      
      // If user has portfolios but onboarding not completed, mark it as completed
      if (!response.data.onboardingCompleted && response.data.portfolio && response.data.portfolio.length > 0) {
        console.log('🔍 [DASHBOARD] User has portfolios but onboarding not marked complete, updating status');
        // Update user onboarding status
        try {
          await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/complete`, {}, {
            headers: { Authorization: `Bearer ${Cookies.get('token')}` }
          });
        } catch (updateError) {
          console.warn('Failed to update onboarding status:', updateError);
        }
      }

      // Set initial active tab based on portfolio type from onboarding status
      if (response.data.portfolioType) {
        console.log('🔍 [DASHBOARD] Setting initial active tab to:', response.data.portfolioType);
        setActiveTab(response.data.portfolioType as 'solid' | 'risky');
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
      console.log('🔍 [DASHBOARD] User data fetched:', response.data.user);
      
      // Auto-select tab based on the user's portfolioType (free users)
      const pt = response.data.user?.portfolioType as 'solid' | 'risky' | undefined;
      const tier = response.data.user?.subscriptionTier as 'free' | 'premium' | undefined;
      console.log('🔍 [DASHBOARD] Portfolio type:', pt, 'Tier:', tier);
      
      if (pt && tier === 'free') {
        console.log('🔍 [DASHBOARD] Setting active tab to:', pt);
        setActiveTab(pt);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Cookies.remove('token');
      router.push('/');
    }
  };

  // Ensure the active tab always matches the user's portfolio type for free users
  // Only runs when user data first loads
  useEffect(() => {
    if (user && user.subscriptionTier === 'free' && user.portfolioType) {
      const pt = user.portfolioType as 'solid' | 'risky';
      console.log('🔍 [DASHBOARD] useEffect - User portfolio type:', pt, 'Current active tab:', activeTab);
      if (activeTab !== pt) {
        console.log('🔍 [DASHBOARD] Syncing active tab to user portfolio type:', pt);
        setActiveTab(pt);
      }
    }
  }, [user]); // Only depend on user, not activeTab to avoid infinite loops

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

  // Fetch real-time analytics data for charts
  const fetchAnalyticsData = async () => {
    if (portfolio.length === 0) return;
    
    try {
      setAnalyticsLoading(true);
      console.log('🔍 [DASHBOARD] Fetching analytics data...');
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` },
        timeout: 30000 // 30 second timeout for analytics
      });
      
      console.log('✅ [DASHBOARD] Analytics data fetched:', response.data);
      
      if (response.data) {
        setPortfolioPerformance(response.data.portfolioPerformance || []);
        setSectorPerformance(response.data.sectorPerformance || []);
      }
    } catch (error: any) {
      console.error('❌ [DASHBOARD] Error fetching analytics:', error);
      // Don't show error to user, just use portfolio data as fallback
      setPortfolioPerformance([]);
      setSectorPerformance([]);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Fetch analytics when portfolio changes
  useEffect(() => {
    if (portfolio.length > 0) {
      fetchAnalyticsData();
    }
  }, [portfolio]);

  const handleAddStock = async (stockData: any) => {
    try {
      console.log('🔍 [DASHBOARD] Adding stock:', stockData);
      
      // Validate required fields
      if (!stockData.ticker || !stockData.shares || !stockData.entryPrice || !stockData.currentPrice) {
        throw new Error('All required fields must be filled');
      }

      // Ensure numeric values and handle portfolio ID
      const validatedData = {
        ...stockData,
        shares: Number(stockData.shares),
        entryPrice: Number(stockData.entryPrice),
        currentPrice: Number(stockData.currentPrice),
        stopLoss: stockData.stopLoss ? Number(stockData.stopLoss) : undefined,
        takeProfit: stockData.takeProfit ? Number(stockData.takeProfit) : undefined,
        portfolioId: selectedPortfolioId || stockData.portfolioId || `${stockData.portfolioType}-1`,
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
      setSelectedPortfolioId(''); // Reset selected portfolio
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

  // Filter portfolio based on selected portfolio or tab/type
  const filteredPortfolio = portfolio.filter(item => {
    if (selectedPortfolioId) {
      return (item as any)?.portfolioId === selectedPortfolioId;
    }
    const type = (item as any)?.portfolioType || 'solid';
    return activeTab === 'solid' ? type === 'solid' : type === 'risky';
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
    <div className="w-full">
      {/* Mobile Header - Only shows on mobile */}
      <MobileHeader 
        title="AiCapital Dashboard"
        subtitle="Portfolio Management"
      />
      
      {/* Professional Header */}
      <Header userName={user?.name || 'User'} isAdmin={user?.isAdmin || false} userAvatar={user?.avatarUrl} />
      
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Enhanced Subscription Status Banner - AGGRESSIVE Mobile Optimization */}
        <div className={`mb-6 sm:mb-6 p-6 sm:p-6 rounded-xl border-2 ${
          user?.subscriptionTier === 'premium' 
            ? 'bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
            : 'bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-500/50 shadow-lg shadow-amber-500/10'
        }`}>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <div className={`w-6 h-6 rounded-full ${
                user?.subscriptionTier === 'premium' ? 'bg-emerald-400' : 'bg-amber-400'
              } animate-pulse`}></div>
              <div>
                <div className="flex flex-col space-y-2">
                  <h3 className={`text-2xl font-bold ${
                    user?.subscriptionTier === 'premium' ? 'text-emerald-300' : 'text-amber-300'
                  }`}>
                    {user?.subscriptionTier === 'premium' ? '✨ Premium Account' : '🔒 Free Account'}
                  </h3>
                  {user?.subscriptionTier === 'premium' && (
                    <span className="px-3 py-2 bg-emerald-600 text-white text-base rounded-full font-semibold w-fit">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-base text-slate-300 mb-3 leading-relaxed mt-2">
                  {user?.subscriptionTier === 'premium' 
                    ? 'Full access: Up to 3 portfolios of each type (Solid & Risky) with 15 stocks each. Plus real-time push notifications and advanced portfolio analytics with detailed market insights.' 
                    : 'Limited to 1 portfolio with 10 stocks. Upgrade to unlock 6 portfolios with 15 stocks each!'
                  }
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className={`px-3 py-2 rounded-full ${
                    user?.subscriptionTier === 'premium' 
                      ? 'bg-emerald-600/20 text-emerald-300' 
                      : 'bg-amber-600/20 text-amber-300'
                  }`}>
                    {user?.subscriptionTier === 'premium' ? '6 Portfolios (3 Solid + 3 Risky)' : '1 Portfolio Only'}
                  </span>
                  <span className={`px-2 py-1 rounded-full ${
                    user?.subscriptionTier === 'premium' 
                      ? 'bg-blue-600/20 text-blue-300' 
                      : 'bg-amber-600/20 text-amber-300'
                  }`}>
                    {user?.subscriptionTier === 'premium' ? '20 Stocks Per Portfolio' : '10 Stocks Per Portfolio'}
                  </span>
                  <span className={`px-2 py-1 rounded-full ${
                    user?.subscriptionTier === 'premium' 
                      ? 'bg-purple-600/20 text-purple-300' 
                      : 'bg-slate-600/20 text-slate-400'
                  }`}>
                    {user?.subscriptionTier === 'premium' ? 'Both Portfolio Types' : '1 Portfolio Type Only'}
                  </span>
                </div>
              </div>
            </div>
            {user?.subscriptionTier === 'free' && (
              <div className="flex flex-col items-end space-y-2">
                <button 
                  className="btn-primary flex items-center space-x-2 px-6 py-3 text-sm font-bold opacity-60 cursor-not-allowed"
                  title="Upgrade requires payment checkout (disabled here)"
                  disabled
                >
                  <span>🚀</span>
                  <span>Upgrade to Premium</span>
                </button>
                <p className="text-xs text-slate-400">Payments not configured in this environment</p>
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
        {/* Markets Overview placed below subscription banner, above summary */}
        <div className="mb-6">
          <ErrorBoundary label="markets">
            <MarketOverview />
          </ErrorBoundary>
        </div>

        {/* Portfolio Summary */}
        <ErrorBoundary label="summary">
          <PortfolioSummary totals={totals} />
        </ErrorBoundary>

      {/* Action Buttons with Stock/Portfolio Counters - AGGRESSIVE Mobile Optimization */}
        <div className="flex flex-col mb-6 space-y-4">
             <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
               <button
                 onClick={() => {
                   // Check subscription limits
                   if (!canAddStock(portfolio.length, user?.subscriptionTier || 'free')) {
                     alert(getUpgradeMessage(user?.subscriptionTier || 'free', 'more stocks'));
                     return;
                   }
                   
                   if (user?.subscriptionTier === 'premium' && showMultiPortfolio) {
                     // In multi-view, add to selected portfolio
                     if (selectedMultiPortfolio) {
                       setSelectedPortfolioId(selectedMultiPortfolio.portfolioId);
                       setShowStockForm(true);
                     } else {
                       alert('Please select a portfolio first');
                     }
                   } else {
                     // In single view, add to current portfolio
                     setShowStockForm(true);
                   }
                 }}
                 className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
               >
                 Add Stock
               </button>
            {/* Premium Multi-Portfolio Toggle */}
            {user?.subscriptionTier === 'premium' && (
                <button
                  onClick={() => {
                    try {
                      console.log('🔍 [DASHBOARD] Toggling multi-portfolio view:', !showMultiPortfolio);
                      setShowMultiPortfolio(!showMultiPortfolio);
                    } catch (error) {
                      console.error('❌ [DASHBOARD] Error toggling multi-portfolio view:', error);
                    }
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-4 px-6 rounded-lg transition-all duration-200 border border-slate-600 hover:border-slate-500 flex items-center justify-center space-x-3 text-lg"
                >
                  <span className="text-2xl">{showMultiPortfolio ? '📊' : '📈'}</span>
                  <span>{showMultiPortfolio ? 'Single View' : 'Multi-Portfolio'}</span>
                </button>
            )}
            {/* Portfolio Management Buttons for Premium Users (visible only in multi view) */}
            {user?.subscriptionTier === 'premium' && showMultiPortfolio && (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    // Check subscription limits
                    if (!canCreatePortfolio(portfolioMeta.total, user?.subscriptionTier || 'free')) {
                      alert(getUpgradeMessage(user?.subscriptionTier || 'free', 'more portfolios'));
                      return;
                    }
                    console.log('🔍 [DASHBOARD] Add Portfolio button clicked');
                    setShowCreatePortfolio(true);
                  }}
                  className="btn-primary flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Add Portfolio</span>
                </button>
                <button
                  onClick={() => setShowDeletePortfolio(true)}
                  className="btn-secondary flex items-center space-x-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <span>🗑️</span>
                  <span>Delete Portfolio</span>
                </button>
              </div>
            )}
        {/* Stock/Portfolio Counters - AGGRESSIVE Mobile Optimization */}
            {user && (
          <div className={`px-4 py-4 rounded-lg text-base font-semibold flex flex-col space-y-3 ${
                user.subscriptionTier === 'free' 
              ? 'bg-amber-900/30 text-amber-300 border border-amber-500/30'
              : 'bg-emerald-900/30 text-emerald-300 border border-emerald-500/30'
              }`}>
            <div className="flex items-center space-x-3">
              <span className="opacity-70 text-lg">Stocks:</span>
              <span className="font-bold text-xl">
                    {showMultiPortfolio && selectedMultiPortfolio 
                      ? `${selectedMultiPortfolio.stocks.length}/${user.subscriptionTier === 'free' ? '10' : '15'}`
                      : `${filteredPortfolio.length}/${user.subscriptionTier === 'free' ? '10' : '15'}`
                    }
                  </span>
                  {showMultiPortfolio && selectedMultiPortfolio && (
                    <span className="text-sm opacity-70 ml-2">
                      ({selectedMultiPortfolio.portfolioName})
                    </span>
                  )}
            </div>
            {user.subscriptionTier === 'premium' && (
              <div className="text-base opacity-80">
                Portfolios: {portfolioMeta.total}/6 ({portfolioMeta.solid} solid · {portfolioMeta.risky} risky)
              </div>
            )}
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Display - Multi-Portfolio for Premium, Single for Free */}
        {user?.subscriptionTier === 'premium' && showMultiPortfolio ? (
          <>
            <MultiPortfolioDashboard
              user={user}
              onAddStock={(portfolioId) => {
                setSelectedPortfolioId(portfolioId);
                setShowStockForm(true);
              }}
              onViewPortfolio={(portfolioId) => {
                setSelectedPortfolioId(portfolioId);
                // You can implement a detailed portfolio view here
              }}
              onPortfolioSelect={(portfolio) => {
                try {
                  console.log('🔍 [DASHBOARD] Portfolio selected:', portfolio);
                  setSelectedMultiPortfolio(portfolio);
                } catch (error) {
                  console.error('❌ [DASHBOARD] Error handling portfolio selection:', error);
                }
              }}
              onMetaUpdate={(meta) => setPortfolioMeta(meta)}
            />
            
            {/* Show portfolio details - always visible in multi-view */}
            <div className="mt-8">
              {selectedMultiPortfolio ? (
                <>
                  {/* Portfolio Table for Selected Portfolio */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">
                      {selectedMultiPortfolio.portfolioName} - Stock Details
                    </h3>
                    <ErrorBoundary label="table">
                      <PortfolioTable
                        portfolio={selectedMultiPortfolio.stocks || []}
                        onUpdate={handleUpdateStock}
                        onDelete={handleDeleteStock}
                      />
                    </ErrorBoundary>
                  </div>

                  {/* Charts for Selected Portfolio */}
                  <div className="bg-slate-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      {selectedMultiPortfolio.portfolioName} - Performance Analysis
                    </h3>
                    <ErrorBoundary label="charts">
                      <Charts portfolio={selectedMultiPortfolio.stocks || []} />
                    </ErrorBoundary>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 bg-slate-800 rounded-lg">
                  <h3 className="text-xl font-bold text-white mb-4">Select a Portfolio</h3>
                  <p className="text-slate-400">Click on any portfolio card above to view its details and performance charts</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Enhanced Portfolio Tabs */}
            <div className="flex mb-6 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
              <button
                onClick={() => {
                  // Prevent switching tabs for free users
                  if (user?.subscriptionTier === 'free' && user?.portfolioType !== 'solid') {
                    alert('🔒 This portfolio type is locked for free users. Upgrade to Premium to unlock both Solid and Risky portfolios!');
                    return;
                  }
                  setActiveTab('solid');
                }}
                className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                  activeTab === 'solid'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : user?.subscriptionTier === 'free' && user?.portfolioType !== 'solid'
                      ? 'text-slate-500 cursor-not-allowed opacity-50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                disabled={user?.subscriptionTier === 'free' && user?.portfolioType !== 'solid'}
                title={user?.subscriptionTier === 'free' && user?.portfolioType !== 'solid' ? 'This portfolio type is locked for free users' : ''}
              >
                <div className={`w-2 h-2 rounded-full ${
                  user?.subscriptionTier === 'free' && user?.portfolioType !== 'solid' ? 'bg-slate-500' : 'bg-green-400'
                }`}></div>
                <span>Solid Portfolio</span>
                <span className="px-2 py-1 bg-slate-700 text-xs rounded-full">
                  {portfolio.filter(p => p.portfolioType === 'solid').length}
                </span>
                {user?.subscriptionTier === 'free' && user?.portfolioType !== 'solid' && (
                  <span className="text-yellow-400">🔒</span>
                )}
              </button>
              <button
                onClick={() => {
                  // Prevent switching tabs for free users
                  if (user?.subscriptionTier === 'free' && user?.portfolioType !== 'risky') {
                    alert('🔒 This portfolio type is locked for free users. Upgrade to Premium to unlock both Solid and Risky portfolios!');
                    return;
                  }
                  setActiveTab('risky');
                }}
                className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                  activeTab === 'risky'
                    ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg'
                    : user?.subscriptionTier === 'free' && user?.portfolioType !== 'risky'
                      ? 'text-slate-500 cursor-not-allowed opacity-50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                disabled={user?.subscriptionTier === 'free' && user?.portfolioType !== 'risky'}
                title={user?.subscriptionTier === 'free' && user?.portfolioType !== 'risky' ? 'This portfolio type is locked for free users' : ''}
              >
                <div className={`w-2 h-2 rounded-full ${
                  user?.subscriptionTier === 'free' && user?.portfolioType !== 'risky' ? 'bg-slate-500' : 'bg-orange-400'
                }`}></div>
                <span>Risky Portfolio</span>
                <span className="px-2 py-1 bg-slate-700 text-xs rounded-full">
                  {portfolio.filter(p => p.portfolioType === 'risky').length}
                </span>
                {user?.subscriptionTier === 'free' && user?.portfolioType !== 'risky' && (
                  <span className="text-yellow-400">🔒</span>
                )}
                {user?.subscriptionTier === 'premium' && (
                  <span className="text-yellow-400">✨</span>
                )}
              </button>
            </div>
          </>
        )}

        {/* Portfolio Table and Charts - Only show in single view */}
        {!(user?.subscriptionTier === 'premium' && showMultiPortfolio) && (
          <>
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
                  <Charts 
                    portfolio={portfolio} 
                    portfolioPerformance={portfolioPerformance}
                    sectorPerformance={sectorPerformance}
                    analyticsLoading={analyticsLoading}
                  />
              </ErrorBoundary>
            </div>
          </>
        )}
      </div>

      {/* Stock Form Modal */}
      {showStockForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <StockForm
          onSubmit={handleAddStock}
          onCancel={() => setShowStockForm(false)}
          isPremium={user?.subscriptionTier === 'premium'}
          defaultPortfolioType={user?.portfolioType as any || 'solid'}
          activeTab={activeTab}
          selectedPortfolioId={selectedPortfolioId}
        />
          </div>
        </div>
      )}

      {/* Create Portfolio Modal */}
      {showCreatePortfolio && (
        <CreatePortfolioModal 
          onClose={() => setShowCreatePortfolio(false)}
               onSuccess={() => {
                 setShowCreatePortfolio(false);
                 // Refresh portfolios without full page reload
                 fetchPortfolio(Cookies.get('token') || '');
               }}
        />
      )}

      {/* Delete Portfolio Modal */}
      {showDeletePortfolio && (
        <DeletePortfolioModal 
          onClose={() => setShowDeletePortfolio(false)}
               onSuccess={() => {
                 setShowDeletePortfolio(false);
                 // Refresh portfolios without full page reload
                 fetchPortfolio(Cookies.get('token') || '');
               }}
        />
      )}

      {/* Mobile Floating Action Button - Only shows on mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            // Check subscription limits
            if (!canAddStock(portfolio.length, user?.subscriptionTier || 'free')) {
              alert(getUpgradeMessage(user?.subscriptionTier || 'free', 'more stocks'));
              return;
            }
            setShowStockForm(true);
          }}
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full shadow-lg flex items-center justify-center text-white hover:from-blue-500 hover:to-emerald-500 transition-all duration-300 transform hover:scale-110 active:scale-95"
          aria-label="Add new stock"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
