/**
 * 🚀 OPTIMIZED STOCK DATA SERVICE
 * Implements batch processing, intelligent caching, and connection pooling for maximum performance
 */

import axios, { AxiosInstance } from 'axios';
import { redisService } from './redisService';
import { loggerService } from './loggerService';

interface StockData {
  symbol: string;
  current: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  lastUpdate: Date;
  source: string;
}

interface BatchStockData {
  [symbol: string]: StockData;
}

class OptimizedStockDataService {
  private alphaVantageClient: AxiosInstance;
  private finnhubClient: AxiosInstance;
  private fmpClient: AxiosInstance;
  private batchQueue: Set<string> = new Set();
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 50; // Process up to 50 stocks at once
  private readonly BATCH_DELAY = 100; // 100ms delay to collect more requests

  constructor() {
    // Configure HTTP clients with connection pooling and timeouts
    this.alphaVantageClient = axios.create({
      timeout: 5000,
      maxRedirects: 3,
      headers: {
        'User-Agent': 'AI-Capital/1.0',
        'Accept': 'application/json',
        'Connection': 'keep-alive'
      }
    });

    this.finnhubClient = axios.create({
      timeout: 3000,
      maxRedirects: 3,
      headers: {
        'User-Agent': 'AI-Capital/1.0',
        'Accept': 'application/json',
        'Connection': 'keep-alive'
      }
    });

    this.fmpClient = axios.create({
      timeout: 3000,
      maxRedirects: 3,
      headers: {
        'User-Agent': 'AI-Capital/1.0',
        'Accept': 'application/json',
        'Connection': 'keep-alive'
      }
    });
  }

