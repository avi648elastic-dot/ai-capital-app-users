import axios from 'axios';
import { LRUCache } from 'lru-cache';
import { loggerService } from './loggerService';

/**
 * 📊 Google Finance Formulas Service
 * Replicates Google Sheet logic: =TRANSPOSE(QUERY(GOOGLEFINANCE(A2,"price",TODAY()-90,TODAY(),"DAILY"),"select Col2 offset 1",0))
 * Fetches 90 days of price data and extracts: Current, TOP 30D, TOP 60D, % This Month, % Last Month
 */

export interface StockMetrics {
  symbol: string;
  current: number;          // Current price (latest)
  top30D: number;           // Highest price in last 30 days
  top60D: number;           // Highest price in last 60 days
  thisMonthPercent: number; // % change this month
  lastMonthPercent: number; // % change last month
  volatility: number;       // Standard deviation of daily returns
  marketCap: number;        // Estimated market cap
  timestamp: number;        // Cache timestamp
  dataSource: 'alpha_vantage' | 'finnhub' | 'fmp'; // Which API provided the data
}

interface DailyPrice {
  date: string;
  price: number;
}

class GoogleFinanceFormulasService {
  private alphaVantageApiKey: string;
  private finnhubApiKey: string;
  private fmpApiKey: string;
  
  // 📊 LRU Cache with 10 minute TTL (as requested by user)
  private cache: LRUCache<string, StockMetrics>;
  
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds
  private readonly DAYS_TO_FETCH = 90; // 90 days of data (like Google Sheet)

  constructor() {
    this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
    this.finnhubApiKey = process.env.FINNHUB_API_KEY || 'd3crne9r01qmnfgf0q70d3crne9r01qmnfgf0q7g';
    this.fmpApiKey = process.env.FMP_API_KEY || 'DPQXLdd8vdBNFA1tl5HWXt8Fd7D0Lw6G';
    
    // Initialize LRU Cache with 10 minute TTL
    this.cache = new LRUCache<string, StockMetrics>({
      max: 1000, // Maximum 1000 cached stocks
      ttl: this.CACHE_TTL,
      updateAgeOnGet: true,
      allowStale: false, // Never return stale data
    });
    
    loggerService.info('✅ [GOOGLE FINANCE FORMULAS] Service initialized with 10-minute cache');
  }

