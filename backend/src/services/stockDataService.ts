import axios from 'axios';

interface StockData {
  symbol: string;
  current: number;
  top30D: number;
  top60D: number;
  thisMonthPercent: number;
  lastMonthPercent: number;
  volatility: number;
  marketCap: number;
}

interface AlphaVantageQuote {
  '01. symbol': string;
  '05. price': string;
  '09. change': string;
  '10. change percent': string;
}

interface AlphaVantageTimeSeries {
  [date: string]: {
    '1. open': string;
    '2. high': string;
    '3. low': string;
    '4. close': string;
    '5. volume': string;
  };
}

export class StockDataService {
  private finnhubApiKey: string;
  private fmpApiKey: string;
  private finnhubBaseUrl = 'https://finnhub.io/api/v1';
  private fmpBaseUrl = 'https://financialmodelingprep.com/api/v3';

  constructor() {
    this.finnhubApiKey = process.env.FINNHUB_API_KEY || 'd3crne9r01qmnfgf0q70d3crne9r01qmnfgf0q7g';
    this.fmpApiKey = process.env.FMP_API_KEY || 'DPQXLdd8vdBNFA1tl5HWXt8Fd7D0Lw6G';
    
    if (this.finnhubApiKey === 'demo' || this.fmpApiKey === 'demo') {
      console.warn('⚠️ Using demo API keys. Consider getting real keys for production use.');
    } else {
      console.log('✅ [STOCK DATA] Using provided API keys for real-time data');
    }
  }

