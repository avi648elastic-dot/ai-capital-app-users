import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { z } from 'zod';
import Cookies from 'js-cookie';

// API Response schemas
const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});

const PortfolioItemSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  ticker: z.string(),
  shares: z.number(),
  entryPrice: z.number(),
  currentPrice: z.number(),
  stopLoss: z.number().optional(),
  takeProfit: z.number().optional(),
  date: z.string(),
  notes: z.string().optional(),
  action: z.enum(['BUY', 'HOLD', 'SELL']),
  reason: z.string().optional(),
  color: z.string().optional(),
  portfolioType: z.enum(['solid', 'risky']),
  portfolioId: z.string(),
  portfolioName: z.string().optional(),
  volatility: z.number().optional(),
  lastVolatilityUpdate: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const PortfolioResponseSchema = z.object({
  success: z.boolean(),
  portfolio: z.array(PortfolioItemSchema),
  totals: z.object({
    initial: z.number(),
    current: z.number(),
    totalPnL: z.number(),
    totalPnLPercent: z.number(),
  }),
});

const UserSchema = z.object({
  _id: z.string(),
  email: z.string(),
  name: z.string(),
  avatar: z.string().optional(),
  subscriptionTier: z.enum(['free', 'premium', 'premium+']),
  subscriptionActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const AuthResponseSchema = z.object({
  success: z.boolean(),
  token: z.string(),
  user: UserSchema,
});

const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  priority: z.enum(['low', 'medium', 'high']),
  createdAt: z.string(),
  readAt: z.string().optional(),
});

const NotificationsResponseSchema = z.object({
  success: z.boolean(),
  notifications: z.array(NotificationSchema),
  unreadCount: z.number(),
});

