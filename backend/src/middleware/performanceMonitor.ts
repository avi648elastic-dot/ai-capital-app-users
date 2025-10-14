/**
 * 🚀 PERFORMANCE MONITORING MIDDLEWARE
 * Tracks API response times, database query performance, and system metrics
 */

import { Request, Response, NextFunction } from 'express';
import { loggerService } from '../services/loggerService';
import { redisService } from '../services/redisService';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  ip?: string;
}

interface DatabaseMetrics {
  operation: string;
  collection: string;
  duration: number;
  timestamp: Date;
  query?: any;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private dbMetrics: DatabaseMetrics[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics in memory

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Middleware to track API performance
   */
  trackAPI() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      // Override res.end to capture response time
      const originalEnd = res.end.bind(res);
      res.end = function(chunk?: any, encoding?: any): Response {
        const responseTime = Date.now() - startTime;
        
        // Record metrics
        PerformanceMonitor.getInstance().recordAPIMetrics({
          endpoint: req.originalUrl,
          method: req.method,
          responseTime,
          statusCode: res.statusCode,
          timestamp: new Date(),
          userId: (req as any).user?._id,
          userAgent: req.get('User-Agent'),
          ip: req.ip || req.connection.remoteAddress
        });

        // Log slow requests
        if (responseTime > 1000) { // > 1 second
          loggerService.warn(`🐌 [SLOW REQUEST] ${req.method} ${req.originalUrl} - ${responseTime}ms`);
        }

        // Log very slow requests
        if (responseTime > 5000) { // > 5 seconds
          loggerService.error(`🚨 [VERY SLOW REQUEST] ${req.method} ${req.originalUrl} - ${responseTime}ms`);
        }

        return originalEnd(chunk, encoding);
      };

      next();
    };
  }

  /**
   * Record API performance metrics
   */
  recordAPIMetrics(metrics: PerformanceMetrics) {
    this.metrics.push(metrics);
    
    // Keep only last MAX_METRICS
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Store in Redis for persistence (async) - using simple key-value storage
    setImmediate(async () => {
      try {
        const key = `perf:api:${Date.now()}`;
        await redisService.set(key, JSON.stringify(metrics), 86400000); // 24 hour TTL
      } catch (error) {
        loggerService.error('❌ [PERFORMANCE] Failed to store metrics:', error);
      }
    });
  }

  /**
   * Record database performance metrics
   */
  recordDatabaseMetrics(metrics: DatabaseMetrics) {
    this.dbMetrics.push(metrics);
    
    // Keep only last MAX_METRICS
    if (this.dbMetrics.length > this.MAX_METRICS) {
      this.dbMetrics = this.dbMetrics.slice(-this.MAX_METRICS);
    }

    // Log slow database operations
    if (metrics.duration > 100) { // > 100ms
      loggerService.warn(`🐌 [SLOW DB] ${metrics.operation} on ${metrics.collection} - ${metrics.duration}ms`);
    }

    if (metrics.duration > 1000) { // > 1 second
      loggerService.error(`🚨 [VERY SLOW DB] ${metrics.operation} on ${metrics.collection} - ${metrics.duration}ms`);
    }

    // Store in Redis for persistence (async)
    setImmediate(async () => {
      try {
        const key = `perf:db:${Date.now()}`;
        await redisService.set(key, JSON.stringify(metrics), 86400000); // 24 hour TTL
      } catch (error) {
        loggerService.error('❌ [PERFORMANCE] Failed to store DB metrics:', error);
      }
    });
  }

  /**
   * Get performance statistics from in-memory metrics
   */
  async getPerformanceStats(timeframe: 'hour' | 'day' | 'week' = 'hour') {
    const now = new Date();
    let cutoffTime: Date;

    switch (timeframe) {
      case 'hour':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    // Filter in-memory metrics
    const apiMetrics = this.metrics.filter(m => new Date(m.timestamp) > cutoffTime);
    const dbMetrics = this.dbMetrics.filter(m => new Date(m.timestamp) > cutoffTime);

    return {
      timeframe,
      api: {
        totalRequests: apiMetrics.length,
        averageResponseTime: this.calculateAverage(apiMetrics.map(m => m.responseTime)),
        slowestEndpoints: this.getSlowestEndpoints(apiMetrics),
        statusCodeDistribution: this.getStatusCodeDistribution(apiMetrics),
        requestsByHour: this.getRequestsByHour(apiMetrics)
      },
      database: {
        totalOperations: dbMetrics.length,
        averageQueryTime: this.calculateAverage(dbMetrics.map(m => m.duration)),
        slowestOperations: this.getSlowestOperations(dbMetrics),
        operationsByCollection: this.getOperationsByCollection(dbMetrics)
      }
    };
  }

  /**
   * Calculate average of array
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Get slowest endpoints
   */
  private getSlowestEndpoints(metrics: PerformanceMetrics[]): Array<{endpoint: string, avgTime: number, count: number}> {
    const endpointStats = new Map<string, {totalTime: number, count: number}>();
    
    metrics.forEach(m => {
      const existing = endpointStats.get(m.endpoint) || { totalTime: 0, count: 0 };
      endpointStats.set(m.endpoint, {
        totalTime: existing.totalTime + m.responseTime,
        count: existing.count + 1
      });
    });

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgTime: stats.totalTime / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);
  }

  /**
   * Get status code distribution
   */
  private getStatusCodeDistribution(metrics: PerformanceMetrics[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    metrics.forEach(m => {
      const status = Math.floor(m.statusCode / 100) * 100; // Group by 100s
      distribution[`${status}xx`] = (distribution[`${status}xx`] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Get requests by hour
   */
  private getRequestsByHour(metrics: PerformanceMetrics[]): Record<string, number> {
    const hourly: Record<string, number> = {};
    
    metrics.forEach(m => {
      const hour = new Date(m.timestamp).toISOString().substring(0, 13) + ':00:00Z';
      hourly[hour] = (hourly[hour] || 0) + 1;
    });

    return hourly;
  }

  /**
   * Get slowest database operations
   */
  private getSlowestOperations(metrics: DatabaseMetrics[]): Array<{operation: string, avgTime: number, count: number}> {
    const operationStats = new Map<string, {totalTime: number, count: number}>();
    
    metrics.forEach(m => {
      const key = `${m.operation}:${m.collection}`;
      const existing = operationStats.get(key) || { totalTime: 0, count: 0 };
      operationStats.set(key, {
        totalTime: existing.totalTime + m.duration,
        count: existing.count + 1
      });
    });

    return Array.from(operationStats.entries())
      .map(([operation, stats]) => ({
        operation,
        avgTime: stats.totalTime / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);
  }

  /**
   * Get operations by collection
   */
  private getOperationsByCollection(metrics: DatabaseMetrics[]): Record<string, number> {
    const byCollection: Record<string, number> = {};
    
    metrics.forEach(m => {
      byCollection[m.collection] = (byCollection[m.collection] || 0) + 1;
    });

    return byCollection;
  }

  /**
   * Clear old metrics
   */
  async clearOldMetrics() {
    this.metrics = [];
    this.dbMetrics = [];
    loggerService.info('🧹 [PERFORMANCE] Cleared old metrics');
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
