import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

/**
 * 📡 Centralized API Client for AI-Capital
 * Handles authentication, error mapping, and consistent base URL
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com';

// Create axios instance with defaults
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Map error status to user-friendly messages
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          Cookies.remove('token');
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
          break;
        case 403:
          console.error('Forbidden:', data.error || 'Access denied');
          break;
        case 404:
          console.error('Not found:', data.error || 'Resource not found');
          break;
        case 429:
          console.error('Rate limit exceeded');
          break;
        case 500:
          console.error('Server error:', data.error || 'Internal server error');
          break;
        default:
          console.error(`API Error (${status}):`, data.error || error.message);
      }
    } else if (error.request) {
      console.error('Network error:', error.message);
    } else {
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Centralized API methods
 */
export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      axiosInstance.post('/api/auth/login', credentials),
    
    googleAuth: (token: string) =>
      axiosInstance.post('/api/auth/google', { token }),
    
    logout: () =>
      axiosInstance.post('/api/auth/logout'),
    
    me: () =>
      axiosInstance.get('/api/auth/me'),
  },

  // Portfolio
  portfolio: {
    getAll: () =>
      axiosInstance.get('/api/portfolio'),
    
    add: (stock: any) =>
      axiosInstance.post('/api/portfolio', stock),
    
    update: (id: string, updates: any) =>
      axiosInstance.put(`/api/portfolio/${id}`, updates),
    
    delete: (id: string) =>
      axiosInstance.delete(`/api/portfolio/${id}`),
    
    refresh: () =>
      axiosInstance.post('/api/portfolio/refresh'),
  },

  // Watchlist
  watchlist: {
    getAll: () =>
      axiosInstance.get('/api/watchlist'),
    
    add: (ticker: string, name?: string) =>
      axiosInstance.post('/api/watchlist', { ticker, name }),
    
    delete: (id: string) =>
      axiosInstance.delete(`/api/watchlist/${id}`),
    
    setAlert: (id: string, alert: { type: 'high' | 'low' | 'both', highPrice?: number, lowPrice?: number, enabled: boolean }) =>
      axiosInstance.patch(`/api/watchlist/${id}/alert`, alert),
    
    removeAlert: (id: string) =>
      axiosInstance.delete(`/api/watchlist/${id}/alert`),
    
    toggleAlert: (id: string, enabled: boolean) =>
      axiosInstance.patch(`/api/watchlist/${id}/alert/toggle`, { enabled }),
  },

  // Notifications
  notifications: {
    getAll: () =>
      axiosInstance.get('/api/notifications'),
    
    markAsRead: (id: string) =>
      axiosInstance.put(`/api/notifications/${id}/read`),
    
    markAllAsRead: () =>
      axiosInstance.put('/api/notifications/read-all'),
    
    delete: (id: string) =>
      axiosInstance.delete(`/api/notifications/${id}`),
  },

  // Analytics
  analytics: {
    get: () =>
      axiosInstance.get('/api/analytics'),
    
    performance: (days: number = 30) =>
      axiosInstance.get(`/api/performance?days=${days}`),
    
    riskManagement: () =>
      axiosInstance.get('/api/risk-management'),
  },

  // Stocks
  stocks: {
    search: (query: string) =>
      axiosInstance.get(`/api/stocks/search?q=${query}`),
    
    batchPrices: (tickers: string[]) =>
      axiosInstance.post('/api/stocks/batch-prices', { tickers }),
    
    metrics: (ticker: string) =>
      axiosInstance.get(`/api/stocks/${ticker}/metrics`),
  },

  // User
  user: {
    update: (updates: any) =>
      axiosInstance.put('/api/user/profile', updates),
    
    updateSettings: (settings: any) =>
      axiosInstance.put('/api/user/settings', settings),
    
    uploadAvatar: (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return axiosInstance.post('/api/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  },

  // Admin
  admin: {
    getUsers: (page: number = 1, limit: number = 50) =>
      axiosInstance.get(`/api/admin/users?page=${page}&limit=${limit}`),
    
    deleteUser: (userId: string) =>
      axiosInstance.delete(`/api/admin/users/${userId}`),
    
    updateUser: (userId: string, updates: any) =>
      axiosInstance.put(`/api/admin/users/${userId}`, updates),
    
    getStats: () =>
      axiosInstance.get('/api/admin/stats'),
  },
};

/**
 * Error message extractor
 */
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unknown error occurred';
};

/**
 * Check if error is authentication error
 */
export const isAuthError = (error: any): boolean => {
  return error.response?.status === 401 || error.response?.status === 403;
};

export default api;

