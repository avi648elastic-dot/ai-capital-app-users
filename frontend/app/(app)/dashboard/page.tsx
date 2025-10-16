'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { LazyPortfolioTable, LazyPortfolioSummary, LazyMarketOverview, LazyMultiPortfolioDashboard } from '@/components/LazyComponents';
import ErrorBoundary from '@/components/ErrorBoundary';
import StockForm from '@/components/StockForm';
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
  portfolioType: 'solid' | 'risky' | 'imported';
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
    fetchUserData();
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
      
      setUserReputation(response.data.reputation);
    } catch (error: any) {
      // Don't show error to user - reputation is optional
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

  // Clear selectedPortfolioId when switching to single view
  useEffect(() => {
    if (!showMultiPortfolio) {
      setSelectedPortfolioId('');
    }
  }, [showMultiPortfolio]);

  // 🚀 PERFORMANCE OPTIMIZED: Portfolio fetching with caching and shorter timeout
  const fetchPortfolio = async (useCache = true) => {
    try {
      setLoading(true);
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
        timeout: 30000
      });
      
      if (response.data && response.data.portfolio) {
        setPortfolio(response.data.portfolio);
        setTotals(response.data.totals || { initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 });
      } else {
        setPortfolio([]);
        setTotals({ initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 });
      }
    } catch (error: any) {
      // Handle different types of errors - ONLY clear data on auth errors
      if (error.response?.status === 401) {
        setPortfolio([]);
        setTotals({ initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 });
        Cookies.remove('token');
        router.push('/');
        return;
      } else if (error.response?.status === 403) {
        alert('Subscription required to access portfolio features');
        setPortfolio([]);
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

  // ⚡ REAL-TIME PRICE UPDATES - MAJOR'S REQUIREMENT
  useEffect(() => {
    if (portfolio.length === 0) return;

    const tickers = Array.from(new Set(portfolio.map(item => item.ticker)));
    console.log(`📊 [DASHBOARD] Starting real-time updates for ${tickers.length} stocks`);

    realtimePriceService.startUpdates(tickers, (updates: PriceUpdate[]) => {
      console.log(`📈 [DASHBOARD] Received ${updates.length} price updates`);
      
      setPortfolio(prevPortfolio => 
        prevPortfolio.map(item => {
          const update = updates.find(u => u.ticker === item.ticker);
          if (update) {
            console.log(`💹 [DASHBOARD] Updated ${item.ticker}: $${item.currentPrice} → $${update.currentPrice}`);
            return { ...item, currentPrice: update.currentPrice };
          }
          return item;
        })
      );

      // Recalculate totals after price updates
      const newTotals = portfolio.reduce((acc, item) => {
        const update = updates.find(u => u.ticker === item.ticker);
        const currentPrice = update?.currentPrice || item.currentPrice;
        const currentValue = currentPrice * item.shares;
        const initialValue = item.entryPrice * item.shares;
        const pnl = currentValue - initialValue;
        
        return {
          initial: acc.initial + initialValue,
          current: acc.current + currentValue,
          totalPnL: acc.totalPnL + pnl,
          totalPnLPercent: 0 // Will calculate after
        };
      }, { initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 });

      newTotals.totalPnLPercent = newTotals.initial > 0 
        ? (newTotals.totalPnL / newTotals.initial) * 100 
        : 0;

      setTotals(newTotals);
    });

    return () => {
      console.log('📊 [DASHBOARD] Stopping real-time price updates');
      realtimePriceService.stopUpdates();
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
      const stockToDelete = portfolio.find(item => item._id === id);
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
  const filteredPortfolio = portfolio.filter(item => {
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
      />
      
      {/* Professional Header */}
      <Header userName={user?.name || 'User'} isAdmin={user?.isAdmin || false} userAvatar={user?.avatarUrl} userReputation={userReputation} />
      
      {/* CRITICAL FIX: Notification Banner - Below Header, Above Content */}
      <NotificationBanner isMobile={false} />
      
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Compact Account Type Badge - Optimized */}
        <div className={`mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg border ${
          user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'premium+'
            ? user?.subscriptionTier === 'premium+' 
              ? 'bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-purple-500/30'
              : 'bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border-emerald-500/30'
            : 'bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-amber-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                user?.subscriptionTier === 'premium' ? 'bg-emerald-400' : 
                user?.subscriptionTier === 'premium+' ? 'bg-purple-400' : 'bg-amber-400'
              } animate-pulse`}></div>
              <h3 className={`text-xs sm:text-sm font-bold ${
                user?.subscriptionTier === 'premium' ? 'text-emerald-300' : 
                user?.subscriptionTier === 'premium+' ? 'text-purple-300' : 'text-amber-300'
              }`}>
                {user?.subscriptionTier === 'premium' ? '✨ Premium' : 
                 user?.subscriptionTier === 'premium+' ? '👑 Premium+' : '🔒 Free'}
              </h3>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
                  user?.subscriptionTier === 'premium' 
                    ? 'bg-emerald-600/20 text-emerald-300' 
                    : user?.subscriptionTier === 'premium+'
                    ? 'bg-purple-600/20 text-purple-300'
                    : 'bg-amber-600/20 text-amber-300'
                }`}>
                  {user?.subscriptionTier === 'premium' ? '6 Portfolios' : 
                   user?.subscriptionTier === 'premium+' ? '∞ Portfolios' : '1 Portfolio'}
                </span>
                <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
                  user?.subscriptionTier === 'premium' 
                    ? 'bg-blue-600/20 text-blue-300' 
                    : user?.subscriptionTier === 'premium+'
                    ? 'bg-purple-600/20 text-purple-300'
                    : 'bg-amber-600/20 text-amber-300'
                }`}>
                  {user?.subscriptionTier === 'premium' ? '15 Stocks' : 
                   user?.subscriptionTier === 'premium+' ? '20 Stocks' : '10 Stocks'}
                </span>
              </div>
            </div>
            {user?.subscriptionTier === 'free' && (
              <button 
                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-[10px] sm:text-xs font-bold rounded transition-all opacity-60 cursor-not-allowed flex items-center space-x-1"
                title="Upgrade requires payment checkout (disabled here)"
                disabled
              >
                <span>🚀</span>
                <span className="hidden sm:inline">Upgrade</span>
              </button>
            )}
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
                   
                   if ((user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'premium+') && showMultiPortfolio) {
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
            {/* Premium Multi-Portfolio Toggle */}
            {(user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'premium+') && (
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
            {/* Portfolio Management Buttons for Premium Users (visible only in multi view) */}
            {(user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'premium+') && showMultiPortfolio && (
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
                {t('common.portfolios')}: {portfolioMeta.total}/6 ({portfolioMeta.solid} {t('common.solid')} · {portfolioMeta.risky} {t('common.risky')})
              </div>
            )}
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Display - Multi-Portfolio for Premium, Single for Free */}
        {(user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'premium+') && showMultiPortfolio ? (
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
                  // Prevent switching tabs for free users (allow imported portfolios to access solid)
                  if (user?.subscriptionTier === 'free' && user?.portfolioType !== 'solid' && user?.portfolioType !== 'imported') {
                    alert('🔒 This portfolio type is locked for free users. Upgrade to Premium to unlock both Solid and Risky portfolios!');
                    return;
                  }
                  setActiveTab('solid');
                }}
                className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                  activeTab === 'solid'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : user?.subscriptionTier === 'free' && user?.portfolioType !== 'solid' && user?.portfolioType !== 'imported'
                      ? 'text-slate-500 cursor-not-allowed opacity-50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                disabled={user?.subscriptionTier === 'free' && user?.portfolioType !== 'solid' && user?.portfolioType !== 'imported'}
                title={user?.subscriptionTier === 'free' && user?.portfolioType !== 'solid' && user?.portfolioType !== 'imported' ? 'This portfolio type is locked for free users' : ''}
              >
                <div className={`w-2 h-2 rounded-full ${
                  user?.subscriptionTier === 'free' && user?.portfolioType !== 'solid' && user?.portfolioType !== 'imported' ? 'bg-slate-500' : 'bg-green-400'
                }`}></div>
                <span>Solid Portfolio</span>
                <span className="px-2 py-1 bg-slate-700 text-xs rounded-full">
                  {portfolio.filter(p => p.portfolioType === 'solid').length}
                </span>
                {user?.subscriptionTier === 'free' && user?.portfolioType !== 'solid' && user?.portfolioType !== 'imported' && (
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
        {!((user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'premium+') && showMultiPortfolio) && (
          <>
            {/* Portfolio Table */}
            <ErrorBoundary label="table">
              <LazyPortfolioTable
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Dimmed backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowStockForm(false)} />
          {/* Modal container */}
          <div className="relative w-full max-w-lg mx-4 overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-850 to-slate-900 shadow-2xl">
            <div className="p-5 sm:p-6">
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

      {/* Create Portfolio Modal */}
      {showCreatePortfolio && (
        <CreatePortfolioModal 
          onClose={() => setShowCreatePortfolio(false)}
              onSuccess={() => {
                setShowCreatePortfolio(false);
                // Refresh portfolios without full page reload
                fetchPortfolio(false);
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
                 fetchPortfolio(false);
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
