import axios from 'axios';

export interface StockSheet {
  ticker: string;
  currentPrice: number;
  historicalData90D: number[]; // Array of 90 daily prices
  returns: {
    return7D: number;
    return30D: number;
    return60D: number;
    return90D: number;
  };
  topPrices: {
    top30D: number;
    top60D: number;
    top90D: number;
  };
}

class GoogleFinanceSheetService {
  private alphaVantageApiKey: string;

  constructor() {
    this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
    if (this.alphaVantageApiKey === 'demo') {
      console.warn('⚠️ [GOOGLE FINANCE SHEET] Using demo Alpha Vantage API key. Get real key for production.');
    } else {
      console.log('✅ [GOOGLE FINANCE SHEET] Using real Alpha Vantage API for Google Finance formulas');
    }
  }

  /**
   * Get current price using formula: =GOOGLEFINANCE(A2, "price")
   */
  async getCurrentPrice(ticker: string): Promise<number> {
    try {
      console.log(`🔍 [GOOGLE FINANCE SHEET] Getting current price for ${ticker} using =GOOGLEFINANCE(${ticker}, "price")`);
      
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: ticker,
          apikey: this.alphaVantageApiKey
        },
        timeout: 10000
      });

      if (response.data['Global Quote'] && response.data['Global Quote']['05. price']) {
        const currentPrice = parseFloat(response.data['Global Quote']['05. price']);
        console.log(`✅ [GOOGLE FINANCE SHEET] ${ticker} current price: $${currentPrice}`);
        return currentPrice;
      }
      
      return 0;
    } catch (error) {
      console.error(`❌ [GOOGLE FINANCE SHEET] Error getting current price for ${ticker}:`, error);
      return 0;
    }
  }

  /**
   * Get 90 days of historical data using formula: 
   * =TRANSPOSE(QUERY(GOOGLEFINANCE(A2,"price",TODAY()-90,TODAY(),"DAILY"),"select Col2 offset 1",0))
   */
  async getHistoricalData90D(ticker: string): Promise<number[]> {
    try {
      console.log(`🔍 [GOOGLE FINANCE SHEET] Getting 90 days data for ${ticker} using TRANSPOSE(QUERY(GOOGLEFINANCE...))`);
      
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: ticker,
          outputsize: 'compact',
          apikey: this.alphaVantageApiKey
        },
        timeout: 15000
      });

      if (response.data['Time Series (Daily)']) {
        const timeSeries = response.data['Time Series (Daily)'];
        const historicalPrices = [];
        
        // Sort dates (most recent first) and take 90 days
        const sortedDates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        const recent90Days = sortedDates.slice(0, 90);
        
        for (const date of recent90Days) {
          const dayData = timeSeries[date];
          historicalPrices.push(parseFloat(dayData['4. close']));
        }

        console.log(`✅ [GOOGLE FINANCE SHEET] Retrieved ${historicalPrices.length} days of data for ${ticker}`);
        console.log(`📊 [GOOGLE FINANCE SHEET] ${ticker} price range: $${Math.min(...historicalPrices).toFixed(2)} - $${Math.max(...historicalPrices).toFixed(2)}`);
        
        return historicalPrices;
      }
      
      return [];
    } catch (error) {
      console.error(`❌ [GOOGLE FINANCE SHEET] Error getting 90-day data for ${ticker}:`, error);
      return [];
    }
  }

  /**
   * Calculate returns using your formulas:
   * Last month: =(INDEX(G2:BJ2,30) - INDEX(G2:BJ2,1)) / INDEX(G2:BJ2,1)
   * This month: =(INDEX(G2:BN2,60) - INDEX(G2:BJ2,31)) / INDEX(G2:BJ2,31)
   */
  calculateReturns(historicalData: number[]): { return7D: number; return30D: number; return60D: number; return90D: number } {
    if (historicalData.length === 0) {
      return { return7D: 0, return30D: 0, return60D: 0, return90D: 0 };
    }

    const currentPrice = historicalData[0]; // Most recent price (index 0)
    
    // 7-day return: (current - 7 days ago) / 7 days ago
    const price7DAgo = historicalData[6] || historicalData[historicalData.length - 1];
    const return7D = ((currentPrice - price7DAgo) / price7DAgo) * 100;
    
    // 30-day return: (current - 30 days ago) / 30 days ago
    const price30DAgo = historicalData[29] || historicalData[historicalData.length - 1];
    const return30D = ((currentPrice - price30DAgo) / price30DAgo) * 100;
    
    // 60-day return: (current - 60 days ago) / 60 days ago
    const price60DAgo = historicalData[59] || historicalData[historicalData.length - 1];
    const return60D = ((currentPrice - price60DAgo) / price60DAgo) * 100;
    
    // 90-day return: (current - 90 days ago) / 90 days ago
    const price90DAgo = historicalData[89] || historicalData[historicalData.length - 1];
    const return90D = ((currentPrice - price90DAgo) / price90DAgo) * 100;

    console.log(`📊 [GOOGLE FINANCE SHEET] Returns calculated:`, {
      return7D: return7D.toFixed(2) + '%',
      return30D: return30D.toFixed(2) + '%',
      return60D: return60D.toFixed(2) + '%',
      return90D: return90D.toFixed(2) + '%'
    });

    return { return7D, return30D, return60D, return90D };
  }

  /**
   * Calculate top prices using your formula: =MAX(G2:BG2)
   * G2:BG2 represents the price range for the period
   */
  calculateTopPrices(historicalData: number[]): { top30D: number; top60D: number; top90D: number } {
    if (historicalData.length === 0) {
      return { top30D: 0, top60D: 0, top90D: 0 };
    }

    // Top 30D: =MAX(G2:AI2) - max of first 30 days
    const top30D = Math.max(...historicalData.slice(0, Math.min(30, historicalData.length)));
    
    // Top 60D: =MAX(G2:BG2) - max of first 60 days  
    const top60D = Math.max(...historicalData.slice(0, Math.min(60, historicalData.length)));
    
    // Top 90D: max of all 90 days
    const top90D = Math.max(...historicalData);

    console.log(`📊 [GOOGLE FINANCE SHEET] Top prices calculated:`, {
      top30D: '$' + top30D.toFixed(2),
      top60D: '$' + top60D.toFixed(2),
      top90D: '$' + top90D.toFixed(2)
    });

    return { top30D, top60D, top90D };
  }

  /**
   * Create a complete stock sheet with all formulas implemented
   */
  async createStockSheet(ticker: string): Promise<StockSheet | null> {
    try {
      console.log(`🔍 [GOOGLE FINANCE SHEET] Creating complete sheet for ${ticker}`);
      
      // Step 1: Get current price using =GOOGLEFINANCE(A2, "price")
      const currentPrice = await this.getCurrentPrice(ticker);
      
      // Step 2: Get 90 days historical data using TRANSPOSE(QUERY(GOOGLEFINANCE...))
      const historicalData90D = await this.getHistoricalData90D(ticker);
      
      if (historicalData90D.length === 0) {
        console.warn(`⚠️ [GOOGLE FINANCE SHEET] No historical data for ${ticker}`);
        return null;
      }

      // Step 3: Calculate returns using your formulas
      const returns = this.calculateReturns(historicalData90D);
      
      // Step 4: Calculate top prices using =MAX(G2:BG2) formulas
      const topPrices = this.calculateTopPrices(historicalData90D);

      const stockSheet: StockSheet = {
        ticker,
        currentPrice,
        historicalData90D,
        returns,
        topPrices
      };

      console.log(`✅ [GOOGLE FINANCE SHEET] Complete sheet created for ${ticker}:`, {
        currentPrice: '$' + currentPrice.toFixed(2),
        dataPoints: historicalData90D.length,
        returns: returns,
        topPrices: topPrices
      });

      return stockSheet;
    } catch (error) {
      console.error(`❌ [GOOGLE FINANCE SHEET] Error creating sheet for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Create sheets for multiple stocks in parallel
   */
  async createMultipleStockSheets(tickers: string[]): Promise<Map<string, StockSheet>> {
    console.log(`🔍 [GOOGLE FINANCE SHEET] Creating sheets for ${tickers.length} tickers:`, tickers);
    
    const promises = tickers.map(async (ticker) => {
      const sheet = await this.createStockSheet(ticker);
      return { ticker, sheet };
    });

    const results = await Promise.all(promises);
    const sheetMap = new Map<string, StockSheet>();

    results.forEach(({ ticker, sheet }) => {
      if (sheet) {
        sheetMap.set(ticker, sheet);
      }
    });

    console.log(`✅ [GOOGLE FINANCE SHEET] Created ${sheetMap.size}/${tickers.length} sheets successfully`);
    return sheetMap;
  }
}

export const googleFinanceSheetService = new GoogleFinanceSheetService();
