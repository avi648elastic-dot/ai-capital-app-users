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
  private baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';

  /**
   * Get historical data for a stock using Yahoo Finance (Google Finance alternative)
   * This mimics Google Finance behavior
   */
  async getStockHistory(symbol: string, days: number = 90): Promise<GoogleFinanceData | null> {
    try {
      console.log(`🔍 [GOOGLE FINANCE] Fetching ${days} days of data for ${symbol}`);
      
      const endDate = Math.floor(Date.now() / 1000);
      const startDate = endDate - (days * 24 * 60 * 60);
      
      const response = await axios.get(`${this.baseUrl}/${symbol}`, {
        params: {
          period1: startDate,
          period2: endDate,
          interval: '1d'
        },
        timeout: 10000
      });

      if (response.data.chart?.result?.[0]?.indicators?.quote?.[0]) {
        const result = response.data.chart.result[0];
        const timestamps = result.timestamp;
        const quote = result.indicators.quote[0];
        
        const historicalPrices = [];
        for (let i = 0; i < timestamps.length; i++) {
          if (quote.close[i] && quote.open[i] && quote.high[i] && quote.low[i]) {
            historicalPrices.push({
              date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
              price: quote.close[i]
            });
          }
        }
        
        const currentPrice = historicalPrices.length > 0 ? 
          historicalPrices[historicalPrices.length - 1].price : 0;

        console.log(`✅ [GOOGLE FINANCE] Retrieved ${historicalPrices.length} data points for ${symbol}`);
        
        return {
          symbol,
          currentPrice,
          historicalPrices: historicalPrices.reverse() // Most recent first
        };
      }
      
      return null;
    } catch (error) {
      console.error(`❌ [GOOGLE FINANCE] Error fetching data for ${symbol}:`, error);
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