  /**
   * Get single stock data with intelligent caching
   */
  async getStockData(symbol: string): Promise<StockData | null> {
    const cacheKey = `stock:${symbol.toUpperCase()}`;
    
    try {
      // Try cache first
      const cached = await redisService.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        loggerService.info(`🚀 [STOCK CACHE HIT] ${symbol}`);
        return data;
      }

      // Fetch from APIs with fallback chain
      const data = await this.fetchStockDataWithFallback(symbol);
      
      if (data) {
        // Cache for 5 minutes
        await redisService.setex(cacheKey, 300, JSON.stringify(data));
        loggerService.info(`🚀 [STOCK CACHE MISS] ${symbol} - fetched from ${data.source}`);
      }
      
      return data;
    } catch (error) {
      loggerService.error(`❌ [STOCK DATA ERROR] ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get multiple stock data with batch processing
   */
  async getMultipleStockData(symbols: string[]): Promise<Map<string, StockData>> {
    const results = new Map<string, StockData>();
    const uncachedSymbols: string[] = [];

    // Check cache for all symbols first
    for (const symbol of symbols) {
      const cacheKey = `stock:${symbol.toUpperCase()}`;
      try {
        const cached = await redisService.get(cacheKey);
        if (cached) {
          results.set(symbol.toUpperCase(), JSON.parse(cached));
        } else {
          uncachedSymbols.push(symbol.toUpperCase());
        }
      } catch (error) {
        uncachedSymbols.push(symbol.toUpperCase());
      }
    }

    // Batch fetch uncached symbols
    if (uncachedSymbols.length > 0) {
      const batchResults = await this.batchFetchStockData(uncachedSymbols);
      for (const [symbol, data] of batchResults) {
        results.set(symbol, data);
      }
    }

    loggerService.info(`🚀 [BATCH STOCK DATA] Cached: ${symbols.length - uncachedSymbols.length}, Fetched: ${uncachedSymbols.length}`);
    return results;
  }

  /**
   * Batch fetch stock data from multiple APIs
   */
  private async batchFetchStockData(symbols: string[]): Promise<Map<string, StockData>> {
    const results = new Map<string, StockData>();
    
    // Split into chunks to avoid API limits
    const chunks = this.chunkArray(symbols, this.BATCH_SIZE);
    
    for (const chunk of chunks) {
      try {
        // Try Alpha Vantage batch endpoint first
        const alphaVantageData = await this.fetchBatchFromAlphaVantage(chunk);
        for (const [symbol, data] of alphaVantageData) {
          results.set(symbol, data);
          // Cache immediately
          await redisService.setex(`stock:${symbol}`, 300, JSON.stringify(data));
        }
      } catch (error) {
        loggerService.warn(`⚠️ [BATCH ALPHA VANTAGE FAILED]:`, error);
        
        // Fallback to individual fetches with Finnhub
        const promises = chunk.map(async (symbol) => {
          try {
            const data = await this.fetchStockDataWithFallback(symbol);
            if (data) {
              results.set(symbol, data);
              await redisService.setex(`stock:${symbol}`, 300, JSON.stringify(data));
            }
          } catch (err) {
            loggerService.error(`❌ [FALLBACK FETCH FAILED] ${symbol}:`, err);
          }
        });
        
        await Promise.allSettled(promises);
      }
    }

    return results;
  }

  /**
   * Fetch from Alpha Vantage batch endpoint
   */
  private async fetchBatchFromAlphaVantage(symbols: string[]): Promise<Map<string, StockData>> {
    const results = new Map<string, StockData>();
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY_1;
    
    if (!apiKey) {
      throw new Error('Alpha Vantage API key not configured');
    }

    const symbolsParam = symbols.join(',');
    const url = `https://www.alphavantage.co/query?function=BATCH_STOCK_QUOTES&symbols=${symbolsParam}&apikey=${apiKey}`;

    const response = await this.alphaVantageClient.get(url);
    
    if (response.data['Stock Quotes']) {
      for (const quote of response.data['Stock Quotes']) {
        const symbol = quote['1. symbol'];
        const price = parseFloat(quote['2. price']);
        const change = parseFloat(quote['4. change']);
        const changePercent = parseFloat(quote['5. change percent'].replace('%', ''));
        const volume = parseInt(quote['6. volume']);

        if (!isNaN(price)) {
          results.set(symbol, {
            symbol,
            current: price,
            change,
            changePercent,
            volume,
            lastUpdate: new Date(),
            source: 'Alpha Vantage Batch'
          });
        }
      }
    }

    return results;
  }

  /**
   * Fetch stock data with API fallback chain
   */
  private async fetchStockDataWithFallback(symbol: string): Promise<StockData | null> {
    // Try Alpha Vantage first
    try {
      const data = await this.fetchFromAlphaVantage(symbol);
      if (data) return data;
    } catch (error) {
      loggerService.warn(`⚠️ [ALPHA VANTAGE FAILED] ${symbol}:`, error);
    }

    // Try Finnhub
    try {
      const data = await this.fetchFromFinnhub(symbol);
      if (data) return data;
    } catch (error) {
      loggerService.warn(`⚠️ [FINNHUB FAILED] ${symbol}:`, error);
    }

    // Try Financial Modeling Prep
    try {
      const data = await this.fetchFromFMP(symbol);
      if (data) return data;
    } catch (error) {
      loggerService.warn(`⚠️ [FMP FAILED] ${symbol}:`, error);
    }

    return null;
  }

  /**
   * Fetch from Alpha Vantage
   */
  private async fetchFromAlphaVantage(symbol: string): Promise<StockData | null> {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY_1;
    if (!apiKey) return null;

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const response = await this.alphaVantageClient.get(url);

    const quote = response.data['Global Quote'];
    if (quote && quote['05. price']) {
      return {
        symbol,
        current: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        lastUpdate: new Date(),
        source: 'Alpha Vantage'
      };
    }

    return null;
  }

  /**
   * Fetch from Finnhub
   */
  private async fetchFromFinnhub(symbol: string): Promise<StockData | null> {
    const apiKey = process.env.FINNHUB_API_KEY_1;
    if (!apiKey) return null;

    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
    const response = await this.finnhubClient.get(url);

    if (response.data.c) {
      return {
        symbol,
        current: response.data.c,
        change: response.data.d,
        changePercent: response.data.dp,
        volume: response.data.v,
        lastUpdate: new Date(),
        source: 'Finnhub'
      };
    }

    return null;
  }

  /**
   * Fetch from Financial Modeling Prep
   */
  private async fetchFromFMP(symbol: string): Promise<StockData | null> {
    const apiKey = process.env.FMP_API_KEY_1;
    if (!apiKey) return null;

    const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`;
    const response = await this.fmpClient.get(url);

    if (response.data && response.data[0]) {
      const data = response.data[0];
      return {
        symbol,
        current: data.price,
        change: data.change,
        changePercent: data.changesPercentage,
        volume: data.volume,
        marketCap: data.marketCap,
        lastUpdate: new Date(),
        source: 'Financial Modeling Prep'
      };
    }

    return null;
  }

  /**
   * Utility to chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Clear cache for specific symbol
   */
  async clearStockCache(symbol: string): Promise<void> {
    const cacheKey = `stock:${symbol.toUpperCase()}`;
    await redisService.del(cacheKey);
    loggerService.info(`🚀 [CACHE CLEARED] ${symbol}`);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ hits: number; misses: number; total: number }> {
    // This would need to be implemented in Redis service
    return { hits: 0, misses: 0, total: 0 };
  }
}

export const optimizedStockDataService = new OptimizedStockDataService();
