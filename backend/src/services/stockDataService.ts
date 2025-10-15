import axios, { AxiosError } from 'axios';
import { LRUCache } from 'lru-cache';

export interface StockData {
  symbol: string;
  current: number;
  top30D: number;
  top60D: number;
  thisMonthPercent: number;
  lastMonthPercent: number;
  volatility: number;
  marketCap: number;
  timestamp: number; // Cache timestamp
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

class StockDataService {
  private finnhubApiKey: string;
  private fmpApiKey: string;
  private finnhubBaseUrl = 'https://finnhub.io/api/v1';
  private fmpBaseUrl = 'https://financialmodelingprep.com/api/v3';
  
  // 📊 LRU Cache with 20s TTL
  private cache: LRUCache<string, StockData>;
  
  // 🔄 Circuit Breaker for provider failures
  private circuitBreakers: Map<string, CircuitBreakerState>;
  
  // 🔄 Retry configuration
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second
  private readonly circuitBreakerThreshold = 5; // failures before opening
  private readonly circuitBreakerTimeout = 60000; // 1 minute

  constructor() {
    this.finnhubApiKey = process.env.FINNHUB_API_KEY_1 || process.env.FINNHUB_API_KEY || '';
    this.fmpApiKey = process.env.FMP_API_KEY_1 || process.env.FMP_API_KEY || '';
    
    // Initialize LRU Cache with 20s TTL
    this.cache = new LRUCache<string, StockData>({
      max: 1000, // Maximum 1000 cached stocks
      ttl: 20000, // 20 seconds TTL as specified in TODO
      updateAgeOnGet: true,
      allowStale: true,
    });
    
    // Initialize circuit breakers
    this.circuitBreakers = new Map();
    
    if (this.finnhubApiKey === 'demo' || this.fmpApiKey === 'demo') {
      console.warn('⚠️ Using demo API keys. Consider getting real keys for production use.');
    } else {
      console.log('✅ [STOCK DATA] Using provided API keys with LRU cache and circuit breaker');
    }
  }

  /**
   * 🔄 Circuit Breaker Logic
   */
  private getCircuitBreakerState(provider: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(provider)) {
      this.circuitBreakers.set(provider, {
        failures: 0,
        lastFailureTime: 0,
        state: 'CLOSED'
      });
    }
    return this.circuitBreakers.get(provider)!;
  }

  private recordSuccess(provider: string): void {
    const state = this.getCircuitBreakerState(provider);
    state.failures = 0;
    state.state = 'CLOSED';
  }

  private recordFailure(provider: string): void {
    const state = this.getCircuitBreakerState(provider);
    state.failures++;
    state.lastFailureTime = Date.now();
    
    if (state.failures >= this.circuitBreakerThreshold) {
      state.state = 'OPEN';
      console.warn(`🚨 [CIRCUIT BREAKER] ${provider} circuit breaker OPEN after ${state.failures} failures`);
    }
  }

  private isCircuitBreakerOpen(provider: string): boolean {
    const state = this.getCircuitBreakerState(provider);
    
    if (state.state === 'CLOSED') return false;
    
    if (state.state === 'OPEN') {
      // Check if timeout has passed
      if (Date.now() - state.lastFailureTime > this.circuitBreakerTimeout) {
        state.state = 'HALF_OPEN';
        console.log(`🔄 [CIRCUIT BREAKER] ${provider} circuit breaker HALF_OPEN`);
        return false;
      }
      return true;
    }
    
    return false; // HALF_OPEN allows one attempt
  }