// API Client class
class ApiClient {
  private client: AxiosInstance;
  private csrfToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com',
      timeout: 15000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadCsrfToken();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = Cookies.get('token') || localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add CSRF token for non-GET requests
        if (config.method !== 'get' && this.csrfToken) {
          config.headers['X-CSRF-Token'] = this.csrfToken;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle CSRF token errors
        if (error.response?.status === 403 && error.response?.data?.error === 'Invalid CSRF token') {
          if (!originalRequest._retry) {
            originalRequest._retry = true;
            await this.loadCsrfToken();
            if (this.csrfToken) {
              originalRequest.headers['X-CSRF-Token'] = this.csrfToken;
              return this.client(originalRequest);
            }
          }
        }

        // Handle auth errors (both 401 and 403)
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Check if it's an authentication error
          const isAuthError = error.response?.data?.message?.includes('token') || 
                             error.response?.data?.message?.includes('Authentication') ||
                             error.response?.data?.message?.includes('Invalid') ||
                             error.response?.data?.message?.includes('expired');
          
          if (isAuthError) {
            // Clear invalid token
            Cookies.remove('token');
            localStorage.removeItem('token');
            // Redirect to login
            window.location.href = '/';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async loadCsrfToken() {
    try {
      const response = await this.client.get('/api/csrf-token');
      this.csrfToken = response.data.csrfToken;
    } catch (error) {
      console.warn('Failed to load CSRF token:', error);
    }
  }

  // Generic request method with Zod validation
  private async request<T>(
    config: AxiosRequestConfig,
    schema: z.ZodSchema<T>
  ): Promise<T> {
    try {
      const response: AxiosResponse = await this.client(config);
      const validatedData = schema.parse(response.data);
      return validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('API Response validation failed:', error.issues);
        throw new Error('Invalid response format from server');
      }
      throw error;
    }
  }

  // Auth endpoints
  auth = {
    login: (credentials: { email: string; password: string }) =>
      this.request(
        { method: 'POST', url: '/api/auth/login', data: credentials },
        AuthResponseSchema
      ),

    register: (userData: { email: string; password: string; name: string }) =>
      this.request(
        { method: 'POST', url: '/api/auth/register', data: userData },
        AuthResponseSchema
      ),

    logout: () =>
      this.request(
        { method: 'POST', url: '/api/auth/logout' },
        ApiResponseSchema
      ),

    googleAuth: (token: string) =>
      this.request(
        { method: 'POST', url: '/api/auth/google', data: { token } },
        AuthResponseSchema
      ),

    getProfile: () =>
      this.request(
        { method: 'GET', url: '/api/user/profile' },
        z.object({ success: z.boolean(), user: UserSchema })
      ),
  };

  // Portfolio endpoints
  portfolio = {
    getAll: (query?: { portfolioType?: string; portfolioId?: string }) =>
      this.request(
        { method: 'GET', url: '/api/portfolio', params: query },
        PortfolioResponseSchema
      ),

    add: (stockData: {
      ticker: string;
      shares: number;
      entryPrice: number;
      currentPrice: number;
      stopLoss?: number;
      takeProfit?: number;
      notes?: string;
      portfolioType: 'solid' | 'risky';
      portfolioId: string;
    }) =>
      this.request(
        { method: 'POST', url: '/api/portfolio/add', data: stockData },
        ApiResponseSchema
      ),

    update: (id: string, updateData: Partial<{
      shares: number;
      entryPrice: number;
      currentPrice: number;
      stopLoss: number;
      takeProfit: number;
      notes: string;
      action: 'BUY' | 'HOLD' | 'SELL';
    }>) =>
      this.request(
        { method: 'PUT', url: `/api/portfolio/${id}`, data: updateData },
        ApiResponseSchema
      ),

    delete: (id: string) =>
      this.request(
        { method: 'DELETE', url: `/api/portfolio/${id}` },
        ApiResponseSchema
      ),
  };

  // Notifications endpoints
  notifications = {
    getAll: () =>
      this.request(
        { method: 'GET', url: '/api/notifications' },
        NotificationsResponseSchema
      ),

    markAsRead: (id: string) =>
      this.request(
        { method: 'PUT', url: `/api/notifications/${id}/read` },
        ApiResponseSchema
      ),

    markAllAsRead: () =>
      this.request(
        { method: 'PUT', url: '/api/notifications/read-all' },
        ApiResponseSchema
      ),

    delete: (id: string) =>
      this.request(
        { method: 'DELETE', url: `/api/notifications/${id}` },
        ApiResponseSchema
      ),
  };

  // Analytics endpoints
  analytics = {
    getPerformance: () =>
      this.request(
        { method: 'GET', url: '/api/analytics/performance' },
        z.object({
          success: z.boolean(),
          data: z.object({
            totalReturn: z.number(),
            dailyReturn: z.number(),
            weeklyReturn: z.number(),
            monthlyReturn: z.number(),
            volatility: z.number(),
            sharpeRatio: z.number(),
            maxDrawdown: z.number(),
          }),
        })
      ),

    getPortfolioAnalysis: () =>
      this.request(
        { method: 'GET', url: '/api/analytics/portfolio-analysis' },
        z.object({
          success: z.boolean(),
          data: z.object({
            totalValue: z.number(),
            totalPnL: z.number(),
            totalPnLPercent: z.number(),
            bestPerformer: z.object({
              ticker: z.string(),
              return: z.number(),
            }),
            worstPerformer: z.object({
              ticker: z.string(),
              return: z.number(),
            }),
            sectorAllocation: z.record(z.string(), z.number()),
          }),
        })
      ),
  };

  // Market data endpoints
  market = {
    getOverview: () =>
      this.request(
        { method: 'GET', url: '/api/markets/overview' },
        z.object({
          success: z.boolean(),
          data: z.object({
            indices: z.array(z.object({
              symbol: z.string(),
              name: z.string(),
              price: z.number(),
              change: z.number(),
              changePercent: z.number(),
            })),
            trending: z.array(z.object({
              symbol: z.string(),
              name: z.string(),
              price: z.number(),
              change: z.number(),
              changePercent: z.number(),
            })),
          }),
        })
      ),

    getStockData: (ticker: string) =>
      this.request(
        { method: 'GET', url: `/api/stocks/${ticker}` },
        z.object({
          success: z.boolean(),
          data: z.object({
            symbol: z.string(),
            name: z.string(),
            price: z.number(),
            change: z.number(),
            changePercent: z.number(),
            volume: z.number(),
            marketCap: z.number().optional(),
            pe: z.number().optional(),
            high52: z.number().optional(),
            low52: z.number().optional(),
          }),
        })
      ),
  };

  // Watchlist endpoints
  watchlist = {
    getAll: () =>
      this.request(
        { method: 'GET', url: '/api/watchlist' },
        z.object({
          success: z.boolean(),
          watchlist: z.array(z.object({
            _id: z.string(),
            ticker: z.string(),
            name: z.string(),
            currentPrice: z.number(),
            targetPrice: z.number(),
            alertType: z.enum(['high', 'low', 'both']),
            isActive: z.boolean(),
            createdAt: z.string(),
          })),
        })
      ),

    add: (data: { ticker: string; targetPrice: number; alertType: 'high' | 'low' | 'both' }) =>
      this.request(
        { method: 'POST', url: '/api/watchlist', data },
        ApiResponseSchema
      ),

    update: (id: string, data: { targetPrice?: number; alertType?: 'high' | 'low' | 'both'; isActive?: boolean }) =>
      this.request(
        { method: 'PUT', url: `/api/watchlist/${id}`, data },
        ApiResponseSchema
      ),

    delete: (id: string) =>
      this.request(
        { method: 'DELETE', url: `/api/watchlist/${id}` },
        ApiResponseSchema
      ),
  };

  // Leaderboard endpoints
  leaderboard = {
    getTopTraders: () =>
      this.request(
        { method: 'GET', url: '/api/leaderboard' },
        z.object({
          success: z.boolean(),
          traders: z.array(z.object({
            _id: z.string(),
            name: z.string(),
            reputation: z.number(),
            totalPositionsClosed: z.number(),
            winRate: z.number(),
            avgReturn: z.number(),
            rank: z.number(),
          })),
        })
      ),
  };

  // Historical transactions endpoints
  transactions = {
    getHistorical: (params?: { portfolioId?: string; startDate?: string; endDate?: string; limit?: number }) =>
      this.request(
        { method: 'GET', url: '/api/transactions/historical', params },
        z.object({
          success: z.boolean(),
          transactions: z.array(z.object({
            id: z.string(),
            action: z.string(),
            ticker: z.string(),
            shares: z.number(),
            entry: z.number(),
            exit: z.number(),
            pnl: z.number(),
            pnlPercent: z.number(),
            date: z.string(),
            portfolioId: z.string(),
            reason: z.string(),
            deletedBy: z.string(),
            deletedAt: z.string(),
          })),
          total: z.number(),
          message: z.string(),
        })
      ),
  };

  // Health check
  health = {
    check: () =>
      this.request(
        { method: 'GET', url: '/api/health' },
        z.object({
          status: z.string(),
          timestamp: z.string(),
          uptime: z.number(),
          memory: z.object({
            used: z.number(),
            total: z.number(),
            percentage: z.number(),
          }),
          database: z.object({
            status: z.string(),
            responseTime: z.number(),
          }),
        })
      ),
  };
}

// Export singleton instance
export const api = new ApiClient();

// Export types for use in components
export type PortfolioItem = z.infer<typeof PortfolioItemSchema>;
export type User = z.infer<typeof UserSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type PortfolioResponse = z.infer<typeof PortfolioResponseSchema>;
export type NotificationsResponse = z.infer<typeof NotificationsResponseSchema>;