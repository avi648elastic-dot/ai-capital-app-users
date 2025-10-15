import { useState, useEffect, useCallback } from 'react';
import { api, type PortfolioItem, type User, type Notification } from '@/lib/api';

// Generic API hook
export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Specific hooks for common API calls
export function usePortfolio(portfolioType?: string, portfolioId?: string) {
  return useApi(
    () => api.portfolio.getAll({ portfolioType, portfolioId }),
    [portfolioType, portfolioId]
  );
}

export function useNotifications() {
  return useApi(() => api.notifications.getAll());
}

export function useUser() {
  return useApi(() => api.auth.getProfile());
}

export function useMarketOverview() {
  return useApi(() => api.market.getOverview());
}

export function useLeaderboard() {
  return useApi(() => api.leaderboard.getTopTraders());
}

export function useAnalytics() {
  const performance = useApi(() => api.analytics.getPerformance());
  const portfolioAnalysis = useApi(() => api.analytics.getPortfolioAnalysis());
  
  return {
    performance,
    portfolioAnalysis,
    loading: performance.loading || portfolioAnalysis.loading,
    error: performance.error || portfolioAnalysis.error,
  };
}

// Mutation hooks for actions that modify data
export function usePortfolioMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addStock = useCallback(async (stockData: {
    ticker: string;
    shares: number;
    entryPrice: number;
    currentPrice: number;
    stopLoss?: number;
    takeProfit?: number;
    notes?: string;
    portfolioType: 'solid' | 'risky';
    portfolioId: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      await api.portfolio.add(stockData);
    } catch (err: any) {
      setError(err.message || 'Failed to add stock');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStock = useCallback(async (id: string, updateData: Partial<{
    shares: number;
    entryPrice: number;
    currentPrice: number;
    stopLoss: number;
    takeProfit: number;
    notes: string;
    action: 'BUY' | 'HOLD' | 'SELL';
  }>) => {
    try {
      setLoading(true);
      setError(null);
      await api.portfolio.update(id, updateData);
    } catch (err: any) {
      setError(err.message || 'Failed to update stock');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteStock = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.portfolio.delete(id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete stock');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    addStock,
    updateStock,
    deleteStock,
    loading,
    error,
  };
}

export function useNotificationMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAsRead = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.notifications.markAsRead(id);
    } catch (err: any) {
      setError(err.message || 'Failed to mark notification as read');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await api.notifications.markAllAsRead();
    } catch (err: any) {
      setError(err.message || 'Failed to mark all notifications as read');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.notifications.delete(id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete notification');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loading,
    error,
  };
}

export function useWatchlistMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToWatchlist = useCallback(async (data: {
    ticker: string;
    targetPrice: number;
    alertType: 'high' | 'low' | 'both';
  }) => {
    try {
      setLoading(true);
      setError(null);
      await api.watchlist.add(data);
    } catch (err: any) {
      setError(err.message || 'Failed to add to watchlist');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWatchlistItem = useCallback(async (id: string, data: {
    targetPrice?: number;
    alertType?: 'high' | 'low' | 'both';
    isActive?: boolean;
  }) => {
    try {
      setLoading(true);
      setError(null);
      await api.watchlist.update(id, data);
    } catch (err: any) {
      setError(err.message || 'Failed to update watchlist item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFromWatchlist = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.watchlist.delete(id);
    } catch (err: any) {
      setError(err.message || 'Failed to remove from watchlist');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    addToWatchlist,
    updateWatchlistItem,
    removeFromWatchlist,
    loading,
    error,
  };
}
