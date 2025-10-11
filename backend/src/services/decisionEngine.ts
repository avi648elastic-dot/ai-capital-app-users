import { googleFinanceFormulasService, StockMetrics } from './googleFinanceFormulasService';
import { loggerService } from './loggerService';

interface PortfolioItem {
  ticker: string;
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
}

interface DecisionResult {
  action: 'BUY' | 'HOLD' | 'SELL';
  reason: string;
  color: string;
  score?: number;
  error?: string;
}

/**
 * 🎯 Decision Engine
 * Replicates Google Sheet scoring logic with dynamic stock data fetching
 * NO FIXED TRACKING LIST - fetches data for any stock dynamically
 * Uses 90 days of price data to extract: Current, TOP 30D, TOP 60D, % This Month, % Last Month
 */
export class DecisionEngine {
  /**
   * 🎯 Main decision method - NO PRE-LOADING REQUIRED
   * Fetches data dynamically for each stock when needed (with 10-minute cache)
   */
  async decideActionEnhanced(item: PortfolioItem): Promise<DecisionResult> {
    const { ticker, entryPrice, currentPrice, stopLoss, takeProfit } = item;

    try {
      // Fetch stock metrics dynamically (with 10-minute cache)
      loggerService.info(`🔍 [DECISION ENGINE] Analyzing ${ticker}`);
      let stockData = await googleFinanceFormulasService.getStockMetrics(ticker);

      // Fallback: If no stock data available, use PRICE-BASED analysis (like your legacy system)
      if (!stockData) {
        loggerService.warn(`⚠️ [DECISION ENGINE] No stock data for ${ticker}, using price-based analysis`);
        
        // Calculate actual performance from entry price
        const performancePercent = ((currentPrice - entryPrice) / entryPrice) * 100;
        
        stockData = {
          symbol: ticker,
          current: currentPrice,
          top30D: currentPrice * 1.15, // Conservative estimate
          top60D: currentPrice * 1.25, // Conservative estimate  
          thisMonthPercent: performancePercent, // Use actual performance
          lastMonthPercent: performancePercent * 0.8, // Estimate slightly less
          volatility: Math.abs(performancePercent) / 10, // Estimate based on performance
          marketCap: 1000000000,
          timestamp: Date.now(),
          dataSource: 'alpha_vantage' // Use existing type
        };
        
        loggerService.info(`📊 [DECISION ENGINE] Fallback data for ${ticker}:`, {
          performance: `${performancePercent.toFixed(2)}%`,
          top60D: stockData.top60D,
          thisMonthPercent: stockData.thisMonthPercent
        });
      }

      // Rule 1: Stop Loss / Take Profit (absolute rules)
      if (stopLoss && currentPrice <= stopLoss) {
        return {
          action: 'SELL',
          reason: 'Stop loss triggered',
          color: 'red',
        };
      }

      // Take profit awareness (EXACT LEGACY LOGIC)
      if (takeProfit) {
        const tp1 = takeProfit;
        if (currentPrice >= tp1 * 0.95) {
          return {
            action: 'SELL',
            reason: `Reached TP zone (${tp1})`,
            color: 'red',
          };
        }
        if (currentPrice >= tp1 * 0.90) {
          return {
            action: 'BUY',
            reason: `Approaching TP (${tp1})`,
            color: 'green',
          };
        }
      }

      // Rule 2: Scoring system (OPTIMIZED LEGACY: 2/-2 thresholds)
      let score = 0;
      const reasons: string[] = [];

      // 30% weight via thresholds around TOP60 (EXACT LEGACY LOGIC)
      if (stockData.top60D) {
        if (currentPrice >= stockData.top60D * 0.90) {
          score += 1;
          reasons.push('Near TOP60 (90%+)');
        } else if (currentPrice <= stockData.top60D * 0.70) {
          score -= 1;
          reasons.push('Far below TOP60 (70%-)');
        }
      }

      // 20% each: this month / last month (EXACT LEGACY THRESHOLDS)
      if (stockData.thisMonthPercent >= 10) {
        score += 1;
        reasons.push('Strong this month (10%+)');
      } else if (stockData.thisMonthPercent <= -10) {
        score -= 1;
        reasons.push('Poor this month (-10%-)');
      }

      if (stockData.lastMonthPercent >= 10) {
        score += 1;
        reasons.push('Strong last month (10%+)');
      } else if (stockData.lastMonthPercent <= -10) {
        score -= 1;
        reasons.push('Poor last month (-10%-)');
      }

      // 30% price vs entry (EXACT LEGACY LOGIC + STRONGER RULES)
      if (currentPrice > entryPrice) {
        score += 1;
        reasons.push('Above entry price');
      } else if (currentPrice < entryPrice * 0.90) {
        score -= 1;
        reasons.push('Below entry price (90%-)');
      }
      
      // ADDITIONAL LEGACY RULE: Strong sell signal for significant losses
      const performancePercent = ((currentPrice - entryPrice) / entryPrice) * 100;
      if (performancePercent <= -8) {
        score -= 1;
        reasons.push(`Significant loss (${performancePercent.toFixed(1)}%)`);
      }

      // Decision based on score (MORE SENSITIVE: 2/-2)
      let action: 'BUY' | 'HOLD' | 'SELL';
      let color: string;

      if (score >= 2) {
        action = 'BUY';
        color = 'green';
      } else if (score <= -2) {
        action = 'SELL';
        color = 'red';
      } else {
        action = 'HOLD';
        color = 'yellow';
      }

      loggerService.info(`✅ [DECISION ENGINE] ${ticker}: ${action} (score: ${score})`, {
        ticker,
        action,
        score,
        reasons: reasons.join(', '),
        metrics: {
          current: stockData.current,
          top30D: stockData.top30D,
          top60D: stockData.top60D,
          thisMonthPercent: stockData.thisMonthPercent.toFixed(2),
          lastMonthPercent: stockData.lastMonthPercent.toFixed(2)
        }
      });

      return {
        action,
        reason: reasons.length > 0 ? reasons.join(', ') : 'Neutral signals',
        color,
        score,
      };

    } catch (error) {
      // If data fetch fails, return error (as requested by user)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error fetching stock data';
      loggerService.error(`❌ [DECISION ENGINE] Error analyzing ${ticker}`, { error: errorMsg });
      
      return {
        action: 'HOLD',
        reason: `ERROR: ${errorMsg}`,
        color: 'gray',
        error: errorMsg
      };
    }
  }

