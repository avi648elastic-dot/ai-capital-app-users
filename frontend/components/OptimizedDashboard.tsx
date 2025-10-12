'use client';

/**
 * 🚀 Optimized Dashboard Component
 * 
 * High-performance dashboard with intelligent loading, caching, and rendering optimizations
 * Designed to eliminate slow page loading and provide smooth user experience
 */

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { usePerformanceOptimization, performanceMonitor } from '@/lib/performanceOptimizer';
import { optimizedApi } from '@/lib/optimizedApi';

// Lazy load heavy components
const LazyPortfolioSummary = React.lazy(() => import('./PortfolioSummary'));
const LazyMultiPortfolioDashboard = React.lazy(() => import('./MultiPortfolioDashboard'));
const LazyMarketOverview = React.lazy(() => import('./MarketOverview'));
const LazyNotificationBanner = React.lazy(() => import('./NotificationBanner'));

// Loading skeleton components
const PortfolioSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gray-700 h-32 rounded-lg mb-4"></div>
    <div className="space-y-3">
      <div className="bg-gray-700 h-4 rounded w-3/4"></div>
      <div className="bg-gray-700 h-4 rounded w-1/2"></div>
    </div>
  </div>
);

const MarketSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gray-700 h-6 rounded w-1/4 mb-4"></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-700 h-20 rounded"></div>
      ))}
    </div>
  </div>
);

interface OptimizedDashboardProps {
  user: any;
  isMobile?: boolean;
}

export default function OptimizedDashboard({ user, isMobile = false }: OptimizedDashboardProps) {
  // Performance optimization hooks
  const { useDebounce, intelligentCache, performanceMonitor: perfMonitor } = usePerformanceOptimization();

  // State management with intelligent defaults
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [marketData, setMarketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Debounced refresh to prevent excessive API calls
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const debouncedRefreshTrigger = useDebounce(refreshTrigger, 1000);

  // Memoized user info to prevent unnecessary re-renders
  const userInfo = useMemo(() => ({
    id: user?.id || user?._id,
    name: user?.name || 'User',
    isAdmin: user?.isAdmin || false,
    avatarUrl: user?.avatarUrl || user?.avatar,
    subscriptionTier: user?.subscriptionTier || 'free'
  }), [user]);

  // Optimized data fetching with intelligent caching
  const fetchDashboardData = useCallback(async () => {
    const endTiming = perfMonitor.startTiming('dashboard_load');
    
    try {
      setError(null);
      
      // Check if we have cached data that's still fresh
      const cachedPortfolio = intelligentCache.get('dashboard_portfolio');
      const cachedMarket = intelligentCache.get('dashboard_market');
      
      if (cachedPortfolio && cachedMarket) {
        setPortfolioData(cachedPortfolio);
        setMarketData(cachedMarket);
        setLoading(false);
        console.log('✅ Dashboard loaded from cache');
        endTiming();
        return;
      }

      // Parallel data fetching for maximum performance
      const [portfolioResponse, marketResponse] = await Promise.allSettled([
        optimizedApi.getPortfolio(),
        optimizedApi.getMarketOverview()
      ]);

      // Handle portfolio data
      if (portfolioResponse.status === 'fulfilled') {
        setPortfolioData(portfolioResponse.value);
        intelligentCache.set('dashboard_portfolio', portfolioResponse.value, 30 * 1000); // 30s cache
      } else {
        console.error('Portfolio fetch failed:', portfolioResponse.reason);
      }

      // Handle market data
      if (marketResponse.status === 'fulfilled') {
        setMarketData(marketResponse.value);
        intelligentCache.set('dashboard_market', marketResponse.value, 2 * 60 * 1000); // 2min cache
      } else {
        console.error('Market fetch failed:', marketResponse.reason);
      }

      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('❌ Dashboard data fetch failed:', error);
      setError('Failed to load dashboard data. Please try again.');
      
      // Try to use stale cached data as fallback
      const stalePortfolio = intelligentCache.get('dashboard_portfolio_stale');
      const staleMarket = intelligentCache.get('dashboard_market_stale');
      
      if (stalePortfolio || staleMarket) {
        setPortfolioData(stalePortfolio);
        setMarketData(staleMarket);
        setError('Using cached data. Some information may be outdated.');
      }
    } finally {
      setLoading(false);
      endTiming();
    }
  }, [perfMonitor, intelligentCache]);

  // Initial data load with preloading
  useEffect(() => {
    const loadDashboard = async () => {
      // Preload critical data
      await optimizedApi.preloadCriticalData();
      await fetchDashboardData();
    };

    loadDashboard();
  }, [fetchDashboardData]);

  // Handle refresh triggers
  useEffect(() => {
    if (debouncedRefreshTrigger > 0) {
      fetchDashboardData();
    }
  }, [debouncedRefreshTrigger, fetchDashboardData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    performanceMonitor.recordMetric('manual_refresh', 1);
  }, []);

  // Optimized render with conditional loading
  const renderContent = useMemo(() => {
    if (loading && !portfolioData && !marketData) {
      return (
        <div className="space-y-6">
          <PortfolioSkeleton />
          <MarketSkeleton />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
            <button 
              onClick={handleRefresh}
              className="text-red-300 hover:text-red-100 underline text-sm mt-1"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Notification Banner */}
        <Suspense fallback={<div className="h-12 bg-gray-700 rounded animate-pulse"></div>}>
          <LazyNotificationBanner isMobile={isMobile} />
        </Suspense>

        {/* Portfolio Summary */}
        {portfolioData && (
          <Suspense fallback={<PortfolioSkeleton />}>
            <LazyPortfolioSummary 
              portfolio={portfolioData.portfolio || []}
              totals={portfolioData.totals || {}}
              volatility={portfolioData.portfolioVolatility || 0}
            />
          </Suspense>
        )}

        {/* Multi-Portfolio Dashboard */}
        {portfolioData && (
          <Suspense fallback={<PortfolioSkeleton />}>
            <LazyMultiPortfolioDashboard 
              user={userInfo}
              initialData={portfolioData}
            />
          </Suspense>
        )}

        {/* Market Overview */}
        {marketData && (
          <Suspense fallback={<MarketSkeleton />}>
            <LazyMarketOverview 
              initialData={marketData}
              lastUpdated={lastUpdate}
            />
          </Suspense>
        )}

        {/* Performance Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Performance Metrics</h3>
            <div className="text-xs text-gray-400 space-y-1">
              <div>Cache Size: {intelligentCache.getStats().size} entries</div>
              <div>Last Update: {lastUpdate.toLocaleTimeString()}</div>
              <div>
                <button 
                  onClick={() => console.log(performanceMonitor.getAllMetrics())}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  View All Metrics
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }, [loading, portfolioData, marketData, error, userInfo, isMobile, lastUpdate, handleRefresh, intelligentCache, performanceMonitor]);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-white">
                Welcome back, {userInfo.name}
              </h1>
              <p className="text-sm text-gray-400">
                {userInfo.subscriptionTier.charAt(0).toUpperCase() + userInfo.subscriptionTier.slice(1)} Plan
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className={`p-2 rounded-lg transition-colors ${
                  loading 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                }`}
                title="Refresh Data"
              >
                <svg 
                  className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
              </button>

              {/* Loading Indicator */}
              {loading && (
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Updating...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderContent}
      </div>
    </div>
  );
}
