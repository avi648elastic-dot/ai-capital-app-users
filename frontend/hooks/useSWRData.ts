'use client';

import useSWR from 'swr';
import axios from 'axios';
import Cookies from 'js-cookie';

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com';
  const token = Cookies.get('token');
  
  const response = await axios.get(`${apiUrl}${url}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  
  return response.data;
};

// Portfolio data hook
export function usePortfolio() {
  const { data, error, mutate, isLoading } = useSWR(
    '/api/portfolio',
    fetcher,
    {
      refreshInterval: 30000, // 30 seconds
      revalidateOnFocus: true,
      dedupingInterval: 10000, // 10 seconds
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    portfolio: data?.portfolio || [],
    loading: isLoading,
    error,
    refresh: mutate,
    mutate
  };
}

// User profile hook
export function useUserProfile() {
  const { data, error, mutate, isLoading } = useSWR(
    '/api/user/profile',
    fetcher,
    {
      refreshInterval: 60000, // 1 minute
      revalidateOnFocus: true,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  return {
    user: data?.user || null,
    loading: isLoading,
    error,
    refresh: mutate
  };
}

// Expert portfolio hook
export function useExpertPortfolio() {
  const { data, error, mutate, isLoading } = useSWR(
    '/api/expert-portfolio',
    fetcher,
    {
      refreshInterval: 60000, // 1 minute
      revalidateOnFocus: true,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  return {
    expert: data?.expert || null,
    portfolio: data?.portfolio || [],
    totals: data?.totals || null,
    loading: isLoading,
    error,
    refresh: mutate
  };
}

// Deleted transactions hook
export function useDeletedTransactions() {
  const { data, error, mutate, isLoading } = useSWR(
    '/api/transactions/audit/deleted',
    fetcher,
    {
      refreshInterval: 120000, // 2 minutes
      revalidateOnFocus: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    transactions: data?.transactions || [],
    count: data?.count || 0,
    loading: isLoading,
    error,
    refresh: mutate
  };
}

// Notifications hook
export function useNotifications() {
  const { data, error, mutate, isLoading } = useSWR(
    '/api/notifications',
    fetcher,
    {
      refreshInterval: 30000, // 30 seconds
      revalidateOnFocus: true,
      dedupingInterval: 10000, // 10 seconds
    }
  );

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    loading: isLoading,
    error,
    refresh: mutate
  };
}

// Market data hook
export function useMarketData() {
  const { data, error, mutate, isLoading } = useSWR(
    '/api/market/overview',
    fetcher,
    {
      refreshInterval: 60000, // 1 minute
      revalidateOnFocus: true,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  return {
    marketData: data || null,
    loading: isLoading,
    error,
    refresh: mutate
  };
}

// Performance data hook
export function usePerformanceData() {
  const { data, error, mutate, isLoading } = useSWR(
    '/api/analytics/performance',
    fetcher,
    {
      refreshInterval: 120000, // 2 minutes
      revalidateOnFocus: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    performanceData: data || null,
    loading: isLoading,
    error,
    refresh: mutate
  };
}

// Leaderboard hook
export function useLeaderboard() {
  const { data, error, mutate, isLoading } = useSWR(
    '/api/leaderboard',
    fetcher,
    {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: true,
      dedupingInterval: 120000, // 2 minutes
    }
  );

  return {
    leaderboard: data?.leaderboard || [],
    userRank: data?.userRank || null,
    loading: isLoading,
    error,
    refresh: mutate
  };
}