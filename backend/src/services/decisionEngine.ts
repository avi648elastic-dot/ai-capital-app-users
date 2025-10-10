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
      const stockData = await googleFinanceFormulasService.getStockMetrics(ticker);

      // Rule 1: Stop Loss / Take Profit (absolute rules)
      if (stopLoss && currentPrice <= stopLoss) {
        return {
          action: 'SELL',
          reason: 'Stop loss triggered',
          color: 'red',
        };
      }

      if (takeProfit && currentPrice >= takeProfit) {
        return {
          action: 'SELL',
          reason: 'Take profit target reached',
          color: 'green',
        };
      }

      // Rule 2: Scoring system (original thresholds: 3/-3)
      let score = 0;
      const reasons: string[] = [];

      // Current vs TOP30/TOP60 (30% weight)
      const top60Ratio = stockData.current / stockData.top60D;
      if (top60Ratio > 0.95) {
        score += 1;
        reasons.push('Strong vs TOP60');
      } else if (top60Ratio < 0.5) {
        score -= 1;
        reasons.push('Weak vs TOP60');
      }

      // This Month % (20% weight)
      if (stockData.thisMonthPercent > 15) {
        score += 1;
        reasons.push('Strong monthly performance');
      } else if (stockData.thisMonthPercent < -20) {
        score -= 1;
        reasons.push('Poor monthly performance');
      }

      // Last Month % (20% weight)
      if (stockData.lastMonthPercent > 15) {
        score += 1;
        reasons.push('Strong previous month');
      } else if (stockData.lastMonthPercent < -20) {
        score -= 1;
        reasons.push('Poor previous month');
      }

      // Price vs Entry (30% weight)
      const priceChange = ((currentPrice - entryPrice) / entryPrice) * 100;
      if (priceChange > 5) {
        score += 1;
        reasons.push('Above entry price');
      } else if (priceChange < -15) {
        score -= 1;
        reasons.push('Below entry price');
      }

      // Decision based on score (original thresholds: 3/-3)
      let action: 'BUY' | 'HOLD' | 'SELL';
      let color: string;

      if (score >= 3) {
        action = 'BUY';
        color = 'green';
      } else if (score <= -3) {
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
   * 🧹 Clear cache (for testing)
   */
  clearCache() {
    googleFinanceFormulasService.clearCache();
  }
}

export const decisionEngine = new DecisionEngine();
