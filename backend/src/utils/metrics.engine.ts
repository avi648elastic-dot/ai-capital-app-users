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
  loggerService.info(`🔄 [METRICS ENGINE] Updating cache for ${symbol} - fetching fresh data...`);
  
  try {
    const startTime = Date.now();
    
    // Get current price and data source (always fetch fresh for daily updates)
    loggerService.info(`📊 [METRICS ENGINE] ${symbol}: Fetching current price...`);
    const stockMetrics = await googleFinanceFormulasService.getStockMetrics(symbol);
    const currentPrice = stockMetrics.current;
    const dataSource = stockMetrics.dataSource;
    loggerService.info(`✅ [METRICS ENGINE] ${symbol}: Current price = $${currentPrice.toFixed(2)} (${dataSource})`);
    
    // Get full historical data (always fetch fresh to ensure latest data)
    // Force fetch from API by requesting more days than typical cache window
    loggerService.info(`📊 [METRICS ENGINE] ${symbol}: Fetching 120 days of historical data...`);
    const historicalData = await historicalDataService.getHistoricalData(symbol, 120); // 120d to cover 90d window
    
    if (historicalData.length === 0) {
      throw new Error(`No historical data available for ${symbol}`);
    }
    
    loggerService.info(`✅ [METRICS ENGINE] ${symbol}: Retrieved ${historicalData.length} days of historical data`);
    
    // Convert to Bar[] format for metrics module
    const bars: Bar[] = historicalData.map(item => ({
      t: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close
    }));
    
    // Sort bars by date to ensure chronological order
    bars.sort((a, b) => {
      const dateA = new Date(a.t).getTime();
      const dateB = new Date(b.t).getTime();
      return dateA - dateB;
    });
    
    // Always update with current price as the most recent bar
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const lastBar = bars[bars.length - 1];
    const lastBarDate = lastBar ? new Date(lastBar.t).toISOString().split('T')[0] : null;
    
    // If last bar is not today, add/update with current price
    if (lastBarDate !== todayStr) {
      if (lastBar && today.getTime() - new Date(lastBar.t).getTime() < 3600000) {
        // Update last bar if it's within 1 hour (intraday update)
        bars[bars.length - 1] = {
          ...lastBar,
          close: currentPrice,
          high: Math.max(lastBar.high || currentPrice, currentPrice),
          low: Math.min(lastBar.low || currentPrice, currentPrice),
        };
        loggerService.info(`🔄 [METRICS ENGINE] ${symbol}: Updated last bar with current price`);
      } else {
        // Add new bar for today
        bars.push({
          t: todayStr,
          close: currentPrice,
          high: currentPrice * 1.01, // Estimate 1% high
          low: currentPrice * 0.99,  // Estimate 1% low
          open: currentPrice, // Use current as open estimate
        });
        loggerService.info(`➕ [METRICS ENGINE] ${symbol}: Added today's bar with current price`);
      }
    } else {
      // Last bar is today, update with current price
      bars[bars.length - 1] = {
        ...lastBar,
        close: currentPrice,
        high: Math.max(lastBar.high || currentPrice, currentPrice),
        low: Math.min(lastBar.low || currentPrice, currentPrice),
      };
      loggerService.info(`🔄 [METRICS ENGINE] ${symbol}: Updated today's bar with current price`);
    }
    
    // Calculate metrics for all timeframes
    loggerService.info(`🧮 [METRICS ENGINE] ${symbol}: Calculating metrics for all timeframes (7d, 30d, 60d, 90d)...`);
    const riskFreeRate = 0.02; // 2% annual risk-free rate
    const metrics: Record<WindowKey, any> = {
      "7d": computeMetricsForWindow(symbol, bars, "7d", "high", riskFreeRate),
      "30d": computeMetricsForWindow(symbol, bars, "30d", "high", riskFreeRate),
      "60d": computeMetricsForWindow(symbol, bars, "60d", "high", riskFreeRate),
      "90d": computeMetricsForWindow(symbol, bars, "90d", "high", riskFreeRate),
    };
    
    const calcTime = Date.now() - startTime;
    loggerService.info(`✅ [METRICS ENGINE] ${symbol}: Calculated all metrics in ${calcTime}ms`, {
      "7d": `${metrics["7d"].returnPct.toFixed(2)}% return, ${metrics["7d"].volatilityAnnual.toFixed(2)}% vol`,
      "30d": `${metrics["30d"].returnPct.toFixed(2)}% return, ${metrics["30d"].volatilityAnnual.toFixed(2)}% vol`,
      "90d": `${metrics["90d"].returnPct.toFixed(2)}% return, ${metrics["90d"].volatilityAnnual.toFixed(2)}% vol`,
    });
    
    const data: CachedData = {
      date: todayKey(),
      symbol,
      bars,
      metrics,
      currentPrice,
      dataSource
    };
    
    // Cache until end of day (midnight + 1 hour buffer for timezone safety)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const cacheExpiry = tomorrow.getTime() - now.getTime() + (60 * 60 * 1000); // Add 1 hour buffer
    
    const key = cacheKey(symbol);
    await redisService.set(key, JSON.stringify(data), cacheExpiry);
    
    loggerService.info(`💾 [METRICS ENGINE] ${symbol}: Cached metrics until ${tomorrow.toISOString()} (${Math.round(cacheExpiry / 1000 / 60)} minutes)`);
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

