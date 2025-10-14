/**
 * 🚀 Performance Optimization Service
 * 
 * Implements comprehensive performance optimizations for AI Capital
 * Addresses slow page loading and laggy user experience
 */

// 1️⃣ REQUEST BATCHING & DEBOUNCING
export class RequestBatcher {
  private batches: Map<string, {
    requests: Array<{ resolve: Function; reject: Function; params: any }>;
    timeout: NodeJS.Timeout;
  }> = new Map();

  private readonly BATCH_DELAY = 50; // 50ms batching window

  async batchRequest<T>(
    key: string,
    params: any,
    executor: (batchedParams: any[]) => Promise<T[]>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.batches.has(key)) {
        this.batches.set(key, {
          requests: [],
          timeout: setTimeout(() => this.executeBatch(key, executor), this.BATCH_DELAY)
        });
      }

      const batch = this.batches.get(key)!;
      batch.requests.push({ resolve, reject, params });
    });
  }

  private async executeBatch<T>(key: string, executor: (params: any[]) => Promise<T[]>) {
    const batch = this.batches.get(key);
    if (!batch) return;

    this.batches.delete(key);
    
    try {
      const allParams = batch.requests.map(req => req.params);
      const results = await executor(allParams);
      
      batch.requests.forEach((req, index) => {
        req.resolve(results[index]);
      });
    } catch (error) {
      batch.requests.forEach(req => req.reject(error));
    }
  }
}

// 2️⃣ INTELLIGENT CACHING SYSTEM
export class IntelligentCache {
  private cache: Map<string, {
    data: any;
    timestamp: number;
    accessCount: number;
    lastAccess: number;
  }> = new Map();

  private readonly MAX_SIZE = 1000;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    // Evict old entries if cache is full
    if (this.cache.size >= this.MAX_SIZE) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccess: Date.now()
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.DEFAULT_TTL) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccess = Date.now();

    return entry.data;
  }

  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let leastUsedScore = Infinity;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      // Score based on access frequency and recency
      const score = entry.accessCount / (Date.now() - entry.lastAccess + 1);
      if (score < leastUsedScore) {
        leastUsedScore = score;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }
}

// 3️⃣ COMPONENT LAZY LOADING
export const lazyLoad = (importFunc: () => Promise<any>) => {
  return React.lazy(() => 
    importFunc().catch(error => {
      console.error('Lazy loading failed:', error);
      // Return a fallback component
      return { default: () => React.createElement('div', null, 'Loading failed. Please refresh.') };
    })
  );
};

// 4️⃣ IMAGE OPTIMIZATION
export class ImageOptimizer {
  private static instance: ImageOptimizer;
  private loadedImages = new Set<string>();

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  preloadImage(src: string): Promise<void> {
    if (this.loadedImages.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.loadedImages.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  preloadImages(sources: string[]): Promise<void[]> {
    return Promise.all(sources.map(src => this.preloadImage(src)));
  }
}

// 5️⃣ VIRTUAL SCROLLING FOR LARGE LISTS
export interface VirtualScrollProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
}

export const useVirtualScroll = ({ items, itemHeight, containerHeight }: Omit<VirtualScrollProps, 'renderItem'>) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };
};

// 6️⃣ DEBOUNCED SEARCH
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// 7️⃣ PERFORMANCE MONITORING
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTiming(label: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(label, duration);
    };
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics(label: string): { avg: number; min: number; max: number } | null {
    const values = this.metrics.get(label);
    if (!values || values.length === 0) return null;

    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  getAllMetrics(): Record<string, { avg: number; min: number; max: number }> {
    const result: Record<string, { avg: number; min: number; max: number }> = {};
    
    for (const [label] of Array.from(this.metrics.entries())) {
      const metrics = this.getMetrics(label);
      if (metrics) {
        result[label] = metrics;
      }
    }
    
    return result;
  }
}

// 8️⃣ MEMORY MANAGEMENT
export class MemoryManager {
  private static instance: MemoryManager;
  private cleanupTasks: Set<() => void> = new Set();

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  addCleanupTask(task: () => void): () => void {
    this.cleanupTasks.add(task);
    
    // Return cleanup function
    return () => {
      this.cleanupTasks.delete(task);
    };
  }

  cleanup(): void {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    });
    this.cleanupTasks.clear();
  }

  getMemoryUsage(): { used: number; total: number } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize
      };
    }
    return null;
  }
}

// 9️⃣ GLOBAL INSTANCES
export const requestBatcher = new RequestBatcher();
export const intelligentCache = new IntelligentCache();
export const imageOptimizer = ImageOptimizer.getInstance();
export const performanceMonitor = PerformanceMonitor.getInstance();
export const memoryManager = MemoryManager.getInstance();

// 🔟 REACT IMPORTS (for hooks)
import React from 'react';

// Export performance optimization hook
export const usePerformanceOptimization = () => {
  React.useEffect(() => {
    // Cleanup on unmount
    return () => {
      memoryManager.cleanup();
    };
  }, []);

  return {
    requestBatcher,
    intelligentCache,
    imageOptimizer,
    performanceMonitor,
    memoryManager,
    useDebounce,
    useVirtualScroll
  };
};
