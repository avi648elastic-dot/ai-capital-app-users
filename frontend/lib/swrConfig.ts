/**
 * 🔄 SWR Configuration for AI Capital
 * 
 * Provides centralized data fetching and caching for the frontend
 * Replaces manual API calls with intelligent caching and revalidation
 */

import { SWRConfiguration } from 'swr';

// Default SWR configuration
export const swrConfig: SWRConfiguration = {
  // Cache data for 5 minutes by default
  dedupingInterval: 300000, // 5 minutes
  
  // Revalidate on focus (when user switches back to tab)
  revalidateOnFocus: true,
  
  // Revalidate on reconnect (when internet comes back)
  revalidateOnReconnect: true,
  
  // Error retry configuration
  errorRetryCount: 3,
  errorRetryInterval: 5000, // 5 seconds
  
  // Loading timeout
  loadingTimeout: 10000, // 10 seconds
  
  // Cache size limit
  provider: () => new Map(),
  
  // Global error handler
  onError: (error, key) => {
    console.error('SWR Error:', error, 'for key:', key);
    
    // Show user-friendly error messages
    if (error.message.includes('401')) {
      // Handle authentication errors
      console.log('Authentication error - redirecting to login');
      // Could dispatch logout action here
    } else if (error.message.includes('403')) {
      console.log('Access forbidden - insufficient permissions');
    } else if (error.message.includes('429')) {
      console.log('Rate limit exceeded - please try again later');
    }
  },
  
  // Success handler
  onSuccess: (data, key) => {
    console.log('SWR Success:', key, 'data loaded');
  },
  
  // Loading handler
  onLoadingSlow: (key) => {
    console.log('SWR Slow loading:', key);
  }
};

// Custom fetcher function with error handling
export const fetcher = async (url: string) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
    (error as any).status = response.status;
    (error as any).statusText = response.statusText;
    throw error;
  }
  
  return response.json();
};

// API endpoints with SWR keys
export const apiKeys = {
  // User data
  user: () => '/api/user/profile',
  
  // Portfolio data
  portfolios: () => '/api/portfolios',
  portfolio: (id: string) => `/api/portfolio/${id}`,
  
  // Watchlist data
  watchlist: () => '/api/watchlist',
  
  // Market data
  marketOverview: () => '/api/markets/overview',
  
  // Analytics
  performance: () => '/api/performance',
  portfolioAnalysis: () => '/api/analytics/portfolio-analysis',
  
  // Notifications
  notifications: () => '/api/notifications',
  
  // Admin
  adminUsers: () => '/api/admin/users',
  adminStats: () => '/api/admin/stats',
} as const;

// Cache configuration for different data types
export const cacheConfigs = {
  // Real-time data (shorter cache)
  realtime: {
    refreshInterval: 30000, // 30 seconds
    dedupingInterval: 10000, // 10 seconds
  },
  
  // User data (longer cache)
  user: {
    refreshInterval: 300000, // 5 minutes
    dedupingInterval: 60000, // 1 minute
  },
  
  // Market data (medium cache)
  market: {
    refreshInterval: 120000, // 2 minutes
    dedupingInterval: 30000, // 30 seconds
  },
  
  // Static data (long cache)
  static: {
    refreshInterval: 600000, // 10 minutes
    dedupingInterval: 300000, // 5 minutes
  },
} as const;

export default swrConfig;
