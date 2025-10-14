/**
 * 🚀 PERFORMANCE CACHE MIDDLEWARE
 * Implements intelligent caching for API responses to dramatically improve performance
 */

import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redisService';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
}

export function createCacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => `cache:${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`,
    skipCache = () => false
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip cache for certain requests
      if (skipCache(req) || req.method !== 'GET') {
        return next();
      }

      const cacheKey = keyGenerator(req);
      
      // Try to get from cache
      const cachedData = await redisService.get(cacheKey);
      
      if (cachedData) {
        console.log(`🚀 [CACHE HIT] ${req.originalUrl}`);
        return res.json(JSON.parse(cachedData));
      }

      // Cache miss - continue to route handler
      console.log(`🚀 [CACHE MISS] ${req.originalUrl}`);
      
      // Store original res.json method
      const originalJson = res.json.bind(res);
      
      // Override res.json to cache the response
      res.json = function(body: any) {
        // Cache the response asynchronously (don't block response)
        setImmediate(async () => {
          try {
            await redisService.setex(cacheKey, ttl, JSON.stringify(body));
            console.log(`🚀 [CACHE STORED] ${req.originalUrl} (TTL: ${ttl}s)`);
          } catch (error) {
            console.error('❌ [CACHE ERROR] Failed to store cache:', error);
          }
        });
        
        // Send response immediately
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('❌ [CACHE MIDDLEWARE ERROR]:', error);
      next(); // Continue without caching if Redis fails
    }
  };
}

// Pre-configured cache middleware for different endpoints
export const portfolioCache = createCacheMiddleware({
  ttl: 30, // 30 seconds for portfolio data (frequent updates)
  keyGenerator: (req) => `portfolio:${req.user?._id}:${JSON.stringify(req.query)}`
});

export const stockDataCache = createCacheMiddleware({
  ttl: 300, // 5 minutes for stock data
  keyGenerator: (req) => `stock:${req.query.ticker || req.params.ticker}:${JSON.stringify(req.query)}`
});

export const analyticsCache = createCacheMiddleware({
  ttl: 600, // 10 minutes for analytics (expensive calculations)
  keyGenerator: (req) => `analytics:${req.user?._id}:${JSON.stringify(req.query)}`
});

export const performanceCache = createCacheMiddleware({
  ttl: 180, // 3 minutes for performance data
  keyGenerator: (req) => `performance:${req.user?._id}:${JSON.stringify(req.query)}`
});