  /**
   * 📊 Main method: Get stock metrics (replicates Google Sheet logic)
   * This is the equivalent of your Google Sheet formula that fetches 90 days of data
   */
  async getStockMetrics(symbol: string): Promise<StockMetrics> {
    try {
      loggerService.info(`🔍 [GOOGLE FINANCE FORMULAS] Fetching metrics for ${symbol}`);
      
      // Check cache first
      const cachedData = this.cache.get(symbol);
      if (cachedData) {
        const age = Date.now() - cachedData.timestamp;
        loggerService.info(`📊 [CACHE HIT] Returning cached data for ${symbol} (age: ${Math.floor(age / 1000)}s)`);
        return cachedData;
      }
      
      // Try Alpha Vantage first (most reliable for historical data)
      let metrics: StockMetrics | null = null;
      
      try {
        metrics = await this.fetchFromAlphaVantage(symbol);
        if (metrics) {
          loggerService.info(`✅ [ALPHA VANTAGE] Got metrics for ${symbol}`);
        }
      } catch (error) {
        loggerService.warn(`⚠️ [ALPHA VANTAGE] Failed for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Fallback to Finnhub if Alpha Vantage fails
      if (!metrics) {
        try {
          metrics = await this.fetchFromFinnhub(symbol);
          if (metrics) {
            loggerService.info(`✅ [FINNHUB] Got metrics for ${symbol}`);
          }
        } catch (error) {
          loggerService.warn(`⚠️ [FINNHUB] Failed for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Fallback to FMP if both fail
      if (!metrics) {
        try {
          metrics = await this.fetchFromFMP(symbol);
          if (metrics) {
            loggerService.info(`✅ [FMP] Got metrics for ${symbol}`);
          }
        } catch (error) {
          loggerService.warn(`⚠️ [FMP] Failed for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // If all APIs fail, throw error (as requested by user)
      if (!metrics) {
        throw new Error(`❌ Failed to fetch data for ${symbol} from all providers (Alpha Vantage, Finnhub, FMP). Please check API keys and stock symbol.`);
      }
      
      // Cache the result
      this.cache.set(symbol, metrics);
      
      return metrics;
      
    } catch (error) {
      loggerService.error(`❌ [GOOGLE FINANCE FORMULAS] Error fetching metrics for ${symbol}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error; // Re-throw to show error to user
    }
  }

  /**
   * 📊 Fetch from Alpha Vantage (Primary source - most reliable for historical data)
   */
  private async fetchFromAlphaVantage(symbol: string): Promise<StockMetrics | null> {
    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: symbol,
          outputsize: 'full', // Get full historical data
          apikey: this.alphaVantageApiKey
        },
        timeout: 15000
      });

      if (!response.data['Time Series (Daily)']) {
        return null;
      }

      const timeSeries = response.data['Time Series (Daily)'];
      const prices: DailyPrice[] = [];
      
      // Sort dates (most recent first)
      const sortedDates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      // Take only 90 days (like Google Sheet formula)
      const recentDates = sortedDates.slice(0, this.DAYS_TO_FETCH);
      
      for (const date of recentDates) {
        const dayData = timeSeries[date];
        prices.push({
          date: date,
          price: parseFloat(dayData['4. close'])
        });
      }

      // Calculate metrics
      return this.calculateMetrics(symbol, prices, 'alpha_vantage');
      
    } catch (error) {
      throw new Error(`Alpha Vantage API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 📊 Fetch from Finnhub (Fallback 1)
   */
  private async fetchFromFinnhub(symbol: string): Promise<StockMetrics | null> {
    try {
      // Get current time and 90 days ago
      const endDate = Math.floor(Date.now() / 1000);
      const startDate = endDate - (this.DAYS_TO_FETCH * 24 * 60 * 60);
      
      const response = await axios.get(`https://finnhub.io/api/v1/stock/candle`, {
        params: {
          symbol: symbol,
          resolution: 'D', // Daily data
          from: startDate,
          to: endDate,
          token: this.finnhubApiKey
        },
        timeout: 10000
      });

      if (!response.data || response.data.s !== 'ok' || !response.data.c) {
        return null;
      }

      const prices: DailyPrice[] = [];
      const timestamps = response.data.t;
      const closePrices = response.data.c;
      
      for (let i = 0; i < timestamps.length; i++) {
        const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
        prices.push({
          date: date,
          price: closePrices[i]
        });
      }

      // Sort by date (most recent first)
      prices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return this.calculateMetrics(symbol, prices, 'finnhub');
      
    } catch (error) {
      throw new Error(`Finnhub API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 📊 Fetch from FMP (Fallback 2)
   */
  private async fetchFromFMP(symbol: string): Promise<StockMetrics | null> {
    try {
      const response = await axios.get(`https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}`, {
        params: {
          apikey: this.fmpApiKey
        },
        timeout: 10000
      });

      if (!response.data || !response.data.historical) {
        return null;
      }

      const prices: DailyPrice[] = response.data.historical
        .slice(0, this.DAYS_TO_FETCH)
        .map((day: any) => ({
          date: day.date,
          price: day.close
        }));

      return this.calculateMetrics(symbol, prices, 'fmp');
      
    } catch (error) {
      throw new Error(`FMP API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 📊 Calculate metrics from price data (replicates Google Sheet formulas)
   * This extracts: Current, TOP 30D, TOP 60D, % This Month, % Last Month
   */
  private calculateMetrics(symbol: string, prices: DailyPrice[], dataSource: 'alpha_vantage' | 'finnhub' | 'fmp'): StockMetrics {
    if (prices.length === 0) {
      throw new Error(`No price data available for ${symbol}`);
    }

    // Current price (latest)
    const current = prices[0].price;

    // TOP 30D (highest price in last 30 days)
    const last30Days = prices.slice(0, Math.min(30, prices.length));
    const top30D = Math.max(...last30Days.map(p => p.price));

    // TOP 60D (highest price in last 60 days)
    const last60Days = prices.slice(0, Math.min(60, prices.length));
    const top60D = Math.max(...last60Days.map(p => p.price));

    // % This Month (current month performance)
    const thisMonthPrices = this.getThisMonthPrices(prices);
    const thisMonthPercent = thisMonthPrices.length > 1
      ? ((thisMonthPrices[0].price - thisMonthPrices[thisMonthPrices.length - 1].price) / thisMonthPrices[thisMonthPrices.length - 1].price) * 100
      : 0;

    // % Last Month (previous month performance)
    const lastMonthPrices = this.getLastMonthPrices(prices);
    const lastMonthPercent = lastMonthPrices.length > 1
      ? ((lastMonthPrices[0].price - lastMonthPrices[lastMonthPrices.length - 1].price) / lastMonthPrices[lastMonthPrices.length - 1].price) * 100
      : 0;

    // Volatility (standard deviation of daily returns)
    const volatility = this.calculateVolatility(prices);

    // Market cap (estimated)
    const marketCap = this.estimateMarketCap(symbol, current);

    return {
      symbol: symbol.toUpperCase(),
      current,
      top30D,
      top60D,
      thisMonthPercent,
      lastMonthPercent,
      volatility,
      marketCap,
      timestamp: Date.now(),
      dataSource
    };
  }

  /**
   * Get prices for current month
   */
  private getThisMonthPrices(prices: DailyPrice[]): DailyPrice[] {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return prices.filter(p => {
      const date = new Date(p.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
  }

  /**
   * Get prices for last month
   */
  private getLastMonthPrices(prices: DailyPrice[]): DailyPrice[] {
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    return prices.filter(p => {
      const date = new Date(p.date);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });
  }

  /**
   * Calculate volatility (standard deviation of daily returns)
   */
  private calculateVolatility(prices: DailyPrice[]): number {
    if (prices.length < 2) return 0;

    const returns: number[] = [];
    for (let i = 0; i < prices.length - 1; i++) {
      const dailyReturn = (prices[i].price - prices[i + 1].price) / prices[i + 1].price;
      returns.push(dailyReturn);
    }

    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);

    return volatility;
  }

  /**
   * Estimate market cap based on symbol and price
   */
  private estimateMarketCap(symbol: string, price: number): number {
    // Rough estimates for shares outstanding (in millions)
    const sharesEstimates: { [key: string]: number } = {
      'AAPL': 15_300, 'MSFT': 7_400, 'GOOGL': 12_600, 'AMZN': 10_600, 'TSLA': 3_200,
      'META': 2_700, 'NVDA': 2_500, 'NFLX': 440, 'AMD': 1_600, 'INTC': 4_100,
      'QS': 430, 'UEC': 234, 'HIMX': 174, 'ONCY': 140, 'AQST': 74, 'AEG': 206, 'HST': 682
    };
    
    const shares = sharesEstimates[symbol.toUpperCase()] || 1_000; // Default 1B shares
    return shares * price * 1_000_000; // Convert to actual market cap
  }

  /**
   * 📊 Get metrics for multiple stocks in parallel
   */
  async getMultipleStockMetrics(symbols: string[]): Promise<Map<string, StockMetrics>> {
    loggerService.info(`🔍 [GOOGLE FINANCE FORMULAS] Fetching metrics for ${symbols.length} stocks`);
    
    const results = new Map<string, StockMetrics>();
    const errors: string[] = [];

    // Process in parallel
    const promises = symbols.map(async (symbol) => {
      try {
        const metrics = await this.getStockMetrics(symbol);
        results.set(symbol, metrics);
      } catch (error) {
        const errorMsg = `${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        loggerService.error(`❌ [GOOGLE FINANCE FORMULAS] Failed to fetch ${symbol}`, { error: errorMsg });
      }
    });

    await Promise.all(promises);

    loggerService.info(`✅ [GOOGLE FINANCE FORMULAS] Successfully fetched ${results.size}/${symbols.length} stocks`);
    
    if (errors.length > 0) {
      loggerService.warn(`⚠️ [GOOGLE FINANCE FORMULAS] Failed stocks: ${errors.join(', ')}`);
    }

    return results;
  }

  /**
   * 📊 Cache Statistics
   */
  getCacheStats(): { size: number; max: number; ttl: number } {
    return {
      size: this.cache.size,
      max: this.cache.max,
      ttl: this.CACHE_TTL
    };
  }

  /**
   * 🧹 Clear cache (for testing)
   */
  clearCache(): void {
    this.cache.clear();
    loggerService.info('🧹 [GOOGLE FINANCE FORMULAS] Cache cleared');
  }
}

export const googleFinanceFormulasService = new GoogleFinanceFormulasService();
