import axios from 'axios';
import { loggerService } from './loggerService';

interface DailyPrice {
  date: string;
  price: number;
}

interface StockMetrics {
  symbol: string;
  currentPrice: number;
  totalReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  topPrice: number;
  dataSource: string;
  timestamp: number;
}

class RealTimePerformanceService {
  private cache = new Map<string, { data: StockMetrics; timestamp: number }>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  /**
   * Fetch real daily price data from Yahoo Finance
   */
  private async fetchDailyPrices(symbol: string, days: number): Promise<DailyPrice[]> {
    try {
      loggerService.info(`🔍 [REAL TIME] Fetching ${days} days of data for ${symbol}`);
      
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
        params: {
          range: days <= 7 ? '7d' : days <= 30 ? '1mo' : days <= 60 ? '2mo' : '3mo',
          interval: '1d'
        },
        timeout: 15000
      });

      if (!response.data || !response.data.chart || !response.data.chart.result) {
        throw new Error('No data from Yahoo Finance');
      }

      const result = response.data.chart.result[0];
      const quotes = result.indicators.quote[0];
      const timestamps = result.timestamp;
      const closes = quotes.close;

      if (!closes || closes.length === 0) {
        throw new Error('No price data available');
      }

      // Filter out null values and create price data
      const prices: DailyPrice[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        if (closes[i] !== null) {
          prices.push({
            date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
            price: closes[i]
          });
        }
      }