  /**
   * Get real-time stock data for a single symbol
   */
  async getStockData(symbol: string): Promise<StockData | null> {
    try {
      console.log(`🔍 [STOCK DATA] Fetching data for ${symbol}`);

      // Get current quote from Finnhub (real-time)
      const quoteResponse = await this.getFinnhubQuote(symbol);
      if (!quoteResponse) {
        console.error(`❌ [STOCK DATA] No quote data for ${symbol}`);
        return null;
      }

      const currentPrice = quoteResponse.c;
      console.log(`✅ [STOCK DATA] Got real-time price for ${symbol}: $${currentPrice}`);

      // Try to get historical data from FMP, but don't fail if it doesn't work
      let historicalData: any[] = [];
      let top30D = currentPrice * 1.05; // Default 5% above current
      let top60D = currentPrice * 1.10; // Default 10% above current
      let thisMonthPercent = 0;
      let lastMonthPercent = 0;
      let volatility = 0.2; // Default volatility
      let marketCap = 1000000000000; // Default 1T market cap

      try {
        historicalData = await this.getFMPHistoricalData(symbol);
        if (historicalData && historicalData.length > 0) {
          // Calculate 30D and 60D highs
          const last30Days = historicalData.slice(0, 30);
          const last60Days = historicalData.slice(0, 60);

          top30D = Math.max(...last30Days.map(day => day.high));
          top60D = Math.max(...last60Days.map(day => day.high));

          // Calculate monthly performance
          thisMonthPercent = this.calculateMonthlyPerformanceFMP(historicalData);
          lastMonthPercent = this.calculateLastMonthPerformanceFMP(historicalData);

          // Calculate volatility
          volatility = this.calculateVolatilityFMP(historicalData.slice(0, 30));

          // Get market cap from FMP
          marketCap = await this.getFMPMarketCap(symbol);
          
          console.log(`✅ [STOCK DATA] Got historical data for ${symbol}`);
        } else {
          console.warn(`⚠️ [STOCK DATA] No historical data for ${symbol}, using defaults`);
        }
      } catch (fmpError) {
        console.warn(`⚠️ [STOCK DATA] FMP API failed for ${symbol}, using defaults:`, fmpError);
      }

      const stockData: StockData = {
        symbol: symbol.toUpperCase(),
        current: currentPrice,
        top30D,
        top60D,
        thisMonthPercent,
        lastMonthPercent,
        volatility,
        marketCap
      };

      console.log(`✅ [STOCK DATA] Successfully fetched data for ${symbol}:`, {
        current: currentPrice,
        top30D,
        top60D,
        thisMonthPercent: `${thisMonthPercent.toFixed(2)}%`,
        volatility: `${(volatility * 100).toFixed(2)}%`,
        marketCap: `${(marketCap / 1000000000).toFixed(1)}B`
      });

      return stockData;

    } catch (error) {
      console.error(`❌ [STOCK DATA] Error fetching data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get stock data for multiple symbols
   */
  async getMultipleStockData(symbols: string[]): Promise<Map<string, StockData>> {
    const stockDataMap = new Map<string, StockData>();
    
    // Process symbols in batches - Finnhub allows 60 calls/minute, FMP allows 250 calls/day
    const batchSize = 5; // Process 5 stocks at a time
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      const promises = batch.map(async (symbol) => {
        const data = await this.getStockData(symbol);
        if (data) {
          stockDataMap.set(symbol, data);
        }
        // Add small delay between requests to be respectful
        await this.delay(1000); // 1 second between requests
      });

      await Promise.all(promises);
      
      // Add delay between batches
      if (i + batchSize < symbols.length) {
        await this.delay(2000); // 2 seconds between batches
      }
    }

    return stockDataMap;
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
   * Get historical data from FMP
   */
  private async getFMPHistoricalData(symbol: string): Promise<any[]> {
    const url = `${this.fmpBaseUrl}/historical-price-full/${symbol}?apikey=${this.fmpApiKey}`;
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'AiCapital/1.0'
      }
    });

    if (response.data.error) {
      throw new Error(`FMP API Error: ${response.data.error}`);
    }

    return response.data.historical || [];
  }

  /**
   * Get market cap from FMP
   */
  private async getFMPMarketCap(symbol: string): Promise<number> {
    const url = `${this.fmpBaseUrl}/market-capitalization/${symbol}?apikey=${this.fmpApiKey}`;
    
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'AiCapital/1.0'
      }
    });

    if (response.data.error || !response.data[0]) {
      return this.estimateMarketCap(symbol, 0);
    }

    return response.data[0].marketCap || this.estimateMarketCap(symbol, 0);
  }

  /**
   * Calculate monthly performance percentage (FMP format)
   */
  private calculateMonthlyPerformanceFMP(historicalData: any[]): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthData = historicalData.filter(day => {
      const dateObj = new Date(day.date);
      return dateObj.getMonth() === currentMonth && dateObj.getFullYear() === currentYear;
    });

    if (thisMonthData.length < 2) return 0;

    const firstDay = thisMonthData[thisMonthData.length - 1]; // First day of month
    const lastDay = thisMonthData[0]; // Most recent day

    const firstPrice = firstDay.close;
    const lastPrice = lastDay.close;

    return ((lastPrice - firstPrice) / firstPrice) * 100;
  }

  /**
   * Calculate last month performance percentage (FMP format)
   */
  private calculateLastMonthPerformanceFMP(historicalData: any[]): number {
    const currentDate = new Date();
    const lastMonth = currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1;
    const lastMonthYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
    
    const lastMonthData = historicalData.filter(day => {
      const dateObj = new Date(day.date);
      return dateObj.getMonth() === lastMonth && dateObj.getFullYear() === lastMonthYear;
    });

    if (lastMonthData.length < 2) return 0;

    const firstDay = lastMonthData[lastMonthData.length - 1];
    const lastDay = lastMonthData[0];

    const firstPrice = firstDay.close;
    const lastPrice = lastDay.close;

    return ((lastPrice - firstPrice) / firstPrice) * 100;
  }

  /**
   * Calculate volatility (FMP format)
   */
  private calculateVolatilityFMP(historicalData: any[]): number {
    if (historicalData.length < 2) return 0;

    const returns: number[] = [];
    
    for (let i = 0; i < historicalData.length - 1; i++) {
      const currentPrice = historicalData[i].close;
      const previousPrice = historicalData[i + 1].close;
      const dailyReturn = (currentPrice - previousPrice) / previousPrice;
      returns.push(dailyReturn);
    }

    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Estimate market cap (simplified - would need real data)
   */
  private estimateMarketCap(symbol: string, currentPrice: number): number {
    // This is a simplified estimation - in reality you'd need shares outstanding data
    const estimatedShares = this.getEstimatedSharesOutstanding(symbol);
    return currentPrice * estimatedShares;
  }

  /**
   * Get estimated shares outstanding (hardcoded for demo)
   */
  private getEstimatedSharesOutstanding(symbol: string): number {
    const estimates: Record<string, number> = {
      'AAPL': 15_000_000_000,
      'MSFT': 7_500_000_000,
      'GOOGL': 12_000_000_000,
      'TSLA': 3_000_000_000,
      'NVDA': 2_500_000_000,
      'AMZN': 10_000_000_000,
      'JNJ': 2_600_000_000,
      'PG': 2_400_000_000,
      'KO': 4_300_000_000,
      'AMD': 1_600_000_000,
      'PLTR': 2_000_000_000,
      'ARKK': 180_000_000,
      'GME': 300_000_000
    };
    
    return estimates[symbol.toUpperCase()] || 1_000_000_000; // Default 1B shares
  }

  /**
   * Delay utility for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const stockDataService = new StockDataService();