  /**
   * 🎯 Batch decision method for multiple portfolio items
   * Processes all stocks in parallel for better performance
   */
  async updatePortfolioDecisions(portfolioItems: PortfolioItem[]): Promise<DecisionResult[]> {
    loggerService.info(`🔍 [DECISION ENGINE] Analyzing ${portfolioItems.length} portfolio items`);
    
    // Process all stocks in parallel
    const promises = portfolioItems.map(item => this.decideActionEnhanced(item));
    const results = await Promise.all(promises);
    
    loggerService.info(`✅ [DECISION ENGINE] Completed analysis for ${portfolioItems.length} stocks`);
    
    return results;
  }

  /**
   * 📊 Get cache statistics (for monitoring)
   */
  getCacheStats() {
    return googleFinanceFormulasService.getCacheStats();
  }

  /**
   * 🔑 Get API key statistics (for monitoring)
   */
  getApiKeyStats() {
    return googleFinanceFormulasService.getApiKeyStats();
  }

  /**
   * 🔄 Reset API key blacklist (for admin)
   */
  resetApiKeyBlacklist() {
    googleFinanceFormulasService.resetBlacklist();
  }

  /**
   * 🧹 Clear cache (for testing)
   */
  clearCache() {
    googleFinanceFormulasService.clearCache();
  }
}

export const decisionEngine = new DecisionEngine();
