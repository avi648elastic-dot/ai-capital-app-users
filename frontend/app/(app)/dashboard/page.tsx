'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { LazyPortfolioTable, LazyPortfolioSummary, LazyMarketOverview, LazyMultiPortfolioDashboard } from '@/components/LazyComponents';
import ErrorBoundary from '@/components/ErrorBoundary';
import StockForm from '@/components/StockForm';
import Charts from '@/components/Charts';
import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import MobileNavigationEnhanced from '@/components/MobileNavigationEnhanced';
import PortfolioCardSwipeable from '@/components/PortfolioCardSwipeable';
import DashboardWidgets from '@/components/DashboardWidgets';
import AccessibilityEnhancements from '@/components/AccessibilityEnhancements';
import InteractiveTutorial, { useTutorial } from '@/components/InteractiveTutorial';
import { getSubscriptionLimits, canCreatePortfolio, canAddStock, getUpgradeMessage } from '@/utils/subscriptionLimits';
import MultiPortfolioDashboard from '@/components/MultiPortfolioDashboard';
import CreatePortfolioModal from '@/components/CreatePortfolioModal';
import DeletePortfolioModal from '@/components/DeletePortfolioModal';
import { CardSkeleton, TableSkeleton, ChartSkeleton } from '@/components/ui/SkeletonLoader';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { realtimePriceService, PriceUpdate } from '@/lib/realtimePriceService';
import Tooltip from '@/components/Tooltip';
import NotificationBanner from '@/components/NotificationBanner';
import MobileFloatingActionButton from '@/components/MobileFloatingActionButton';
import { usePortfolio, useUserProfile } from '@/hooks/useSWRData';

interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: 'free' | 'premium' | 'premium+';
  isAdmin?: boolean;
  portfolioType?: 'solid' | 'risky' | 'imported';
  avatar?: string;
  canUseTrainingStocks?: boolean;
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
  portfolioType: 'solid' | 'risky' | 'imported';
  isTraining?: boolean; // Training flag
}

interface PortfolioTotals {
  initial: number;
  current: number;
  totalPnL: number;
  totalPnLPercent: number;
}

