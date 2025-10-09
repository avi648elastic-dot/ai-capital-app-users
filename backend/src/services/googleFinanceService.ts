import axios from 'axios';

export interface GoogleFinanceData {
  symbol: string;
  currentPrice: number;
  historicalPrices: {
    date: string;
    price: number;
  }[];
}

class GoogleFinanceService {
  private alphaVantageApiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';

  constructor() {
    this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
    if (this.alphaVantageApiKey === 'demo') {
      console.warn('⚠️ [GOOGLE FINANCE] Using demo Alpha Vantage API key. Get real key for production.');
    } else {
      console.log('✅ [GOOGLE FINANCE] Using real Alpha Vantage API for stock data');
    }
  }

  /**
   * Get real-time stock data using Alpha Vantage API (replaces deprecated Google Finance)
   */
  async getStockHistory(symbol: string, days: number = 90): Promise<GoogleFinanceData | null> {
    try {
      console.log(`🔍 [GOOGLE FINANCE] Fetching ${days} days of REAL data for ${symbol} using Alpha Vantage`);
      
      // Get current price first
      const currentResponse = await axios.get(this.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: this.alphaVantageApiKey
        },
        timeout: 10000
      });

      let currentPrice = 0;
      if (currentResponse.data['Global Quote'] && currentResponse.data['Global Quote']['05. price']) {
        currentPrice = parseFloat(currentResponse.data['Global Quote']['05. price']);
        console.log(`📊 [GOOGLE FINANCE] ${symbol} current price: $${currentPrice}`);
      }

      // Get historical data
      const historicalResponse = await axios.get(this.baseUrl, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: symbol,
          outputsize: days > 30 ? 'full' : 'compact',
          apikey: this.alphaVantageApiKey
        },
        timeout: 15000
      });

      if (historicalResponse.data['Time Series (Daily)']) {
        const timeSeries = historicalResponse.data['Time Series (Daily)'];
        const historicalPrices = [];
        
        // Sort dates (most recent first)
        const sortedDates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        // Take only the requested number of days
        const recentDates = sortedDates.slice(0, days);
        
        for (const date of recentDates) {
          const dayData = timeSeries[date];
          historicalPrices.push({
            date: date,
            price: parseFloat(dayData['4. close'])
          });
        }

        // Use current price from Global Quote if available, otherwise use latest historical price
        if (currentPrice > 0) {
          historicalPrices[0] = { date: new Date().toISOString().split('T')[0], price: currentPrice };
        }

        console.log(`✅ [GOOGLE FINANCE] Retrieved ${historicalPrices.length} REAL data points for ${symbol}`);
        console.log(`📊 [GOOGLE FINANCE] ${symbol} sample data:`, {
          firstDate: historicalPrices[0]?.date,
          lastDate: historicalPrices[historicalPrices.length - 1]?.date,
          firstPrice: historicalPrices[0]?.price,
          lastPrice: historicalPrices[historicalPrices.length - 1]?.price,
          currentPrice: currentPrice || historicalPrices[0]?.price
        });
        
        return {
          symbol,
          currentPrice: currentPrice || historicalPrices[0]?.price || 0,
          historicalPrices
        };
      }
      
      return null;
    } catch (error) {
      console.error(`❌ [GOOGLE FINANCE] Error fetching REAL data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Calculate performance metrics using Google Finance formulas
   */
  calculatePerformanceMetrics(data: GoogleFinanceData, days: number): {
    totalReturn: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    topPrice: number;
    currentPrice: number;
  } {
    if (!data.historicalPrices || data.historicalPrices.length === 0) {
      return {
        totalReturn: 0,
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        topPrice: data.currentPrice,
        currentPrice: data.currentPrice
      };
    }

    const prices = data.historicalPrices.map(h => h.price);
    const currentPrice = prices[prices.length - 1];
    
    // Google Finance formula: Get data for the specified days
    const startIndex = Math.max(0, prices.length - days);
    const startPrice = prices[startIndex];
    
    // Calculate total return for the period
    const totalReturn = ((currentPrice - startPrice) / startPrice) * 100;
    
    // Calculate volatility using standard deviation of daily returns
    const dailyReturns = [];
    for (let i = startIndex + 1; i < prices.length; i++) {
      const dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
      dailyReturns.push(dailyReturn * 100);
    }
    
    const avgReturn = dailyReturns.length > 0 ? 
      dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length : 0;
    const variance = dailyReturns.length > 0 ?
      dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / dailyReturns.length : 0;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
    
    // Calculate Sharpe ratio (assuming risk-free rate of 2%)
    const riskFreeRate = 2.0;
    const sharpeRatio = volatility > 0 ? (avgReturn - riskFreeRate) / volatility : 0;
    
    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = prices[startIndex];
    for (let i = startIndex; i < prices.length; i++) {
      if (prices[i] > peak) peak = prices[i];
      const drawdown = ((peak - prices[i]) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    // Google Finance formula: =MAX(G2:BG2) - get top price in period
    const periodPrices = prices.slice(startIndex);
    const topPrice = periodPrices.length > 0 ? Math.max(...periodPrices) : currentPrice;

    return {
      totalReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      topPrice,
      currentPrice
    };
  }

  /**
   * Get multiple stocks' data in parallel
   */
  async getMultipleStockData(symbols: string[], days: number = 90): Promise<Map<string, GoogleFinanceData>> {
    console.log(`🔍 [GOOGLE FINANCE] Fetching data for ${symbols.length} symbols`);
    
    const promises = symbols.map(async (symbol) => {
      const data = await this.getStockHistory(symbol, days);
      return { symbol, data };
    });

    const results = await Promise.all(promises);
    const dataMap = new Map<string, GoogleFinanceData>();

    results.forEach(({ symbol, data }) => {
      if (data) {
        dataMap.set(symbol, data);
      }
    });

    console.log(`✅ [GOOGLE FINANCE] Retrieved data for ${dataMap.size}/${symbols.length} symbols`);
    return dataMap;
  }
}

export const googleFinanceService = new GoogleFinanceService();
