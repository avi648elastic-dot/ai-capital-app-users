import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redisService';
import { loggerService } from '../services/loggerService';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
}

const defaultKeyGenerator = (req: Request): string => {
  const baseKey = `cache:${req.path}`;
  const queryString = req.query ? JSON.stringify(req.query) : '';
  const userId = (req as any).user?.id || 'anonymous';
  return `${baseKey}:${userId}:${queryString}`;
};

export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = defaultKeyGenerator,
    skipCache = () => false
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip cache for certain conditions
      if (skipCache(req)) {
        return next();
      }

      // Skip cache for non-GET requests
      if (req.method !== 'GET') {
        return next();
      }

      const cacheKey = keyGenerator(req);
      
      // Try to get from cache
      const cachedData = await redisService.get(cacheKey);
      
      if (cachedData) {
        loggerService.info(`Cache hit for key: ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }

      // Store original json method
      const originalJson = res.json;
      
      // Override res.json to cache the response
      res.json = function(data: any) {
        // Cache the response asynchronously
        // Convert seconds to milliseconds (redisService.set expects milliseconds)
        redisService.set(cacheKey, JSON.stringify(data), ttl * 1000)
          .then(() => {
            loggerService.info(`Cached response for key: ${cacheKey}, TTL: ${ttl}s`);
          })
          .catch((error) => {
            loggerService.error(`Failed to cache response for key: ${cacheKey}`, error);
          });
        
        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      loggerService.error('Cache middleware error:', error);
      // Continue without caching if Redis fails
      next();
    }
  };
};

// Specific cache configurations for different routes
export const portfolioCache = cacheMiddleware({
  ttl: 60, // 1 minute for portfolio data
  skipCache: (req) => {
    // Skip cache for real-time data requests
    return req.query.realtime === 'true';
  }
});

export const userProfileCache = cacheMiddleware({
  ttl: 300, // 5 minutes for user profile
});

export const marketDataCache = cacheMiddleware({
  ttl: 120, // 2 minutes for market data
});

export const expertPortfolioCache = cacheMiddleware({
  ttl: 180, // 3 minutes for expert portfolio
});

export const deletedTransactionsCache = cacheMiddleware({
  ttl: 600, // 10 minutes for deleted transactions
});

export const leaderboardCache = cacheMiddleware({
  ttl: 300, // 5 minutes for leaderboard
});