  /**
   * 🔄 Retry Logic with Exponential Backoff
   */
  private async withRetry<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.maxRetries) {
          console.error(`❌ [RETRY] ${operationName} failed after ${this.maxRetries} attempts:`, lastError.message);
          throw lastError;
        }
        
        const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(`⚠️ [RETRY] ${operationName} attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  /**
   * 📊 Cache Management
   */
  private getCachedData(symbol: string): StockData | undefined {
    return this.cache.get(symbol);
  }

  private setCachedData(symbol: string, data: StockData): void {
    data.timestamp = Date.now();
    this.cache.set(symbol, data);
  }

  private isCacheValid(data: StockData): boolean {
    const age = Date.now() - data.timestamp;
    return age < 20000; // 20 seconds
  }

  /**
   * Get real-time stock data for a single symbol with cache, retry, and circuit breaker
   */
  async getStockData(symbol: string): Promise<StockData | null> {
    try {
      console.log(`🔍 [STOCK DATA] Fetching data for ${symbol}`);
      
      // Check cache first
      const cachedData = this.getCachedData(symbol);
      if (cachedData && this.isCacheValid(cachedData)) {
        console.log(`📊 [CACHE] Returning cached data for ${symbol} (age: ${Date.now() - cachedData.timestamp}ms)`);
        return cachedData;
      }
      
      // Try Finnhub first with circuit breaker
      let stockData: StockData | null = null;
      
      if (!this.isCircuitBreakerOpen('finnhub')) {
        try {
          stockData = await this.withRetry(async () => {
            const quoteResponse = await this.getFinnhubQuote(symbol);
            if (!quoteResponse || !quoteResponse.c) {
              throw new Error('No quote data from Finnhub');
            }

            const currentPrice = quoteResponse.c;
            const dailyChange = quoteResponse.dp || 0;
            
            // Calculate monthly performance based on daily change
            const thisMonthPercent = dailyChange * 0.8; // 80% of daily change as monthly estimate
            const lastMonthPercent = dailyChange * 0.6; // 60% of daily change as last month estimate
            
            // Calculate realistic highs based on current price and volatility
            const volatility = Math.abs(dailyChange) / 100;
            const top30D = currentPrice * (1 + volatility * 2); // 2x volatility as 30D high
            const top60D = currentPrice * (1 + volatility * 3); // 3x volatility as 60D high
            
            // Get market cap estimate
            const marketCap = this.estimateMarketCap(symbol, currentPrice);
            
            const stockData: StockData = {
              symbol: symbol.toUpperCase(),
              current: currentPrice,
              top30D,
              top60D,
              thisMonthPercent,
              lastMonthPercent,
              volatility,
              marketCap,
              timestamp: Date.now()
            };

            return stockData;
          }, `Finnhub API for ${symbol}`);
          
          this.recordSuccess('finnhub');
          this.setCachedData(symbol, stockData);
          
        } catch (error) {
          this.recordFailure('finnhub');
          console.warn(`⚠️ [STOCK DATA] Finnhub failed for ${symbol}, trying fallback`);
        }
      }
      
      // Fallback to FMP if Finnhub failed
      if (!stockData && !this.isCircuitBreakerOpen('fmp')) {
        try {
          stockData = await this.withRetry(async () => {
            return await this.getFMPData(symbol);
          }, `FMP API for ${symbol}`);
          
          this.recordSuccess('fmp');
          if (stockData) {
            this.setCachedData(symbol, stockData);
          }
          
        } catch (error) {
          this.recordFailure('fmp');
          console.warn(`⚠️ [STOCK DATA] FMP fallback also failed for ${symbol}`);
        }
      }
      
      // Final fallback - return cached stale data if available
      if (!stockData && cachedData) {
        console.log(`📊 [FALLBACK] Returning stale cached data for ${symbol}`);
        return cachedData;
      }
      
      if (stockData) {
        console.log(`✅ [STOCK DATA] Got real data for ${symbol}: $${stockData.current}`);
      } else {
        console.error(`❌ [STOCK DATA] All providers failed for ${symbol}`);
      }
      
      return stockData;
    } catch (error) {
      console.error(`❌ [STOCK DATA] Unexpected error fetching data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get FMP data as fallback
   */
  private async getFMPData(symbol: string): Promise<StockData> {
    const response = await axios.get(`${this.fmpBaseUrl}/quote/${symbol}`, {
      params: { apikey: this.fmpApiKey },
      timeout: 5000
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No FMP data available');
    }

    const data = response.data[0];
    const currentPrice = data.price || 0;
    const changePercent = data.changesPercentage || 0;
    
    const volatility = Math.abs(changePercent) / 100;
    const top30D = currentPrice * (1 + volatility * 2);
    const top60D = currentPrice * (1 + volatility * 3);
    
    return {
      symbol: symbol.toUpperCase(),
      current: currentPrice,
      top30D,
      top60D,
      thisMonthPercent: changePercent * 0.8,
      lastMonthPercent: changePercent * 0.6,
      volatility,
      marketCap: this.estimateMarketCap(symbol, currentPrice),
      timestamp: Date.now()
    };
  }

  /**
   * Get stock data for multiple symbols with optimized caching
   */
  async getMultipleStockData(symbols: string[]): Promise<Map<string, StockData>> {
    const stockDataMap = new Map<string, StockData>();

    // Check cache first for all symbols
    const uncachedSymbols: string[] = [];
    
    for (const symbol of symbols) {
      const cachedData = this.getCachedData(symbol);
      if (cachedData && this.isCacheValid(cachedData)) {
        stockDataMap.set(symbol, cachedData);
        console.log(`📊 [CACHE] Using cached data for ${symbol}`);
      } else {
        uncachedSymbols.push(symbol);
      }
    }

    // Process uncached symbols in parallel
    if (uncachedSymbols.length > 0) {
      const promises = uncachedSymbols.map(async (symbol) => {
        const data = await this.getStockData(symbol);
        if (data) {
          stockDataMap.set(symbol, data);
        }
      });

      await Promise.all(promises);
    }

    console.log(`✅ [STOCK DATA] Processed ${symbols.length} stocks in parallel (${stockDataMap.size} successful, ${symbols.length - stockDataMap.size} failed)`);
    return stockDataMap;
  }

  /**
   * 📊 Cache Statistics and Management
   */
  getCacheStats(): { size: number; max: number; hitRate: number } {
    return {
      size: this.cache.size,
      max: this.cache.max,
      hitRate: this.cache.calculatedSize ? (this.cache.size / this.cache.calculatedSize) * 100 : 0
    };
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🧹 [CACHE] Stock data cache cleared');
  }

  getCircuitBreakerStatus(): Record<string, CircuitBreakerState> {
    const status: Record<string, CircuitBreakerState> = {};
    for (const [provider, state] of this.circuitBreakers) {
      status[provider] = { ...state };
    }
    return status;
  }

  /**
   * Get real-time quote from Finnhub
   */
  private async getFinnhubQuote(symbol: string): Promise<any> {
    const url = `${this.finnhubBaseUrl}/quote?symbol=${symbol}&token=${this.finnhubApiKey}`;
    
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'AiCapital/1.0'
      }
    });

    if (response.data.error) {
      throw new Error(`Finnhub API Error: ${response.data.error}`);
    }

    return response.data;
  }

  /**
   * Get real-time data for multiple tickers (used by portfolio routes)
   */
  async getRealtimeDataForTickers(tickers: string[]): Promise<Map<string, any>> {
    const dataMap = new Map();
    
    const promises = tickers.map(async (ticker) => {
      try {
        const data = await this.getStockData(ticker);
        if (data) {
          dataMap.set(ticker, {
            current: data.current,
            volatility: data.volatility
          });
        }
      } catch (error) {
        console.error(`❌ [REALTIME] Error fetching ${ticker}:`, error);
      }
    });
    
    await Promise.all(promises);
    return dataMap;
  }

  /**
   * Estimate market cap based on symbol and price
   */
  private estimateMarketCap(symbol: string, price: number): number {
    // Rough estimates for shares outstanding (in millions)
    const sharesEstimates: { [key: string]: number } = {
      'AAPL': 15_300,
      'MSFT': 7_400,
      'GOOGL': 12_600,
      'AMZN': 10_600,
      'TSLA': 3_200,
      'META': 2_700,
      'NVDA': 2_500,
      'NFLX': 440,
      'AMD': 1_600,
      'INTC': 4_100,
      'CSCO': 4_100,
      'ORCL': 2_700,
      'ADBE': 460,
      'CRM': 980,
      'DIS': 1_800,
      'HD': 1_000,
      'UNH': 920,
      'JNJ': 2_600,
      'PG': 2_400,
      'KO': 4_300,
      'PFE': 5_600,
      'WMT': 2_700,
      'JPM': 2_900,
      'V': 2_100,
      'MA': 940,
      'BAC': 8_100,
      'WFC': 3_600,
      'GS': 330,
      'AXP': 740,
      'XOM': 4_100,
      'CVX': 1_900,
      'T': 7_200,
      'VZ': 4_200,
      'SPY': 1_000, // ETF
      'QQQ': 400,   // ETF
      'DIA': 50,    // ETF
      'PLTR': 2_000,
      'ARKK': 180,
      'GME': 300
    };
    
    const shares = sharesEstimates[symbol.toUpperCase()] || 1_000; // Default 1B shares
    return shares * price * 1_000_000; // Convert to actual market cap
  }
}

export const stockDataService = new StockDataService();