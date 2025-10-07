import Portfolio from '../models/Portfolio';
import { stockDataService } from './stockDataService';

export class VolatilityService {
  /**
   * Calculate portfolio volatility based on individual stock volatilities
   * Uses weighted average of stock volatilities based on portfolio allocation
   */
  async calculatePortfolioVolatility(userId: string, portfolioId: string): Promise<number> {
    try {
      // Get all stocks in the portfolio
      const stocks = await Portfolio.find({ userId, portfolioId });
      
      if (stocks.length === 0) {
        return 0;
      }

      // Get current prices and calculate total portfolio value
      const tickers = stocks.map(stock => stock.ticker);
      const stockData = await stockDataService.getMultipleStockData(tickers);
      
      let totalValue = 0;
      const stockValues: Array<{ value: number; volatility: number }> = [];

      for (const stock of stocks) {
        const currentData = stockData.get(stock.ticker);
        if (currentData) {
          const stockValue = currentData.current * stock.shares;
          totalValue += stockValue;
          
          // Calculate individual stock volatility (simplified - using price change over time)
          const volatility = this.calculateStockVolatility(currentData);
          stockValues.push({ value: stockValue, volatility });
        }
      }

      if (totalValue === 0) {
        return 0;
      }

      // Calculate weighted average volatility
      let weightedVolatility = 0;
      for (const stockValue of stockValues) {
        const weight = stockValue.value / totalValue;
        weightedVolatility += stockValue.volatility * weight;
      }

      return Math.round(weightedVolatility * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('❌ [VOLATILITY] Error calculating portfolio volatility:', error);
      return 0;
    }
  }

  /**
   * Calculate individual stock volatility
   * Uses price changes and volatility data from the API
   */
  private calculateStockVolatility(stockData: any): number {
    try {
      // Use the volatility from the API if available
      if (stockData.volatility && typeof stockData.volatility === 'number') {
        return stockData.volatility * 100; // Convert to percentage
      }

      // Fallback: calculate from price changes
      const currentPrice = stockData.current;
      const price30D = stockData.top30D || currentPrice;
      const price60D = stockData.top60D || currentPrice;

      // Calculate volatility as standard deviation of returns
      const returns = [];
      
      if (price30D && price30D !== currentPrice) {
        const return30D = (currentPrice - price30D) / price30D;
        returns.push(return30D);
      }
      
      if (price60D && price60D !== currentPrice) {
        const return60D = (currentPrice - price60D) / price60D;
        returns.push(return60D);
      }

      if (returns.length === 0) {
        // Default volatility based on stock characteristics
        return this.getDefaultVolatility(stockData.symbol);
      }

      // Calculate standard deviation of returns
      const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance) * 100; // Convert to percentage

      return Math.max(volatility, 5); // Minimum 5% volatility
    } catch (error) {
      console.error('❌ [VOLATILITY] Error calculating stock volatility:', error);
      return this.getDefaultVolatility(stockData.symbol);
    }
  }

  /**
   * Get default volatility for known stocks
   */
  private getDefaultVolatility(symbol: string): number {
    const defaultVolatilities: { [key: string]: number } = {
      // High volatility stocks (risky)
      'TSLA': 45,
      'NVDA': 38,
      'AMD': 42,
      'PLTR': 55,
      'ARKK': 48,
      'GME': 65,
      'AMC': 70,
      'BB': 50,
      'NOK': 35,
      'SPCE': 60,
      'RKT': 40,
      'CLOV': 55,
      'WISH': 50,
      'SOFI': 45,
      'HOOD': 50,
      'COIN': 60,
      'RBLX': 45,
      'SNOW': 40,
      'DDOG': 35,
      'ZM': 30,
      'PTON': 50,
      'ROKU': 40,
      'SQ': 35,
      'PYPL': 30,
      'SHOP': 40,
      'MELI': 35,
      'SE': 30,
      'BABA': 25,
      'JD': 30,
      
      // Lower volatility stocks (solid)
      'AAPL': 20,
      'MSFT': 18,
      'GOOGL': 22,
      'AMZN': 25,
      'META': 28,
      'JNJ': 12,
      'PG': 10,
      'KO': 8,
      'PFE': 15,
      'WMT': 12,
      'JPM': 18,
      'BAC': 20,
      'V': 15,
      'MA': 16,
      'HD': 14,
      'UNH': 12,
      'VZ': 10,
      'T': 8,
      'XOM': 25,
      'CVX': 22,
      'NEE': 8,
      'SO': 6,
      'DUK': 7,
      'AEP': 9,
      'EXC': 11,
    };

    return defaultVolatilities[symbol] || 20; // Default 20% for unknown stocks
  }

  /**
   * Update volatility for all portfolios of a user
   */
  async updateUserPortfolioVolatilities(userId: string): Promise<void> {
    try {
      console.log(`🔄 [VOLATILITY] Updating volatilities for user ${userId}`);
      
      // Get all unique portfolio IDs for the user
      const portfolios = await Portfolio.distinct('portfolioId', { userId });
      
      for (const portfolioId of portfolios) {
        const volatility = await this.calculatePortfolioVolatility(userId, portfolioId);
        
        // Update all stocks in this portfolio with the calculated volatility
        await Portfolio.updateMany(
          { userId, portfolioId },
          { 
            volatility,
            lastVolatilityUpdate: new Date()
          }
        );
        
        console.log(`✅ [VOLATILITY] Updated portfolio ${portfolioId} volatility to ${volatility}%`);
      }
    } catch (error) {
      console.error('❌ [VOLATILITY] Error updating user portfolio volatilities:', error);
    }
  }

  /**
   * Update volatility for all users (scheduled job)
   */
  async updateAllPortfolioVolatilities(): Promise<void> {
    try {
      console.log('🔄 [VOLATILITY] Starting daily volatility update for all users');
      
      // Get all unique user IDs
      const userIds = await Portfolio.distinct('userId');
      
      for (const userId of userIds) {
        await this.updateUserPortfolioVolatilities(userId);
      }
      
      console.log('✅ [VOLATILITY] Completed daily volatility update for all users');
    } catch (error) {
      console.error('❌ [VOLATILITY] Error updating all portfolio volatilities:', error);
    }
  }
}

export const volatilityService = new VolatilityService();
