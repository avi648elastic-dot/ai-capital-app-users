import axios from 'axios';
import HistoricalData from '../models/HistoricalData';

export interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose: number;
}

export interface PortfolioPerformance {
  date: string;
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  dailyChange: number;
  dailyChangePercent: number;
}

class HistoricalDataService {
  // Get historical data from Finnhub (free tier)
  async getHistoricalDataFromFinnhub(ticker: string, days: number = 90): Promise<HistoricalPrice[]> {
    try {
      const to = Math.floor(Date.now() / 1000);
      const from = to - (days * 24 * 60 * 60);
      
      // Try multiple API keys if available
      const apiKeys = [
        process.env.FINNHUB_API_KEY_1,
        process.env.FINNHUB_API_KEY_2,
        process.env.FINNHUB_API_KEY,
      ].filter(Boolean) as string[];

      if (apiKeys.length === 0) {
        console.warn(`⚠️ [HISTORICAL] No Finnhub API keys configured, skipping for ${ticker}`);
        return [];
      }

      // Try each API key until one works
      for (const apiKey of apiKeys) {
        try {
          const response = await axios.get(`https://finnhub.io/api/v1/stock/candle`, {
            params: {
              symbol: ticker,
              resolution: 'D',
              from: from,
              to: to,
              token: apiKey
            },
            timeout: 10000 // 10 second timeout
          });

          // Check for API error in response
          if (response.data?.error) {
            const errorMsg = response.data.error;
            // If 403/401 access denied, skip to next key or return empty (fallback will be used)
            if (errorMsg.toLowerCase().includes("access") || errorMsg.toLowerCase().includes("403") || errorMsg.toLowerCase().includes("401")) {
              console.warn(`⚠️ [HISTORICAL] Finnhub access denied for ${ticker} with key ${apiKey.substring(0, 8)}...: ${errorMsg}`);
              continue; // Try next key
            }
            throw new Error(`Finnhub API error: ${errorMsg}`);
          }

          if (response.data?.s === 'ok' && response.data?.c) {
            const prices: HistoricalPrice[] = [];
            const timestamps = response.data.t;
            const opens = response.data.o;
            const highs = response.data.h;
            const lows = response.data.l;
            const closes = response.data.c;
            const volumes = response.data.v;

            for (let i = 0; i < timestamps.length; i++) {
              prices.push({
                date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
                open: opens[i],
                high: highs[i],
                low: lows[i],
                close: closes[i],
                volume: volumes[i] || 0,
                adjustedClose: closes[i] // Finnhub doesn't provide adjusted close
              });
            }

            console.log(`✅ [HISTORICAL] Finnhub success for ${ticker} (${prices.length} records)`);
            return prices.reverse(); // Most recent first
          }
          
          // If response was ok but no data, try next key
          console.warn(`⚠️ [HISTORICAL] Finnhub returned empty data for ${ticker}, trying next key...`);
        } catch (keyError: any) {
          // If 403/401 HTTP error, skip to next key
          if (keyError.response?.status === 403 || keyError.response?.status === 401) {
            console.warn(`⚠️ [HISTORICAL] Finnhub 403/401 for ${ticker} with key ${apiKey.substring(0, 8)}..., trying next key...`);
            continue;
          }
          // If it's the last key, re-throw to be caught by outer catch
          if (apiKeys.indexOf(apiKey) === apiKeys.length - 1) {
            throw keyError;
          }
        }
      }
      
      // All keys failed or returned no data
      return [];
    } catch (error: any) {
      // Only log if it's not a handled 403/401
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        console.error(`❌ [HISTORICAL] Finnhub error for ${ticker}:`, error.message || error);
      }
      return [];
    }
  }

  // Get historical data from Yahoo Finance (backup)
  async getHistoricalDataFromYahoo(ticker: string, days: number = 90): Promise<HistoricalPrice[]> {
    try {
      const endDate = Math.floor(Date.now() / 1000);
      const startDate = endDate - (days * 24 * 60 * 60);
      
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`, {
        params: {
          period1: startDate,
          period2: endDate,
          interval: '1d'
        },
        timeout: 15000, // 15 second timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.data?.chart?.result?.[0]?.indicators?.quote?.[0]) {
        const result = response.data.chart.result[0];
        const timestamps = result.timestamp;
        const quote = result.indicators.quote[0];
        
        if (!timestamps || !quote || timestamps.length === 0) {
          console.warn(`⚠️ [HISTORICAL] Yahoo returned empty data for ${ticker}`);
          return [];
        }
        
        const prices: HistoricalPrice[] = [];
        for (let i = 0; i < timestamps.length; i++) {
          if (quote.close?.[i] && quote.open?.[i] && quote.high?.[i] && quote.low?.[i]) {
            prices.push({
              date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
              open: quote.open[i],
              high: quote.high[i],
              low: quote.low[i],
              close: quote.close[i],
              volume: quote.volume?.[i] || 0,
              adjustedClose: quote.close[i]
            });
          }
        }
        
        if (prices.length > 0) {
          console.log(`✅ [HISTORICAL] Yahoo success for ${ticker} (${prices.length} records)`);
        }
        
        return prices.reverse();
      }
      
      console.warn(`⚠️ [HISTORICAL] Yahoo returned invalid response structure for ${ticker}`);
      return [];
    } catch (error: any) {
      // Don't spam errors for Yahoo failures since it's a fallback
      if (error.response?.status === 403 || error.response?.status === 429) {
        console.warn(`⚠️ [HISTORICAL] Yahoo rate limited/blocked for ${ticker}, skipping`);
      } else {
        console.error(`❌ [HISTORICAL] Yahoo error for ${ticker}:`, error.message || error);
      }
      return [];
    }
  }

  // Store historical data in database
  async storeHistoricalData(ticker: string, prices: HistoricalPrice[], userId?: string): Promise<void> {
    try {
      const documents = prices.map(price => ({
        ticker: ticker.toUpperCase(),
        date: new Date(price.date),
        open: price.open,
        high: price.high,
        low: price.low,
        close: price.close,
        volume: price.volume,
        adjustedClose: price.adjustedClose,
        userId
      }));

      // Use upsert to avoid duplicates
      for (const doc of documents) {
        await HistoricalData.findOneAndUpdate(
          { ticker: doc.ticker, date: doc.date },
          doc,
          { upsert: true, new: true }
        );
      }

      console.log(`✅ [HISTORICAL] Stored ${documents.length} records for ${ticker}`);
    } catch (error) {
      console.error(`❌ [HISTORICAL] Storage error for ${ticker}:`, error);
    }
  }

  // Get historical data for a ticker (from DB or fetch if missing)
  async getHistoricalData(ticker: string, days: number = 90, userId?: string): Promise<HistoricalPrice[]> {
    try {
      // First try to get from database
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const storedData = await HistoricalData.find({
        ticker: ticker.toUpperCase(),
        date: { $gte: cutoffDate }
      }).sort({ date: 1 });

      if (storedData.length >= days * 0.8) { // If we have at least 80% of expected data
        return storedData.map(doc => ({
          date: doc.date.toISOString().split('T')[0],
          open: doc.open,
          high: doc.high,
          low: doc.low,
          close: doc.close,
          volume: doc.volume,
          adjustedClose: doc.adjustedClose
        }));
      }

      // If not enough data, fetch from API (gap fill)
      console.log(`🔍 [HISTORICAL] Fetching fresh data for ${ticker}`);
      let prices = await this.getHistoricalDataFromFinnhub(ticker, days);
      
      // Immediately fallback to Yahoo if Finnhub fails (403, empty, etc.)
      if (prices.length === 0) {
        console.log(`🔄 [HISTORICAL] Finnhub returned no data for ${ticker}, falling back to Yahoo Finance...`);
        prices = await this.getHistoricalDataFromYahoo(ticker, days);
      }

      if (prices.length > 0) {
        await this.storeHistoricalData(ticker, prices, userId);
        return prices;
      }

      return [];
    } catch (error) {
      console.error(`❌ [HISTORICAL] Error getting data for ${ticker}:`, error);
      return [];
    }
  }

  // Calculate portfolio performance over time
  async calculatePortfolioPerformance(
    portfolio: any[], 
    days: number = 30, 
    userId?: string
  ): Promise<PortfolioPerformance[]> {
    try {
      const performance: PortfolioPerformance[] = [];
      const tickers = [...new Set(portfolio.map(stock => stock.ticker))];
      
      // Get historical data for all tickers
      const historicalData: Record<string, HistoricalPrice[]> = {};
      for (const ticker of tickers) {
        historicalData[ticker] = await this.getHistoricalData(ticker, days, userId);
      }

      // Calculate portfolio value for each day
      const dates = new Set<string>();
      Object.values(historicalData).forEach(prices => {
        prices.forEach(price => dates.add(price.date));
      });

      const sortedDates = Array.from(dates).sort();

      for (const date of sortedDates) {
        let totalValue = 0;
        let totalInitialValue = 0;

        portfolio.forEach(stock => {
          const stockHistory = historicalData[stock.ticker];
          const dayData = stockHistory.find(h => h.date === date);
          
          if (dayData) {
            totalValue += dayData.close * stock.shares;
            totalInitialValue += stock.entryPrice * stock.shares;
          }
        });

        if (totalValue > 0) {
          const totalPnL = totalValue - totalInitialValue;
          const totalPnLPercent = totalInitialValue > 0 ? (totalPnL / totalInitialValue) * 100 : 0;
          
          const prevDay = performance[performance.length - 1];
          const dailyChange = prevDay ? totalValue - prevDay.totalValue : 0;
          const dailyChangePercent = prevDay && prevDay.totalValue > 0 ? 
            (dailyChange / prevDay.totalValue) * 100 : 0;

          performance.push({
            date,
            totalValue: Math.round(totalValue * 100) / 100,
            totalPnL: Math.round(totalPnL * 100) / 100,
            totalPnLPercent: Math.round(totalPnLPercent * 100) / 100,
            dailyChange: Math.round(dailyChange * 100) / 100,
            dailyChangePercent: Math.round(dailyChangePercent * 100) / 100
          });
        }
      }

      return performance;
    } catch (error) {
      console.error('❌ [HISTORICAL] Portfolio performance calculation error:', error);
      return [];
    }
  }

  // Get stock history for performance calculations
  async getStockHistory(ticker: string, days: number = 90): Promise<{ date: string; price: number; volume?: number }[]> {
    try {
      console.log(`🔍 [HISTORICAL] Getting ${days} days of history for ${ticker}`);
      
      const historicalData = await this.getHistoricalData(ticker, days);
      
      if (historicalData.length === 0) {
        console.warn(`⚠️ [HISTORICAL] No historical data found for ${ticker}`);
        return [];
      }
      
      // Format for performance calculations
      const formattedData = historicalData.map(item => ({
        date: item.date,
        price: item.close, // Use close price for calculations
        volume: item.volume
      }));
      
      console.log(`✅ [HISTORICAL] Retrieved ${formattedData.length} data points for ${ticker}`);
      return formattedData;
      
    } catch (error) {
      console.error(`❌ [HISTORICAL] Error getting stock history for ${ticker}:`, error);
      return [];
    }
  }

  // Calculate sector performance over time
  async calculateSectorPerformance(
    sectorData: any[], 
    days: number = 90, 
    userId?: string
  ): Promise<any[]> {
    try {
      const sectorPerformance = [];

      for (const sector of sectorData) {
        if (sector.stocks && sector.stocks.length > 0) {
          // Get historical data for first stock in sector (representative)
          const representativeStock = sector.stocks[0];
          const historicalData = await this.getHistoricalData(representativeStock, days, userId);
          
          if (historicalData.length >= 2) {
            const firstPrice = historicalData[0].close;
            const lastPrice = historicalData[historicalData.length - 1].close;
            const performance90D = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;

            sectorPerformance.push({
              ...sector,
              performance90D: Math.round(performance90D * 100) / 100,
              historicalData: historicalData.slice(0, 30) // Last 30 days for chart
            });
          } else {
            sectorPerformance.push({
              ...sector,
              performance90D: 0,
              historicalData: []
            });
          }
        }
      }

      return sectorPerformance;
    } catch (error) {
      console.error('❌ [HISTORICAL] Sector performance calculation error:', error);
      return sectorData;
    }
  }
}

export const historicalDataService = new HistoricalDataService();
