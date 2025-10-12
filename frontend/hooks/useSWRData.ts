/**
 * 🔄 SWR Data Hooks for AI Capital
 * 
 * Custom hooks that wrap SWR for common data fetching patterns
 * Provides type-safe data fetching with automatic caching and revalidation
 */

import useSWR from 'swr';
import { fetcher, apiKeys, cacheConfigs } from '@/lib/swrConfig';

// Types for API responses
interface User {
  id: string;
  name: string;
  email: string;
  subscriptionTier: 'free' | 'premium' | 'premium+' | 'enterprise';
  subscriptionActive: boolean;
  avatarUrl?: string;
  isAdmin?: boolean;
}

interface Portfolio {
  id: string;
  name: string;
  type: 'sim' | 'live';
  stocks: Array<{
    ticker: string;
    shares: number;
    buyPrice: number;
    currentPrice: number;
    change: number;
    changePercent: number;
  }>;
  totals: {
    initial: number;
    current: number;
    pnl: number;
    roi: number;
  };
  volatility?: number;
}

interface WatchlistItem {
  id: string;
  ticker: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  notifications: boolean;
  priceAlert?: {
    type: 'high' | 'low' | 'both';
    highPrice?: number;
    lowPrice?: number;
    enabled: boolean;
  };
  addedAt: string;
}

interface MarketOverview {
  indexes: Record<string, {
    symbol: string;
    price: number;
    thisMonthPercent: number;
  }>;
  featured: Array<{
    symbol: string;
    price: number;
    thisMonthPercent: number;
  }>;
  updatedAt: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'action';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'system' | 'portfolio' | 'market' | 'account';
  readAt?: string;
  createdAt: string;
}

// User data hooks
export function useUser() {
  const { data, error, mutate, isLoading } = useSWR<User>(
    apiKeys.user(),
    fetcher,
    {
      ...cacheConfigs.user,
      // Don't revalidate user data on focus (it's personal data)
      revalidateOnFocus: false,
    }
  );
  
  return {
    user: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Portfolio data hooks
export function usePortfolios() {
  const { data, error, mutate, isLoading } = useSWR<{ portfolios: Portfolio[] }>(
    apiKeys.portfolios(),
    fetcher,
    cacheConfigs.realtime
  );
  
  return {
    portfolios: data?.portfolios || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function usePortfolio(id: string) {
  const { data, error, mutate, isLoading } = useSWR<{ portfolio: Portfolio; totals: any; portfolioVolatility: number }>(
    id ? apiKeys.portfolio(id) : null,
    fetcher,
    cacheConfigs.realtime
  );
  
  return {
    portfolio: data?.portfolio,
    totals: data?.totals,
    portfolioVolatility: data?.portfolioVolatility,
    isLoading,
    isError: error,
    mutate,
  };
}

// Watchlist data hooks
export function useWatchlist() {
  const { data, error, mutate, isLoading } = useSWR<{ watchlist: WatchlistItem[] }>(
    apiKeys.watchlist(),
    fetcher,
    cacheConfigs.realtime
  );
  
  return {
    watchlist: data?.watchlist || [],
    isLoading,
    isError: error,
    mutate,
  };
}

// Market data hooks
export function useMarketOverview() {
  const { data, error, mutate, isLoading } = useSWR<MarketOverview>(
    apiKeys.marketOverview(),
    fetcher,
    cacheConfigs.market
  );
  
  return {
    marketData: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Analytics data hooks
export function usePerformance() {
  const { data, error, mutate, isLoading } = useSWR<any>(
    apiKeys.performance(),
    fetcher,
    cacheConfigs.realtime
  );
  
  return {
    performance: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function usePortfolioAnalysis() {
  const { data, error, mutate, isLoading } = useSWR<any>(
    apiKeys.portfolioAnalysis(),
    fetcher,
    cacheConfigs.realtime
  );
  
  return {
    analysis: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Notifications hooks
export function useNotifications() {
  const { data, error, mutate, isLoading } = useSWR<{ notifications: Notification[] }>(
    apiKeys.notifications(),
    fetcher,
    {
      ...cacheConfigs.user,
      // Revalidate notifications more frequently
      refreshInterval: 60000, // 1 minute
    }
  );
  
  return {
    notifications: data?.notifications || [],
    isLoading,
    isError: error,
    mutate,
  };
}

// Admin data hooks
export function useAdminUsers() {
  const { data, error, mutate, isLoading } = useSWR<any>(
    apiKeys.adminUsers(),
    fetcher,
    cacheConfigs.user
  );
  
  return {
    adminUsers: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useAdminStats() {
  const { data, error, mutate, isLoading } = useSWR<any>(
    apiKeys.adminStats(),
    fetcher,
    cacheConfigs.realtime
  );
  
  return {
    adminStats: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Utility hooks
export function useSWRWithFallback<T>(
  key: string | null,
  fetcher: (url: string) => Promise<T>,
  fallback: T,
  config?: any
) {
  const { data, error, mutate, isLoading } = useSWR<T>(
    key,
    fetcher,
    config
  );
  
  return {
    data: data || fallback,
    isLoading,
    isError: error,
    mutate,
  };
}

// Optimistic updates helper
export function useOptimisticUpdate<T>(
  key: string,
  fetcher: (url: string) => Promise<T>
) {
  const { data, error, mutate, isLoading } = useSWR<T>(key, fetcher);
  
  const optimisticMutate = async (
    optimisticData: T,
    updateFn: () => Promise<T>
  ) => {
    // Update UI immediately with optimistic data
    mutate(optimisticData, false);
    
    try {
      // Perform the actual update
      const result = await updateFn();
      // Update with real data
      mutate(result);
      return result;
    } catch (error) {
      // Revert to original data on error
      mutate();
      throw error;
    }
  };
  
  return {
    data,
    isLoading,
    isError: error,
    mutate,
    optimisticMutate,
  };
}

export default {
  useUser,
  usePortfolios,
  usePortfolio,
  useWatchlist,
  useMarketOverview,
  usePerformance,
  usePortfolioAnalysis,
  useNotifications,
  useAdminUsers,
  useAdminStats,
  useSWRWithFallback,
  useOptimisticUpdate,
};
