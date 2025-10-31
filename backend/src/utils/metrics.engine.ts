// metrics.engine.ts
// Daily computation & caching engine for performance metrics
// (used by /Performance page)

import { computeMetricsForWindow, Bar, WindowKey } from "./metrics";
import { historicalDataService, HistoricalPrice } from "../services/historicalDataService";
import { redisService } from "../services/redisService";
import { loggerService } from "../services/loggerService";
import { googleFinanceFormulasService } from "../services/googleFinanceFormulasService";

type CachedData = {
  date: string;             // yyyy-mm-dd
  symbol: string;
  bars: Bar[];
  metrics: Record<WindowKey, any>;
  currentPrice: number;
  dataSource: string;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function cacheKey(symbol: string): string {
  return `metrics:${symbol}:${todayKey()}`;
}

/** Loads cached data if same day; otherwise null */
export async function loadCache(symbol: string): Promise<CachedData | null> {
  try {
    const key = cacheKey(symbol);
    const cached = await redisService.get(key);
    if (cached) {
      const data = JSON.parse(cached);
      if (data.date === todayKey()) {
        loggerService.info(`📦 [METRICS ENGINE] Loaded cached metrics for ${symbol} (${data.date})`);
        return data;
      }
    }
  } catch (error) {
    loggerService.warn(`⚠️ [METRICS ENGINE] Cache read error for ${symbol}:`, error);
  }
  return null;
}

/** Fetches + computes + caches all windows for one symbol */
export async function updateCache(symbol: string): Promise<CachedData> {
  loggerService.info(`🔄 [METRICS ENGINE] Updating cache for ${symbol}`);
  
  try {
    // Get current price and data source
    const stockMetrics = await googleFinanceFormulasService.getStockMetrics(symbol);
    const currentPrice = stockMetrics.current;
    const dataSource = stockMetrics.dataSource;
    
    // Get full historical data (needed for Bar[] format with high/low/open/close)
    const historicalData = await historicalDataService.getHistoricalData(symbol, 120); // 120d to cover 90d window
    
    if (historicalData.length === 0) {
      throw new Error(`No historical data available for ${symbol}`);
    }
    
    // Convert to Bar[] format for metrics module
    const bars: Bar[] = historicalData.map(item => ({
      t: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close
    }));
    
    // Add current price as most recent bar if needed
    if (bars.length > 0) {
      const lastBar = bars[bars.length - 1];
      const lastBarDate = new Date(lastBar.t);
      const today = new Date();
      
      // Only add current price if it's different/newer than last bar
      if (today.getTime() - lastBarDate.getTime() > 3600000) { // More than 1 hour difference
        bars.push({
          t: today.toISOString().split('T')[0],
          close: currentPrice,
          high: currentPrice * 1.005, // Estimate high
          low: currentPrice * 0.995,  // Estimate low
        });
      } else {
        // Update last bar with current price if within 1 hour
        bars[bars.length - 1] = {
          ...lastBar,
          close: currentPrice,
          high: Math.max(lastBar.high || currentPrice, currentPrice * 1.005),
          low: Math.min(lastBar.low || currentPrice, currentPrice * 0.995),
        };
      }
    }
    
    // Calculate metrics for all timeframes
    const riskFreeRate = 0.02; // 2% annual risk-free rate
    const metrics: Record<WindowKey, any> = {
      "7d": computeMetricsForWindow(symbol, bars, "7d", "high", riskFreeRate),
      "30d": computeMetricsForWindow(symbol, bars, "30d", "high", riskFreeRate),
      "60d": computeMetricsForWindow(symbol, bars, "60d", "high", riskFreeRate),
      "90d": computeMetricsForWindow(symbol, bars, "90d", "high", riskFreeRate),
    };
    
    const data: CachedData = {
      date: todayKey(),
      symbol,
      bars,
      metrics,
      currentPrice,
      dataSource
    };
    
    // Cache for 24 hours (until next day)
    const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const key = cacheKey(symbol);
    await redisService.set(key, JSON.stringify(data), cacheExpiry);
    
    loggerService.info(`✅ [METRICS ENGINE] Cached metrics for ${symbol} (${data.date})`);
    return data;
    
  } catch (error) {
    loggerService.error(`❌ [METRICS ENGINE] Error updating cache for ${symbol}:`, error);
    throw error;
  }
}

/** Main loader for UI - returns cached if available, otherwise fetches and caches */
export async function getMetrics(symbol: string): Promise<CachedData> {
  const cached = await loadCache(symbol);
  if (cached) {
    return cached;
  }
  return await updateCache(symbol);
}

/** Batch update cache for multiple symbols */
export async function updateCacheBatch(symbols: string[]): Promise<Record<string, CachedData>> {
  loggerService.info(`🔄 [METRICS ENGINE] Batch updating cache for ${symbols.length} symbols`);
  
  const results: Record<string, CachedData> = {};
  const errors: string[] = [];
  
  // Process in parallel with concurrency limit
  const batchSize = 5;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async (symbol) => {
        try {
          results[symbol] = await updateCache(symbol);
        } catch (error) {
          loggerService.error(`❌ [METRICS ENGINE] Failed to update ${symbol}:`, error);
          errors.push(symbol);
        }
      })
    );
  }
  
  if (errors.length > 0) {
    loggerService.warn(`⚠️ [METRICS ENGINE] Failed to update ${errors.length} symbols: ${errors.join(', ')}`);
  }
  
  loggerService.info(`✅ [METRICS ENGINE] Batch update complete: ${Object.keys(results).length}/${symbols.length} succeeded`);
  return results;
}