export default function Dashboard() {
  const { t } = useLanguage();
  const { user, loading: userLoading, error: userError } = useUserProfile();
  const { portfolio, loading: portfolioLoading, error: portfolioError, refresh: refreshPortfolio } = usePortfolio();
  const [totals, setTotals] = useState<PortfolioTotals>({
    initial: 0,
    current: 0,
    totalPnL: 0,
    totalPnLPercent: 0,
  });
  const loading = userLoading || portfolioLoading;
  
  // Tutorial management
  const { isOpen: isTutorialOpen, startTutorial, closeTutorial, completeTutorial } = useTutorial('dashboard-intro');
  const [showStockForm, setShowStockForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'solid' | 'risky'>('solid');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [showMultiPortfolio, setShowMultiPortfolio] = useState(false);
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [showDeletePortfolio, setShowDeletePortfolio] = useState(false);
  const [selectedMultiPortfolio, setSelectedMultiPortfolio] = useState<any>(null);
  const [portfolioMeta, setPortfolioMeta] = useState({ total: 0, solid: 0, risky: 0 });
  const [userReputation, setUserReputation] = useState<any>(null);
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

    // EMERGENCY FIX: If user is already on dashboard and has been here before, 
    // skip onboarding check and go straight to portfolio fetch
    const hasVisitedDashboard = sessionStorage.getItem('dashboard-visited');
    if (hasVisitedDashboard) {
      console.log('🔍 [DASHBOARD] User has visited dashboard before - skipping onboarding check');
      sessionStorage.setItem('dashboard-visited', 'true');
      fetchPortfolio();
      fetchUserReputation(); // ✅ FIX: Fetch reputation on dashboard load
      return;
    }

    sessionStorage.setItem('dashboard-visited', 'true');
    checkOnboardingStatus();
  }, [router]);

  const checkOnboardingStatus = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        console.error('❌ [DASHBOARD] No token found for onboarding check');
        router.push('/');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com';
      console.log('🔍 [DASHBOARD] Checking onboarding status with API URL:', apiUrl);
      
      const response = await axios.get(`${apiUrl}/api/onboarding/status`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      });
      
      console.log('🔍 [DASHBOARD] Onboarding status response:', response.data);
      
      // CRITICAL: Don't redirect to onboarding if API fails - just proceed to fetch portfolio
      // Only redirect if explicitly told user has no portfolios AND onboarding not completed
      if (response.data && !response.data.onboardingCompleted && (!response.data.portfolio || response.data.portfolio.length === 0)) {
        console.log('🔍 [DASHBOARD] No portfolios found and onboarding not completed, redirecting to onboarding');
        router.push('/onboarding');
        return;
      }
      
      // If user has portfolios but onboarding not completed, mark it as completed
      if (response.data && !response.data.onboardingCompleted && response.data.portfolio && response.data.portfolio.length > 0) {
        console.log('🔍 [DASHBOARD] User has portfolios but onboarding not marked complete, updating status');
        // Update user onboarding status
        try {
          await axios.post(`${apiUrl}/api/onboarding/complete`, {}, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          });
        } catch (updateError) {
          console.warn('Failed to update onboarding status:', updateError);
          // Don't redirect - just continue
        }
      }

      // Set initial active tab based on portfolio type from onboarding status
      if (response.data && response.data.portfolioType) {
        console.log('🔍 [DASHBOARD] Setting initial active tab to:', response.data.portfolioType);
        setActiveTab(response.data.portfolioType as 'solid' | 'risky');
      }
    } catch (error: any) {
      console.error('❌ [DASHBOARD] Error checking onboarding status:', error);
      
      // CRITICAL FIX: Don't redirect to onboarding on API errors
      // Just proceed to fetch portfolio data directly
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        console.log('🔍 [DASHBOARD] Onboarding check failed due to network - proceeding to fetch portfolio');
        fetchPortfolio();
      return;
    }
    
      // Only redirect on auth errors
      if (error.response?.status === 401) {
        console.error('❌ [DASHBOARD] Unauthorized - redirecting to login');
        Cookies.remove('token');
        router.push('/');
        return;
      }
      
      // For other errors, just proceed to fetch portfolio
      console.log('🔍 [DASHBOARD] Onboarding check failed - proceeding to fetch portfolio anyway');
    fetchPortfolio();
      return;
    }
    
    // Only reach here if onboarding is completed successfully
    console.log('🔍 [DASHBOARD] Onboarding check passed - fetching user data and portfolio');
    fetchPortfolio();
    fetchUserReputation();
  };

  // User data is now handled by SWR hooks

  const fetchUserReputation = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com';
      const response = await axios.get(`${apiUrl}/api/leaderboard/my-reputation`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` },
        timeout: 10000
      });
      
      console.log('🏆 [DASHBOARD] User reputation fetched:', response.data.reputation);
      setUserReputation(response.data.reputation);
    } catch (error: any) {
      console.error('❌ [DASHBOARD] Error fetching user reputation:', error);
      // Set default reputation if fetch fails
      setUserReputation({
        reputation: 0,
        totalPositionsClosed: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        bestTrade: 0,
        worstTrade: 0
      });
    }
  };

  // Ensure the active tab always matches the user's portfolio type for free users
  // Only runs when user data first loads
  useEffect(() => {
    if (user && user.subscriptionTier === 'free' && user.portfolioType) {
      const pt = user.portfolioType as 'solid' | 'risky';
      if (activeTab !== pt) {
        setActiveTab(pt);
      }
    }
  }, [user]); // Only depend on user, not activeTab to avoid infinite loops

  // ✅ FIX: Fetch reputation when user data loads
  useEffect(() => {
    if (user && !userReputation) {
      fetchUserReputation();
    }
  }, [user]);

  // Clear selectedPortfolioId when switching to single view
  useEffect(() => {
    if (!showMultiPortfolio) {
      setSelectedPortfolioId('');
    }
  }, [showMultiPortfolio]);

  // 🚀 PERFORMANCE OPTIMIZED: Portfolio fetching with caching and shorter timeout
  const fetchPortfolio = async (useCache = true) => {
    try {
      // Loading state is managed by SWR
      const token = Cookies.get('token');
      if (!token) {
        router.push('/');
        return;
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com';
      
      const response = await axios.get(`${apiUrl}/api/portfolio`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': useCache ? 'max-age=15' : 'no-cache'
        },
        timeout: 60000
      });
      
      if (response.data && response.data.portfolio) {
        // Portfolio state is managed by SWR, just refresh it
        refreshPortfolio();
        setTotals(response.data.totals || { initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 });
      } else {
        // Portfolio state is managed by SWR
        setTotals({ initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 });
      }
    } catch (error: any) {
      // Handle different types of errors - ONLY clear data on auth errors
      if (error.response?.status === 401) {
        // Portfolio state is managed by SWR
        setTotals({ initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 });
        Cookies.remove('token');
        router.push('/');
        return;
      } else if (error.response?.status === 403) {
        alert('Subscription required to access portfolio features');
        // Portfolio state is managed by SWR
        setTotals({ initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 });
        return;
      } else if (error.code === 'ECONNABORTED') {
        alert('Loading is taking longer than expected. Please check your internet connection and try again.');
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        // DON'T clear portfolio on network error - keep showing existing data
        alert('Cannot connect to server. Backend is deploying (5-10 min). Your portfolio data is safe, just can\'t refresh right now.');
        return; // Exit early - don't clear portfolio
      } else {
        const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
        alert(`Failed to load portfolio: ${errorMsg}. Your data is safe, just can't refresh.`);
        return; // Exit early - don't clear portfolio
      }
    } finally {
      // Loading state is managed by SWR
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
        timeout: 60000 // 30 second timeout for analytics
      });
      
      console.log('✅ [DASHBOARD] Analytics data fetched:', response.data);
      
      if (response.data) {
        setPortfolioPerformance(response.data.portfolioPerformance || []);
        setSectorPerformance(response.data.sectorPerformance || []);
      }
    } catch (error: any) {
      console.error('❌ [DASHBOARD] Error fetching analytics:', error);
      // Don't show error to user, just use portfolio data as fallback
      // Analytics state remains local
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

  // ⚡ REAL-TIME PRICE UPDATES - MAJOR'S REQUIREMENT
  useEffect(() => {
    if (portfolio.length === 0) return;

    const tickers: string[] = Array.from(new Set(portfolio.map((item: any) => item.ticker as string)));
    console.log(`📊 [DASHBOARD] Starting real-time updates for ${tickers.length} stocks`);

    // Subscribe to price updates via WebSocket
    realtimePriceService.subscribe(tickers);

    // Set up price update handler
    const handlePriceUpdate = (update: PriceUpdate) => {
      console.log(`📈 [DASHBOARD] Price update for ${update.ticker}: $${update.price}`);
      // Trigger SWR refresh to get latest data
      refreshPortfolio();
    };

    realtimePriceService.onPriceUpdate(handlePriceUpdate);

    return () => {
      console.log('📊 [DASHBOARD] Unsubscribing from real-time price updates');
      realtimePriceService.unsubscribe(tickers);
    };
  }, [portfolio.length]);

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
    } catch (error: any) {
      console.error('Error updating stock:', error);
    }
  };

  const handleDeleteStock = async (id: string) => {
    try {
      console.log('🏆 [DASHBOARD] Deleting stock with reputation tracking:', id);
      
      // Find the stock to get current price for reputation calculation
      const stockToDelete = portfolio.find((item: any) => item._id === id);
      const exitPrice = stockToDelete?.currentPrice || 0;
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com';
      const response = await axios.delete(`${apiUrl}/api/portfolio/${id}`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` },
        data: { exitPrice }, // Send exit price for reputation calculation
        timeout: 15000
      });
      
      console.log('🏆 [DASHBOARD] Stock deleted, reputation response:', response.data);
      
      // Show reputation update to user
      if (response.data.realizedPnL !== undefined) {
        const pnl = response.data.realizedPnL;
        const pnlText = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
        const emoji = pnl >= 0 ? '🎉' : '📉';
        alert(`${emoji} Position closed! Realized P&L: ${pnlText}`);
      }
      
      // Refresh portfolio and reputation
      fetchPortfolio();
      fetchUserReputation();
      
    } catch (error: any) {
      console.error('❌ [DASHBOARD] Error deleting stock:', error);
      alert('Failed to delete stock. Please try again.');
    }
  };

  const handleToggleTraining = async (id: string, isTraining: boolean) => {
    if (!user?.canUseTrainingStocks) {
      alert('You do not have permission to use training stocks. Contact admin.');
      return;
    }
    
    try {
      console.log('🎯 [DASHBOARD] Toggling training flag:', id, 'to:', isTraining);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com';
      const response = await axios.patch(`${apiUrl}/api/portfolio/toggle-training/${id}`, {
        isTraining
      }, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` },
        timeout: 10000
      });
      
      console.log('🎯 [DASHBOARD] Training flag updated:', response.data);
      
      // Refresh portfolio to show updated training status
      refreshPortfolio();
      
    } catch (error: any) {
      console.error('❌ [DASHBOARD] Error toggling training flag:', error);
      alert('Failed to update training status. Please try again.');
    }
  };

  const handleUpgrade = async () => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/upgrade`, {}, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      
      if (response.data.isPremium) {
        alert('🎉 Successfully upgraded to Premium! You now have access to all features.');
        // User data will be refreshed by SWR automatically
        window.location.reload();
      }
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('❌ [DEBUG] Error checking status:', error);
      setDebugInfo({ error: error?.message || 'Unknown error' });
    }
  };

  // Filter portfolio based on selected portfolio or tab/type
  const filteredPortfolio = portfolio.filter((item: any) => {
    console.log('🔍 [EMERGENCY DEBUG] Portfolio item:', item);
    console.log('🔍 [EMERGENCY DEBUG] showMultiPortfolio:', showMultiPortfolio);
    console.log('🔍 [EMERGENCY DEBUG] selectedPortfolioId:', selectedPortfolioId);
    console.log('🔍 [EMERGENCY DEBUG] activeTab:', activeTab);
    
    // If we're in multi-portfolio view and have a selected portfolio, filter by portfolio ID
    if (showMultiPortfolio && selectedPortfolioId) {
      const matches = (item as any)?.portfolioId === selectedPortfolioId;
      console.log('🔍 [EMERGENCY DEBUG] Multi-portfolio filter result:', matches);
      return matches;
    }
    
    // For single portfolio view, filter by portfolio type and clear selectedPortfolioId
    if (!showMultiPortfolio) {
      const itemType = (item as any)?.portfolioType || 'solid';
      const matches = activeTab === 'solid' ? itemType === 'solid' : itemType === 'risky';
      console.log('🔍 [EMERGENCY DEBUG] Single portfolio filter - itemType:', itemType, 'activeTab:', activeTab, 'matches:', matches);
      return matches;
    }
    
    // Default fallback
    console.log('🔍 [EMERGENCY DEBUG] Default fallback - returning true');
    return true;
  });
  
  console.log('🔍 [EMERGENCY DEBUG] Total portfolio items:', portfolio.length);
  console.log('🔍 [EMERGENCY DEBUG] Filtered portfolio items:', filteredPortfolio.length);
  console.log('🔍 [EMERGENCY DEBUG] Final filtered portfolio:', filteredPortfolio);

  if (loading) {
    return (
      <div className="w-full space-y-6">
        {/* Mobile Header Skeleton */}
        <div className="lg:hidden bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-700 rounded-full animate-pulse"></div>
              <div className="space-y-2">
                <div className="w-24 h-4 bg-slate-700 rounded animate-pulse"></div>
                <div className="w-16 h-3 bg-slate-700 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="w-8 h-8 bg-slate-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Market Overview Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>

        {/* Portfolio Summary Skeleton */}
        <CardSkeleton />

        {/* Charts Skeleton */}
        <ChartSkeleton />

        {/* Portfolio Table Skeleton */}
        <TableSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile Header - Only shows on mobile */}
      <MobileHeader 
        title={`${t('dashboard.welcomeBack')} ${user?.name || 'User'}`}
        subtitle={t('dashboard.portfolioOverview')}
        unreadCount={0}
        onNotificationClick={() => {
          // Handle notification click
        }}
      />
      
      {/* Professional Header */}
      <Header userName={user?.name || 'User'} isAdmin={user?.isAdmin || false} userAvatar={user?.avatar} userReputation={userReputation} />
      
      {/* CRITICAL FIX: Notification Banner - Below Header, Above Content */}
      <NotificationBanner isMobile={false} />
      
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Free App Mode - All Features Unlocked */}
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg border bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-400 animate-pulse"></div>
              <h3 className="text-xs sm:text-sm font-bold text-green-300">
                🆓 Free - Full Access
              </h3>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium bg-green-600/20 text-green-300">
                  ∞ Portfolios
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium bg-green-600/20 text-green-300">
                  ∞ Stocks
                </span>
              </div>
            </div>
          </div>
        </div>

        {process.env.NODE_ENV !== 'production' && debugInfo && (
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
            <LazyMarketOverview />
          </ErrorBoundary>
        </div>

        {/* Portfolio Summary */}
        <ErrorBoundary label="summary">
          <div data-tutorial="portfolio-summary">
            <LazyPortfolioSummary totals={totals} />
          </div>
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
                   
                   // Free App Mode - Add to portfolio logic
                   if (showMultiPortfolio) {
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
                 {t('common.addStock')}
               </button>
            {/* Free App Mode - Multi-Portfolio Toggle (Available to All) */}
            {(
                <button
                  onClick={() => {
                    try {
                      console.log('🔍 [DASHBOARD] Toggling multi-portfolio view:', !showMultiPortfolio);
                      setShowMultiPortfolio(!showMultiPortfolio);
                    } catch (error: any) {
                      console.error('❌ [DASHBOARD] Error toggling multi-portfolio view:', error);
                    }
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-4 px-6 rounded-lg transition-all duration-200 border border-slate-600 hover:border-slate-500 flex items-center justify-center space-x-3 text-lg"
                >
                  <span className="text-2xl">{showMultiPortfolio ? '📊' : '📈'}</span>
                  <span>{showMultiPortfolio ? t('dashboard.singleView') : t('dashboard.multiPortfolio')}</span>
                </button>
            )}
            {/* Portfolio Management Buttons (Free App Mode - Available to All) */}
            {showMultiPortfolio && (
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
                  <span>{t('common.addPortfolio')}</span>
                </button>
                <button
                  onClick={() => setShowDeletePortfolio(true)}
                  className="btn-secondary flex items-center space-x-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <span>🗑️</span>
                  <span>{t('common.deletePortfolio')}</span>
                </button>
              </div>
            )}
        {/* Stock/Portfolio Counters - Free App Mode */}
            {user && (
          <div className="px-4 py-4 rounded-lg text-base font-semibold flex flex-col space-y-3 bg-green-900/30 text-green-300 border border-green-500/30">
            <div className="flex items-center space-x-3">
              <span className="opacity-70 text-lg">Stocks:</span>
              <span className="font-bold text-xl">
                      {showMultiPortfolio && selectedMultiPortfolio 
                      ? `${selectedMultiPortfolio.stocks.length}/∞`
                      : `${filteredPortfolio.length}/∞`
                    }
                  </span>
                  {showMultiPortfolio && selectedMultiPortfolio && (
                    <span className="text-sm opacity-70 ml-2">
                      ({selectedMultiPortfolio.portfolioName})
                    </span>
                  )}
            </div>
            {/* Free App Mode - Show all portfolio info */}
            <div className="text-base opacity-80">
              {t('common.portfolios')}: {portfolioMeta.total}/∞ ({portfolioMeta.solid} {t('common.solid')} · {portfolioMeta.risky} {t('common.risky')})
            </div>
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Display - Free App Mode - All users have access */}
        {showMultiPortfolio ? (
          <>
            <LazyMultiPortfolioDashboard
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
                } catch (error: any) {
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
                      <LazyPortfolioTable
                        portfolio={selectedMultiPortfolio.stocks || []}
                        onUpdate={handleUpdateStock}
                        onDelete={handleDeleteStock}
                        canUseTrainingStocks={user?.canUseTrainingStocks || false}
                        onToggleTraining={handleToggleTraining}
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
                onClick={() => setActiveTab('solid')}
                className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                  activeTab === 'solid'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span>Solid Portfolio</span>
                <span className="px-2 py-1 bg-slate-700 text-xs rounded-full">
                  {portfolio.filter((p: any) => p.portfolioType === 'solid').length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('risky')}
                className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                  activeTab === 'risky'
                    ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                <span>Risky Portfolio</span>
                <span className="px-2 py-1 bg-slate-700 text-xs rounded-full">
                  {portfolio.filter((p: any) => p.portfolioType === 'risky').length}
                </span>
              </button>
            </div>
          </>
        )}

        {/* Portfolio Table and Charts - Free App Mode - Show in single view */}
        {!showMultiPortfolio && (
          <>
            {/* Portfolio Table */}
            <ErrorBoundary label="table">
              <LazyPortfolioTable
                portfolio={filteredPortfolio}
                onUpdate={handleUpdateStock}
                onDelete={handleDeleteStock}
                canUseTrainingStocks={user?.canUseTrainingStocks || false}
                onToggleTraining={handleToggleTraining}
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

      {/* Stock Form Modal - Mobile Responsive Fix */}
      {showStockForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          {/* Dimmed backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowStockForm(false)} />
          {/* Modal container - Fixed for mobile */}
          <div className="relative w-full h-full sm:h-auto sm:max-w-lg sm:mx-4 sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-850 to-slate-900 shadow-2xl">
            <div className="p-4 sm:p-6 min-h-full sm:min-h-0">
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
        </div>
      )}

      {/* Create Portfolio Modal - Mobile Responsive Fix */}
      {showCreatePortfolio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreatePortfolio(false)} />
          <div className="relative w-full h-full sm:h-auto sm:max-w-lg sm:mx-4 sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-2xl bg-slate-900 shadow-2xl">
            <div className="p-4 sm:p-6 min-h-full sm:min-h-0">
              <CreatePortfolioModal 
                onClose={() => setShowCreatePortfolio(false)}
                onSuccess={() => {
                  setShowCreatePortfolio(false);
                  fetchPortfolio(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Portfolio Modal - Mobile Responsive Fix */}
      {showDeletePortfolio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeletePortfolio(false)} />
          <div className="relative w-full h-full sm:h-auto sm:max-w-lg sm:mx-4 sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-2xl bg-slate-900 shadow-2xl">
            <div className="p-4 sm:p-6 min-h-full sm:min-h-0">
              <DeletePortfolioModal 
                onClose={() => setShowDeletePortfolio(false)}
                onSuccess={() => {
                  setShowDeletePortfolio(false);
                  fetchPortfolio(false);
                }}
              />
            </div>
          </div>
        </div>
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

      {/* Mobile Floating Action Button - Only show on mobile */}
      <div className="block md:hidden">
        <MobileFloatingActionButton
          userTier={user?.subscriptionTier || 'free'}
          onSuccess={() => {
            // Refresh dashboard data when new portfolio/stock is added
            // User data is handled by SWR
          }}
        />
      </div>

      {/* Enhanced Mobile Navigation */}
      <MobileNavigationEnhanced
        userName={user?.name}
        subscriptionTier={user?.subscriptionTier}
        onLogout={() => {
          Cookies.remove('token');
          router.push('/');
        }}
        unreadCount={0}
        onNotificationClick={() => {
          // Handle notification click
        }}
      />

      {/* Accessibility Enhancements */}
      <AccessibilityEnhancements />

      {/* Interactive Tutorial */}
      <InteractiveTutorial
        isOpen={isTutorialOpen}
        onClose={closeTutorial}
        onComplete={completeTutorial}
        tutorialId="dashboard-intro"
      />
    </div>
  );
}