      // Sort by date (oldest first)
      prices.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      loggerService.info(`✅ [REAL TIME] Fetched ${prices.length} days of data for ${symbol}`);
      return prices;

    } catch (error) {
      loggerService.error(`❌ [REAL TIME] Error fetching data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Calculate log returns from price data
   */
  private calculateLogReturns(prices: DailyPrice[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      const logReturn = Math.log(prices[i].price / prices[i - 1].price);
      returns.push(logReturn);
    }
    return returns;
  }

  /**
   * Calculate total return: (P_end / P_start - 1) * 100
   */
  private calculateTotalReturn(prices: DailyPrice[]): number {
    if (prices.length < 2) return 0;
    const startPrice = prices[0].price;
    const endPrice = prices[prices.length - 1].price;
    return ((endPrice / startPrice) - 1) * 100;
  }

  /**
   * Calculate volatility: σ = stdev(r_t) * sqrt(252)
   */
  private calculateVolatility(logReturns: number[]): number {
    if (logReturns.length < 2) return 0;
    
    const mean = logReturns.reduce((sum, ret) => sum + ret, 0) / logReturns.length;
    const variance = logReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / logReturns.length;
    const dailyVolatility = Math.sqrt(variance);
    
    // Annualize with sqrt(252)
    return dailyVolatility * Math.sqrt(252) * 100; // Convert to percentage
  }

  /**
   * Calculate Sharpe ratio: ((mean(r_t) - rf/252) / stdev(r_t)) * sqrt(252)
   */
  private calculateSharpeRatio(logReturns: number[], riskFreeRate: number = 0.02): number {
    if (logReturns.length < 2) return 0;
    
    const dailyRiskFreeRate = riskFreeRate / 252;
    const meanReturn = logReturns.reduce((sum, ret) => sum + ret, 0) / logReturns.length;
    const variance = logReturns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / logReturns.length;
    const dailyVolatility = Math.sqrt(variance);
    
    if (dailyVolatility === 0) return 0;
    
    return ((meanReturn - dailyRiskFreeRate) / dailyVolatility) * Math.sqrt(252);
  }

  /**
   * Calculate max drawdown: min( (cum_max(P) - P) / cum_max(P) ) * 100
   */
  private calculateMaxDrawdown(prices: DailyPrice[]): number {
    if (prices.length < 2) return 0;
    
    const priceValues = prices.map(p => p.price);
    const cumMax: number[] = [];
    let maxSoFar = priceValues[0];
    
    // Calculate cumulative maximum
    for (let i = 0; i < priceValues.length; i++) {
      maxSoFar = Math.max(maxSoFar, priceValues[i]);
      cumMax.push(maxSoFar);
    }
    
    // Calculate drawdowns: (cum_max(P) - P) / cum_max(P)
    const drawdowns: number[] = [];
    for (let i = 0; i < priceValues.length; i++) {
      const drawdown = (cumMax[i] - priceValues[i]) / cumMax[i];
      drawdowns.push(drawdown);
    }
    
    // Find minimum (most negative) drawdown
    const maxDrawdown = Math.min(...drawdowns) * 100;
    return Math.abs(maxDrawdown); // Return as positive percentage
  }

  /**
   * Get performance metrics for a single stock
   */
  async getStockMetrics(symbol: string, days: number): Promise<StockMetrics> {
    const cacheKey = `${symbol}-${days}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      loggerService.info(`📊 [CACHE HIT] Returning cached data for ${symbol}`);
      return cached.data;
    }

    try {
      loggerService.info(`🔍 [REAL TIME] Calculating metrics for ${symbol} over ${days} days`);
      
      // Fetch real daily price data
      const prices = await this.fetchDailyPrices(symbol, days);
      
      if (prices.length < 2) {
        throw new Error('Insufficient price data');
      }

      // Calculate all metrics using real data
      const logReturns = this.calculateLogReturns(prices);
      const totalReturn = this.calculateTotalReturn(prices);
      const volatility = this.calculateVolatility(logReturns);
      const sharpeRatio = this.calculateSharpeRatio(logReturns);
      const maxDrawdown = this.calculateMaxDrawdown(prices);
      const topPrice = Math.max(...prices.map(p => p.price));
      const currentPrice = prices[prices.length - 1].price;

      const metrics: StockMetrics = {
        symbol: symbol.toUpperCase(),
        currentPrice,
        totalReturn,
        volatility,
        sharpeRatio,
        maxDrawdown,
        topPrice,
        dataSource: 'Yahoo Finance Real Data',
        timestamp: Date.now()
      };

      // Cache the result
      this.cache.set(cacheKey, { data: metrics, timestamp: Date.now() });

      loggerService.info(`✅ [REAL TIME] Calculated metrics for ${symbol}:`, {
        return: totalReturn.toFixed(2) + '%',
        volatility: volatility.toFixed(2) + '%',
        sharpe: sharpeRatio.toFixed(2),
        maxDD: maxDrawdown.toFixed(2) + '%'
      });

      return metrics;

    } catch (error) {
      loggerService.error(`❌ [REAL TIME] Error calculating metrics for ${symbol}:`, error);
      
      // Return fallback data
      return {
        symbol: symbol.toUpperCase(),
        currentPrice: 0,
        totalReturn: 0,
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        topPrice: 0,
        dataSource: 'Error - No Data',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get performance metrics for multiple stocks
   */
  async getMultipleStockMetrics(symbols: string[], days: number): Promise<Map<string, StockMetrics>> {
    loggerService.info(`🔍 [REAL TIME] Calculating metrics for ${symbols.length} stocks over ${days} days`);
    
    const results = new Map<string, StockMetrics>();
    const errors: string[] = [];

    // Process in parallel
    const promises = symbols.map(async (symbol) => {
      try {
        const metrics = await this.getStockMetrics(symbol, days);
        results.set(symbol, metrics);
      } catch (error) {
        const errorMsg = `${symbol}: ${(error as Error).message || 'Unknown error'}`;
        errors.push(errorMsg);
        loggerService.error(`❌ [REAL TIME] Failed to calculate ${symbol}`, { error: errorMsg });
      }
    });

    await Promise.all(promises);

    loggerService.info(`✅ [REAL TIME] Successfully calculated ${results.size}/${symbols.length} stocks`);
    
    if (errors.length > 0) {
      loggerService.warn(`⚠️ [REAL TIME] Failed stocks: ${errors.join(', ')}`);
    }

    return results;
  }

  /**
   * Clear cache for specific symbol and timeframe
   */
  clearCache(symbol?: string, days?: number): void {
    if (symbol && days) {
      const cacheKey = `${symbol}-${days}`;
      this.cache.delete(cacheKey);
      loggerService.info(`🗑️ [CACHE] Cleared cache for ${symbol}-${days}`);
    } else {
      this.cache.clear();
      loggerService.info(`🗑️ [CACHE] Cleared all cache`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; max: number; ttl: number } {
    return {
      size: this.cache.size,
      max: 100, // Arbitrary max
      ttl: this.CACHE_TTL
    };
  }
}

export const realTimePerformanceService = new RealTimePerformanceService();
