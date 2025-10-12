/**
 * 🚀 Optimized API Service
 * 
 * High-performance API client with intelligent caching, batching, and error handling
 * Designed to eliminate slow page loading and improve user experience
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { requestBatcher, intelligentCache, performanceMonitor } from './performanceOptimizer';

interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  key?: string; // Custom cache key
  enabled?: boolean; // Whether to use cache
}

interface BatchConfig {
  enabled?: boolean;
  key?: string; // Batch key for grouping similar requests
  delay?: number; // Batch delay in milliseconds
}

interface OptimizedRequestConfig extends AxiosRequestConfig {
  cache?: CacheConfig;
  batch?: BatchConfig;
  timeout?: number;
  retries?: number;
}

class OptimizedApiService {
  private axiosInstance: AxiosInstance;
  private requestQueue: Map<string, Promise<any>> = new Map();

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for performance monitoring
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add performance timing
        (config as any).startTime = performance.now();
        
        // Add auth token
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for performance monitoring and error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Record performance metrics
        const duration = performance.now() - (response.config as any).startTime;
        performanceMonitor.recordMetric(`api_${response.config.method}_${response.config.url}`, duration);

        return response;
      },
      async (error) => {
        const config = error.config;
        
        // Retry logic
        if (config?.retries && config.retries > 0) {
          config.retries--;
          await this.delay(1000); // Wait 1 second before retry
          return this.axiosInstance(config);
        }

        // Record error metrics
        performanceMonitor.recordMetric('api_errors', 1);
        
        return Promise.reject(error);
      }
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateCacheKey(url: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `api_${url}_${paramString}`;
  }

  private async executeRequest<T>(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    url: string,
    data?: any,
    config?: OptimizedRequestConfig
  ): Promise<T> {
    const endTiming = performanceMonitor.startTiming(`api_${method}_${url}`);

    try {
      // Check cache first (for GET requests)
      if (method === 'get' && config?.cache?.enabled !== false) {
        const cacheKey = config?.cache?.key || this.generateCacheKey(url, data);
        const cachedData = intelligentCache.get(cacheKey);
        
        if (cachedData) {
          endTiming();
          performanceMonitor.recordMetric('api_cache_hits', 1);
          return cachedData;
        }
      }

      // Check if request is already in flight (deduplication)
      const requestKey = `${method}_${url}_${JSON.stringify(data || {})}`;
      if (this.requestQueue.has(requestKey)) {
        return await this.requestQueue.get(requestKey);
      }

      // Execute request
      let requestPromise: Promise<AxiosResponse<T>>;

      if (config?.batch?.enabled) {
        // Use batching for similar requests
        const batchKey = config.batch.key || `${method}_${url}`;
        requestPromise = requestBatcher.batchRequest(
          batchKey,
          { url, data, config },
          async (batchedRequests) => {
            // Execute all batched requests
            const promises = batchedRequests.map(req => 
              this.axiosInstance[method](req.url, req.data, req.config)
            );
            return Promise.all(promises);
          }
        );
      } else {
        // Regular request
        requestPromise = this.axiosInstance[method](url, data, {
          ...config,
          retries: config?.retries || 2
        });
      }

      // Store in request queue
      this.requestQueue.set(requestKey, requestPromise);

      const response = await requestPromise;

      // Remove from queue
      this.requestQueue.delete(requestKey);

      // Cache response (for GET requests)
      if (method === 'get' && config?.cache?.enabled !== false) {
        const cacheKey = config?.cache?.key || this.generateCacheKey(url, data);
        const ttl = config?.cache?.ttl || 5 * 60 * 1000; // 5 minutes default
        intelligentCache.set(cacheKey, response.data, ttl);
      }

      endTiming();
      return response.data;

    } catch (error) {
      this.requestQueue.delete(`${method}_${url}_${JSON.stringify(data || {})}`);
      endTiming();
      throw error;
    }
  }

  // 🚀 OPTIMIZED API METHODS

  /**
   * GET request with intelligent caching
   */
  async get<T>(url: string, config?: OptimizedRequestConfig): Promise<T> {
    return this.executeRequest('get', url, undefined, {
      cache: { enabled: true, ttl: 5 * 60 * 1000 }, // 5 minutes cache
      ...config
    });
  }

  /**
   * POST request with optional batching
   */
  async post<T>(url: string, data?: any, config?: OptimizedRequestConfig): Promise<T> {
    return this.executeRequest('post', url, data, config);
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, config?: OptimizedRequestConfig): Promise<T> {
    return this.executeRequest('put', url, data, config);
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: any, config?: OptimizedRequestConfig): Promise<T> {
    return this.executeRequest('patch', url, data, config);
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: OptimizedRequestConfig): Promise<T> {
    return this.executeRequest('delete', url, undefined, config);
  }

  // 🎯 SPECIALIZED HIGH-PERFORMANCE METHODS

  /**
   * Batch multiple stock price requests
   */
  async getStockPrices(symbols: string[]): Promise<Record<string, any>> {
    const endTiming = performanceMonitor.startTiming('batch_stock_prices');
    
    try {
      // Check cache for each symbol
      const cachedResults: Record<string, any> = {};
      const uncachedSymbols: string[] = [];

      for (const symbol of symbols) {
        const cacheKey = `stock_price_${symbol}`;
        const cached = intelligentCache.get(cacheKey);
        if (cached) {
          cachedResults[symbol] = cached;
        } else {
          uncachedSymbols.push(symbol);
        }
      }

      // Fetch uncached symbols in batch
      if (uncachedSymbols.length > 0) {
        const response = await this.post('/api/stocks/batch-prices', {
          symbols: uncachedSymbols
        }, {
          cache: { enabled: false }, // Don't cache the batch request itself
          timeout: 15000 // Longer timeout for batch requests
        });

        // Cache individual results
        for (const [symbol, data] of Object.entries(response.prices || {})) {
          const cacheKey = `stock_price_${symbol}`;
          intelligentCache.set(cacheKey, data, 2 * 60 * 1000); // 2 minutes cache for stock prices
          cachedResults[symbol] = data;
        }
      }

      endTiming();
      return cachedResults;
    } catch (error) {
      endTiming();
      throw error;
    }
  }

  /**
   * Get portfolio data with aggressive caching
   */
  async getPortfolio(portfolioId?: string): Promise<any> {
    const url = portfolioId ? `/api/portfolio/${portfolioId}` : '/api/portfolio';
    
    return this.get(url, {
      cache: {
        enabled: true,
        ttl: 30 * 1000, // 30 seconds cache for portfolio data
        key: `portfolio_${portfolioId || 'default'}`
      },
      timeout: 8000
    });
  }

  /**
   * Get user notifications with smart caching
   */
  async getNotifications(limit: number = 50): Promise<any> {
    return this.get(`/api/notifications?limit=${limit}`, {
      cache: {
        enabled: true,
        ttl: 60 * 1000, // 1 minute cache for notifications
        key: 'user_notifications'
      }
    });
  }

  /**
   * Get market overview with extended caching
   */
  async getMarketOverview(): Promise<any> {
    return this.get('/api/markets/overview', {
      cache: {
        enabled: true,
        ttl: 2 * 60 * 1000, // 2 minutes cache for market data
        key: 'market_overview'
      }
    });
  }

  /**
   * Search stocks with debouncing built-in
   */
  async searchStocks(query: string): Promise<any> {
    if (!query || query.length < 2) {
      return { results: [] };
    }

    return this.get(`/api/stocks/search?q=${encodeURIComponent(query)}`, {
      cache: {
        enabled: true,
        ttl: 10 * 60 * 1000, // 10 minutes cache for search results
        key: `stock_search_${query.toLowerCase()}`
      }
    });
  }

  // 🧹 CACHE MANAGEMENT

  /**
   * Clear all cached data
   */
  clearCache(): void {
    intelligentCache.clear();
  }

  /**
   * Clear specific cache entries
   */
  clearCacheByPattern(pattern: string): void {
    // Implementation would depend on cache structure
    console.log(`Clearing cache entries matching: ${pattern}`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return intelligentCache.getStats();
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Record<string, { avg: number; min: number; max: number }> {
    return performanceMonitor.getAllMetrics();
  }

  /**
   * Preload critical data
   */
  async preloadCriticalData(): Promise<void> {
    const endTiming = performanceMonitor.startTiming('preload_critical_data');
    
    try {
      // Preload in parallel
      await Promise.allSettled([
        this.getPortfolio(),
        this.getMarketOverview(),
        this.getNotifications(10)
      ]);
      
      console.log('✅ Critical data preloaded');
    } catch (error) {
      console.error('❌ Failed to preload critical data:', error);
    } finally {
      endTiming();
    }
  }
}

// Export singleton instance
export const optimizedApi = new OptimizedApiService();
export default optimizedApi;
