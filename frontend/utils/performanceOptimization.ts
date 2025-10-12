/**
 * 🚀 Performance Optimization Utilities
 * Collection of utilities to improve app performance and reduce loading times
 */

import React from 'react';

// Debounce function to limit API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Throttle function to limit function execution rate
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  
  return function (...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCallTime >= delay) {
      lastCallTime = now;
      return func.apply(this, args);
    }
  };
}

// Simple in-memory cache with TTL
export class MemoryCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();

  set(key: string, data: T, ttl: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Performance monitoring utilities
export const performanceMonitor = {
  // Measure function execution time
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`⏱️ [PERFORMANCE] ${name}: ${Math.round(end - start)}ms`);
    return result;
  },

  // Measure async function execution time
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`⏱️ [PERFORMANCE] ${name}: ${Math.round(end - start)}ms`);
    return result;
  },

  // Log memory usage (browser only)
  logMemoryUsage(): void {
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      console.log('🧠 [MEMORY]', {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
      });
    }
  }
};

// Batch API requests to reduce network overhead
export class BatchRequestManager {
  private pendingRequests = new Map<string, Promise<any>>();
  private batchSize: number;
  private flushInterval: number;
  private batchTimeoutId: NodeJS.Timeout | null = null;

  constructor(batchSize = 10, flushInterval = 100) {
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
  }

  // Add request to batch or execute immediately if batch is full
  async addRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const promise = requestFn();
    this.pendingRequests.set(key, promise);

    // Set up auto-flush if not already scheduled
    if (!this.batchTimeoutId) {
      this.batchTimeoutId = setTimeout(() => {
        this.flush();
      }, this.flushInterval);
    }

    // Flush immediately if batch is full
    if (this.pendingRequests.size >= this.batchSize) {
      this.flush();
    }

    return promise;
  }

  // Execute all pending requests
  private flush(): void {
    if (this.batchTimeoutId) {
      clearTimeout(this.batchTimeoutId);
      this.batchTimeoutId = null;
    }

    console.log(`🚀 [BATCH] Executing ${this.pendingRequests.size} batched requests`);
    
    // Clear the pending requests map
    this.pendingRequests.clear();
  }
}

// Lazy loading utility for heavy components
export const createLazyLoader = <T>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(importFn);
  
  return (props: any) => (
    <React.Suspense 
      fallback={
        fallback ? React.createElement(fallback) : 
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

// Global performance cache instance
export const globalCache = new MemoryCache();

// Clean up expired cache entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    globalCache.cleanup();
  }, 5 * 60 * 1000);
}
