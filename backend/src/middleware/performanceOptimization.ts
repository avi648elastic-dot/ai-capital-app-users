/**
 * 🚀 Performance Optimization Middleware
 * Implements caching and response optimization
 */

import { Request, Response, NextFunction } from 'express';
import { LRUCache } from 'lru-cache';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

// In-memory cache for API responses
const responseCache = new LRUCache<string, CacheEntry>({
  max: 1000, // Maximum 1000 cached responses
  ttl: 30000, // 30 second default TTL
  updateAgeOnGet: true,
  allowStale: true,
});

/**
 * Generate cache key from request
 */
function generateCacheKey(req: Request): string {
  const userId = (req as any).user?._id || 'anonymous';
  const path = req.path;
  const query = JSON.stringify(req.query);
  const method = req.method;
  
  return `${method}:${path}:${userId}:${query}`;
}

/**
 * Cache middleware for API responses
 */
export const cacheMiddleware = (ttl: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = generateCacheKey(req);
    const cached = responseCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      console.log(`📊 [CACHE HIT] ${req.path} - served from cache`);
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Age', Math.floor((Date.now() - cached.timestamp) / 1000));
      return res.json(cached.data);
    }

    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache response
    res.json = function(data: any) {
      // Cache successful responses only
      if (res.statusCode >= 200 && res.statusCode < 300) {
        responseCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl
        });
        console.log(`📊 [CACHE MISS] ${req.path} - cached for ${ttl/1000}s`);
        res.setHeader('X-Cache', 'MISS');
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Performance monitoring middleware
 */
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalSend = res.send;
  
  // Override send to measure response time
  res.send = function(data) {
    const duration = Date.now() - start;
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`🐌 [SLOW REQUEST] ${req.method} ${req.path} - ${duration}ms`);
    } else if (duration > 100) {
      console.log(`⏱️ [REQUEST] ${req.method} ${req.path} - ${duration}ms`);
    }
    
    res.setHeader('X-Response-Time', `${duration}ms`);
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Compression middleware setup (optional - install compression package to use)
 * npm install compression @types/compression
 */
export const compressionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Compression disabled - install compression package if needed
  next();
};

/**
 * Response optimization middleware
 */
export const responseOptimizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Set cache control headers
  if (req.method === 'GET') {
    // Cache GET requests for 30 seconds
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
  } else {
    // Don't cache other methods
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }

  // Enable HTTP/2 push hints for critical resources
  if (req.path === '/api/portfolio') {
    res.setHeader('Link', '</api/stocks/batch-prices>; rel=prefetch');
  }

  // Add performance headers
  res.setHeader('X-Performance-Optimized', 'true');
  
  next();
};

/**
 * Error boundary for performance-sensitive routes
 */
export const performanceErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`❌ [PERFORMANCE ERROR] ${req.method} ${req.path}:`, error);
  
  // Return cached response if available on error
  if (req.method === 'GET') {
    const cacheKey = generateCacheKey(req);
    const cached = responseCache.get(cacheKey);
    
    if (cached) {
      console.log(`📊 [ERROR FALLBACK] Serving stale cache for ${req.path}`);
      res.setHeader('X-Cache', 'STALE');
      res.setHeader('X-Error-Fallback', 'true');
      return res.json(cached.data);
    }
  }
  
  next(error);
};

/**
 * Batch request optimization utility
 */
export class BatchRequestOptimizer {
  private pendingRequests = new Map<string, Promise<any>>();
  private batchTimeout = 100; // 100ms batching window

  async addToBatch<T>(key: string, operation: () => Promise<T>): Promise<T> {
    // If request is already pending, return existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    const promise = operation();
    this.pendingRequests.set(key, promise);

    // Clean up after request completes
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });

    return promise;
  }

  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      cacheSize: responseCache.size
    };
  }
}

export const batchOptimizer = new BatchRequestOptimizer();

/**
 * Clear cache utility
 */
export const clearCache = (pattern?: string) => {
  if (pattern) {
    // Clear specific pattern
    for (const key of responseCache.keys()) {
      if (key.includes(pattern)) {
        responseCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    responseCache.clear();
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    size: responseCache.size,
    max: responseCache.max,
    utilization: ((responseCache.size / responseCache.max) * 100).toFixed(1) + '%'
  };
};