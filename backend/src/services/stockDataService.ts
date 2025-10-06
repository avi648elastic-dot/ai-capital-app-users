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
  private apiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';

  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
    if (this.apiKey === 'demo') {
      console.warn('⚠️ Using demo Alpha Vantage API key. Get a real key at https://www.alphavantage.co/support/#api-key');
    }
  }

  /**
   * Get real-time stock data for a single symbol
   */
  async getStockData(symbol: string): Promise<StockData | null> {
    try {
      console.log(`🔍 [STOCK DATA] Fetching data for ${symbol}`);
      
      // Get current quote
      const quoteResponse = await this.makeRequest('GLOBAL_QUOTE', { symbol });
      const quote = quoteResponse['Global Quote'] as AlphaVantageQuote;
      
      if (!quote) {
        console.error(`❌ [STOCK DATA] No quote data for ${symbol}`);
        return null;
      }

      const currentPrice = parseFloat(quote['05. price']);
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));

      // Get historical data for 30D and 60D highs
      const timeSeriesResponse = await this.makeRequest('TIME_SERIES_DAILY', { 
        symbol,
        outputsize: 'compact' // Last 100 days
      });
      
      const timeSeries = timeSeriesResponse['Time Series (Daily)'] as AlphaVantageTimeSeries;
      if (!timeSeries) {
        console.error(`❌ [STOCK DATA] No time series data for ${symbol}`);
        return null;
      }

      // Calculate 30D and 60D highs
      const dates = Object.keys(timeSeries).sort().reverse(); // Most recent first
      const last30Days = dates.slice(0, 30);
      const last60Days = dates.slice(0, 60);
      
      const top30D = Math.max(...last30Days.map(date => parseFloat(timeSeries[date]['2. high'])));
      const top60D = Math.max(...last60Days.map(date => parseFloat(timeSeries[date]['2. high'])));

      // Calculate monthly performance
      const thisMonthPercent = this.calculateMonthlyPerformance(timeSeries, dates);
      const lastMonthPercent = this.calculateLastMonthPerformance(timeSeries, dates);

      // Calculate volatility (simplified)
      const volatility = this.calculateVolatility(timeSeries, dates.slice(0, 30));

      // Get market cap (simplified - would need another API call for real data)
      const marketCap = this.estimateMarketCap(symbol, currentPrice);

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
        volatility: `${(volatility * 100).toFixed(2)}%`
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
    
    // Process symbols in batches to avoid rate limits
    const batchSize = 2; // Alpha Vantage free tier allows 5 calls per minute
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      const promises = batch.map(async (symbol) => {
        const data = await this.getStockData(symbol);
        if (data) {
          stockDataMap.set(symbol, data);
        }
        // Add delay between requests to respect rate limits
        await this.delay(12000); // 12 seconds between requests
      });

      await Promise.all(promises);
    }

    return stockDataMap;
  }

  /**
   * Make API request to Alpha Vantage
   */
  private async makeRequest(functionName: string, params: Record<string, string>): Promise<any> {
    const url = `${this.baseUrl}?function=${functionName}&apikey=${this.apiKey}&${new URLSearchParams(params).toString()}`;
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'AiCapital/1.0'
      }
    });

    if (response.data['Error Message']) {
      throw new Error(`Alpha Vantage API Error: ${response.data['Error Message']}`);
    }

    if (response.data['Note']) {
      throw new Error(`Alpha Vantage API Rate Limit: ${response.data['Note']}`);
    }

    return response.data;
  }

  /**
   * Calculate monthly performance percentage
   */
  private calculateMonthlyPerformance(timeSeries: AlphaVantageTimeSeries, dates: string[]): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthData = dates.filter(date => {
      const dateObj = new Date(date);
      return dateObj.getMonth() === currentMonth && dateObj.getFullYear() === currentYear;
    });

    if (thisMonthData.length < 2) return 0;

    const firstDay = thisMonthData[thisMonthData.length - 1]; // First day of month
    const lastDay = thisMonthData[0]; // Most recent day

    const firstPrice = parseFloat(timeSeries[firstDay]['4. close']);
    const lastPrice = parseFloat(timeSeries[lastDay]['4. close']);

    return ((lastPrice - firstPrice) / firstPrice) * 100;
  }

  /**
   * Calculate last month performance percentage
   */
  private calculateLastMonthPerformance(timeSeries: AlphaVantageTimeSeries, dates: string[]): number {
    const currentDate = new Date();
    const lastMonth = currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1;
    const lastMonthYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
    
    const lastMonthData = dates.filter(date => {
      const dateObj = new Date(date);
      return dateObj.getMonth() === lastMonth && dateObj.getFullYear() === lastMonthYear;
    });

    if (lastMonthData.length < 2) return 0;

    const firstDay = lastMonthData[lastMonthData.length - 1];
    const lastDay = lastMonthData[0];

    const firstPrice = parseFloat(timeSeries[firstDay]['4. close']);
    const lastPrice = parseFloat(timeSeries[lastDay]['4. close']);

    return ((lastPrice - firstPrice) / firstPrice) * 100;
  }

  /**
   * Calculate volatility (standard deviation of daily returns)
   */
  private calculateVolatility(timeSeries: AlphaVantageTimeSeries, dates: string[]): number {
    if (dates.length < 2) return 0;

    const returns: number[] = [];
    
    for (let i = 0; i < dates.length - 1; i++) {
      const currentPrice = parseFloat(timeSeries[dates[i]]['4. close']);
      const previousPrice = parseFloat(timeSeries[dates[i + 1]]['4. close']);
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
