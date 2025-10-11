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
  // 🔄 Smart API Key Rotation System
  private alphaVantageKeys: string[];
  private currentAlphaVantageIndex: number = 0;
  private keyUsageCount: Map<string, number> = new Map();
  private keyLastUsed: Map<string, number> = new Map();
  private keyBlacklist: Set<string> = new Set(); // Temporarily blacklist failed keys
  
  private finnhubApiKeys: string[];
  private currentFinnhubIndex: number;
  private fmpApiKeys: string[];
  private currentFmpIndex: number;
  
  // 📊 LRU Cache with 10 minute TTL (as requested by user)
  private cache: LRUCache<string, StockMetrics>;
  
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds
  private readonly DAYS_TO_FETCH = 90; // 90 days of data (like Google Sheet)
  private readonly MAX_CALLS_PER_KEY_PER_MINUTE = 5; // Alpha Vantage limit
  private readonly BLACKLIST_DURATION = 5 * 60 * 1000; // 5 minutes blacklist

  constructor() {
    // 🔑 Multiple Alpha Vantage API Keys for rotation
    this.alphaVantageKeys = [
      process.env.ALPHA_VANTAGE_API_KEY_1 || '1A7DIQSD5MV44PWM',
      process.env.ALPHA_VANTAGE_API_KEY_2 || 'YY3YQ3UYVJHNPOIY', 
      process.env.ALPHA_VANTAGE_API_KEY_3 || 'PSQ2LTRVWO99SZN0',
      process.env.ALPHA_VANTAGE_API_KEY_4 || 'WR0EI5H42PWWAUJ0'
    ].filter(key => key && key !== 'demo'); // Remove any invalid keys
    
    // Multiple Finnhub keys for rotation
    this.finnhubApiKeys = [
      process.env.FINNHUB_API_KEY_1 || 'd3crne9r01qmnfgf0q70d3crne9r01qmnfgf0q7g',
      process.env.FINNHUB_API_KEY_2 || 'd3l2ggpr01qp3ucq6850d3l2ggpr01qp3ucq685g'
    ];
    this.currentFinnhubIndex = 0;
    
    // Multiple FMP keys for rotation  
    this.fmpApiKeys = [
      process.env.FMP_API_KEY_1 || 'DPQXLdd8vdBNFA1tl5HWXt8Fd7D0Lw6G',
      process.env.FMP_API_KEY_2 || 'dly9ZAPDVSkLZ9173zNLPuTIfDpKDtFi'
    ];
    this.currentFmpIndex = 0;
    
    // Initialize LRU Cache with 10 minute TTL
    this.cache = new LRUCache<string, StockMetrics>({
      max: 1000, // Maximum 1000 cached stocks
      ttl: this.CACHE_TTL,
      updateAgeOnGet: true,
      allowStale: false, // Never return stale data
    });
    
    // Initialize key usage tracking
    this.alphaVantageKeys.forEach(key => {
      this.keyUsageCount.set(key, 0);
      this.keyLastUsed.set(key, 0);
    });
    
    loggerService.info(`✅ [GOOGLE FINANCE FORMULAS] Service initialized with ${this.alphaVantageKeys.length} Alpha Vantage keys and 10-minute cache`);
    loggerService.info(`🔑 [API KEYS] Available: Alpha Vantage (${this.alphaVantageKeys.length}), Finnhub (1), FMP (1)`);
  }

  /**
   * 🔄 Smart API Key Rotation - Get next available Alpha Vantage key
   */
  private getNextAlphaVantageKey(): string | null {
    if (this.alphaVantageKeys.length === 0) {
      loggerService.warn('⚠️ [API KEYS] No Alpha Vantage keys available');
      return null;
    }

    const now = Date.now();
    
    // Clean up expired blacklisted keys
    for (const key of this.keyBlacklist) {
      const lastUsed = this.keyLastUsed.get(key) || 0;
      if (now - lastUsed > this.BLACKLIST_DURATION) {
        this.keyBlacklist.delete(key);
        loggerService.info(`🔄 [API KEYS] Restored blacklisted key: ${key.substring(0, 8)}...`);
      }
    }

    // Find the best available key
    let bestKey: string | null = null;
    let bestScore = -1;

    for (const key of this.alphaVantageKeys) {
      if (this.keyBlacklist.has(key)) continue;

      const lastUsed = this.keyLastUsed.get(key) || 0;
      const usageCount = this.keyUsageCount.get(key) || 0;
      const timeSinceLastUse = now - lastUsed;
      
      // Reset usage count if more than 1 minute has passed
      if (timeSinceLastUse > 60 * 1000) {
        this.keyUsageCount.set(key, 0);
      }
      
      const currentUsage = this.keyUsageCount.get(key) || 0;
      
      // Skip if key has hit rate limit
      if (currentUsage >= this.MAX_CALLS_PER_KEY_PER_MINUTE && timeSinceLastUse < 60 * 1000) {
        continue;
      }
      
      // Score: prefer keys with lower usage and longer time since last use
      const score = (60 * 1000 - Math.min(timeSinceLastUse, 60 * 1000)) + (currentUsage * 10000);
      
      if (bestKey === null || score < bestScore) {
        bestKey = key;
        bestScore = score;
      }
    }

    if (bestKey) {
      // Update usage tracking
      this.keyUsageCount.set(bestKey, (this.keyUsageCount.get(bestKey) || 0) + 1);
      this.keyLastUsed.set(bestKey, now);
      
      const usage = this.keyUsageCount.get(bestKey) || 0;
      loggerService.info(`🔑 [API KEYS] Using Alpha Vantage key: ${bestKey.substring(0, 8)}... (usage: ${usage}/${this.MAX_CALLS_PER_KEY_PER_MINUTE})`);
    } else {
      loggerService.warn('⚠️ [API KEYS] All Alpha Vantage keys are rate limited or blacklisted');
    }

    return bestKey;
  }

  /**
   * 🚫 Blacklist a failed API key temporarily
   */
  private blacklistKey(key: string, reason: string): void {
    this.keyBlacklist.add(key);
    this.keyLastUsed.set(key, Date.now());
    loggerService.warn(`🚫 [API KEYS] Blacklisted key ${key.substring(0, 8)}... for ${this.BLACKLIST_DURATION / 1000}s: ${reason}`);
  }

  /**
   * 🔄 Get next Finnhub API key
   */
  private getNextFinnhubKey(): string {
    const key = this.finnhubApiKeys[this.currentFinnhubIndex];
    this.currentFinnhubIndex = (this.currentFinnhubIndex + 1) % this.finnhubApiKeys.length;
    return key;
  }

  /**
   * 🔄 Get next FMP API key
   */
  private getNextFmpKey(): string {
    const key = this.fmpApiKeys[this.currentFmpIndex];
    this.currentFmpIndex = (this.currentFmpIndex + 1) % this.fmpApiKeys.length;
    return key;
  }

  /**
   * 📊 Main method: Get stock metrics (replicates Google Sheet logic)
   * This is the equivalent of your Google Sheet formula that fetches 90 days of data
   */
  async getStockMetrics(symbol: string): Promise<StockMetrics | null> {
    try {
      loggerService.info(`🔍 [GOOGLE FINANCE FORMULAS] Fetching metrics for ${symbol}`);
      
      // Check cache first
      const cachedData = this.cache.get(symbol);
      if (cachedData) {
        const age = Date.now() - cachedData.timestamp;
        loggerService.info(`📊 [CACHE HIT] Returning cached data for ${symbol} (age: ${Math.floor(age / 1000)}s)`);
        return cachedData;
      }
      
      // Try Alpha Vantage first with smart key rotation (most reliable for historical data)
      let metrics: StockMetrics | null = null;
      
      // Try multiple Alpha Vantage keys if needed
      for (let attempt = 0; attempt < this.alphaVantageKeys.length && !metrics; attempt++) {
        try {
          metrics = await this.fetchFromAlphaVantage(symbol);
          if (metrics) {
            loggerService.info(`✅ [ALPHA VANTAGE] Got metrics for ${symbol} on attempt ${attempt + 1}`);
            break;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          loggerService.warn(`⚠️ [ALPHA VANTAGE] Attempt ${attempt + 1} failed for ${symbol}: ${errorMsg}`);
          
          // If it's a rate limit error, try next key
          if (errorMsg.includes('rate limit') || errorMsg.includes('429') || errorMsg.includes('quota')) {
            continue; // Try next key
          } else {
            break; // Other errors, don't retry with Alpha Vantage
          }
        }
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
      
      // If all APIs fail, return null (decision engine will handle fallback)
      if (!metrics) {
        loggerService.warn(`⚠️ [GOOGLE FINANCE] All APIs failed for ${symbol}, returning null for fallback handling`);
        return null;
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
   * Uses smart key rotation to avoid rate limits
   */
  private async fetchFromAlphaVantage(symbol: string): Promise<StockMetrics | null> {
    const apiKey = this.getNextAlphaVantageKey();
    
    if (!apiKey) {
      throw new Error('No Alpha Vantage API keys available');
    }

    try {
      loggerService.info(`🔍 [ALPHA VANTAGE] Fetching ${symbol} with key ${apiKey.substring(0, 8)}...`);
      
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: symbol,
          outputsize: 'full', // Get full historical data
          apikey: apiKey
        },
        timeout: 15000
      });

      // Check for API errors
      if (response.data['Error Message']) {
        const errorMsg = response.data['Error Message'];
        loggerService.warn(`⚠️ [ALPHA VANTAGE] API Error for ${symbol}: ${errorMsg}`);
        
        if (errorMsg.includes('rate limit') || errorMsg.includes('premium')) {
          this.blacklistKey(apiKey, 'Rate limit exceeded');
        }
        
        throw new Error(`Alpha Vantage API error: ${errorMsg}`);
      }

      if (response.data['Note']) {
        const note = response.data['Note'];
        loggerService.warn(`⚠️ [ALPHA VANTAGE] API Note for ${symbol}: ${note}`);
        
        if (note.includes('rate limit') || note.includes('call frequency')) {
          this.blacklistKey(apiKey, 'Rate limit note received');
          throw new Error(`Alpha Vantage rate limit: ${note}`);
        }
      }

      if (!response.data['Time Series (Daily)']) {
        loggerService.warn(`⚠️ [ALPHA VANTAGE] No time series data for ${symbol}`);
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

      loggerService.info(`✅ [ALPHA VANTAGE] Successfully fetched ${prices.length} days of data for ${symbol}`);
      
      // Calculate metrics
      return this.calculateMetrics(symbol, prices, 'alpha_vantage');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if it's a rate limit error and blacklist the key
      if (errorMsg.includes('rate limit') || errorMsg.includes('429') || errorMsg.includes('quota')) {
        this.blacklistKey(apiKey, `Rate limit error: ${errorMsg}`);
      }
      
      throw new Error(`Alpha Vantage API error: ${errorMsg}`);
    }
  }

  /**
   * 📊 Fetch from Finnhub (Fallback 1) - with key rotation
   */
  private async fetchFromFinnhub(symbol: string): Promise<StockMetrics | null> {
    const apiKey = this.getNextFinnhubKey();
    
    try {
      loggerService.info(`🔍 [FINNHUB] Fetching ${symbol} with key ${apiKey.substring(0, 8)}...`);
      
      // Get current time and 90 days ago
      const endDate = Math.floor(Date.now() / 1000);
      const startDate = endDate - (this.DAYS_TO_FETCH * 24 * 60 * 60);
      
      const response = await axios.get(`https://finnhub.io/api/v1/stock/candle`, {
        params: {
          symbol: symbol,
          resolution: 'D', // Daily data
          from: startDate,
          to: endDate,
          token: apiKey
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
   * 📊 Fetch from FMP (Fallback 2) - with key rotation
   */
  private async fetchFromFMP(symbol: string): Promise<StockMetrics | null> {
    const apiKey = this.getNextFmpKey();
    
    try {
      loggerService.info(`🔍 [FMP] Fetching ${symbol} with key ${apiKey.substring(0, 8)}...`);
      
      const response = await axios.get(`https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}`, {
        params: {
          apikey: apiKey
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
        if (metrics) {
          results.set(symbol, metrics);
        }
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
   * 🔑 API Key Statistics
   */
  getApiKeyStats(): {
    totalKeys: number;
    availableKeys: number;
    blacklistedKeys: number;
    keyUsage: Array<{
      key: string;
      usage: number;
      lastUsed: string;
      isBlacklisted: boolean;
    }>;
  } {
    const stats = {
      totalKeys: this.alphaVantageKeys.length,
      availableKeys: 0,
      blacklistedKeys: this.keyBlacklist.size,
      keyUsage: [] as Array<{
        key: string;
        usage: number;
        lastUsed: string;
        isBlacklisted: boolean;
      }>
    };

    for (const key of this.alphaVantageKeys) {
      const usage = this.keyUsageCount.get(key) || 0;
      const lastUsed = this.keyLastUsed.get(key) || 0;
      const isBlacklisted = this.keyBlacklist.has(key);
      
      if (!isBlacklisted && usage < this.MAX_CALLS_PER_KEY_PER_MINUTE) {
        stats.availableKeys++;
      }

      stats.keyUsage.push({
        key: key.substring(0, 8) + '...',
        usage,
        lastUsed: lastUsed > 0 ? new Date(lastUsed).toISOString() : 'Never',
        isBlacklisted
      });
    }

    return stats;
  }

  /**
   * 🔄 Reset API key blacklist (for admin use)
   */
  resetBlacklist(): void {
    this.keyBlacklist.clear();
    this.alphaVantageKeys.forEach(key => {
      this.keyUsageCount.set(key, 0);
    });
    loggerService.info('🔄 [API KEYS] Blacklist reset and usage counters cleared');
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
