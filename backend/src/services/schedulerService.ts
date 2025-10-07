import cron from 'node-cron';
import { decisionEngine } from './decisionEngine';
import { stockDataService } from './stockDataService';
import { volatilityService } from './volatilityService';
import Portfolio from '../models/Portfolio';

export class SchedulerService {
  private isRunning = false;

  constructor() {
    this.startScheduler();
  }

  private startScheduler() {
    console.log('🕐 [SCHEDULER] Starting scheduled updates...');
    
    // Update stock data every 15 minutes during market hours (9:30 AM - 4:00 PM EST)
    // This runs every 15 minutes from 9:30 AM to 4:00 PM EST (Monday-Friday)
    cron.schedule('*/15 9-16 * * 1-5', async () => {
      console.log('🕐 [SCHEDULER] 15-minute stock data update triggered');
      await this.updateStockData();
    }, {
      timezone: 'America/New_York'
    });

    // Update portfolio decisions every 5 minutes during market hours
    cron.schedule('*/5 9-16 * * 1-5', async () => {
      console.log('🕐 [SCHEDULER] 5-minute portfolio decisions update triggered');
      await this.updatePortfolioDecisions();
    }, {
      timezone: 'America/New_York'
    });

    // For testing: Also run every 2 minutes regardless of market hours
    cron.schedule('*/2 * * * *', async () => {
      const now = new Date();
      const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
      const hour = est.getHours();
      const day = est.getDay();
      
      console.log(`🕐 [SCHEDULER] Test update - EST: ${est.toLocaleString()}, Market hours: ${day >= 1 && day <= 5 && hour >= 9 && hour < 16}`);
      
      if (day >= 1 && day <= 5 && hour >= 9 && hour < 16) {
        console.log('🕐 [SCHEDULER] Market is open - running updates');
        await this.updateStockData();
        await this.updatePortfolioDecisions();
      } else {
        console.log('🕐 [SCHEDULER] Market is closed - skipping updates');
      }
    });

    // Update stock data once at 9:30 AM EST (market open)
    cron.schedule('30 9 * * 1-5', async () => {
      console.log('🔔 [SCHEDULER] Market opening - updating all data');
      await this.updateStockData();
      await this.updatePortfolioDecisions();
    }, {
      timezone: 'America/New_York'
    });

    // Update stock data once at 4:00 PM EST (market close)
    cron.schedule('0 16 * * 1-5', async () => {
      console.log('🔔 [SCHEDULER] Market closing - final update');
      await this.updateStockData();
      await this.updatePortfolioDecisions();
    }, {
      timezone: 'America/New_York'
    });

    // Update portfolio volatilities daily at 6:00 PM EST (after market close)
    cron.schedule('0 18 * * 1-5', async () => {
      console.log('📊 [SCHEDULER] Daily volatility update triggered');
      await this.updatePortfolioVolatilities();
    }, {
      timezone: 'America/New_York'
    });

    console.log('✅ [SCHEDULER] Scheduled updates configured');
    console.log('📅 [SCHEDULER] Stock data updates: Every 15 minutes (9:30 AM - 4:00 PM EST)');
    console.log('📅 [SCHEDULER] Portfolio decisions: Every 5 minutes (9:30 AM - 4:00 PM EST)');
    console.log('📅 [SCHEDULER] Portfolio volatilities: Daily at 6:00 PM EST');
  }

  private async updateStockData() {
    if (this.isRunning) {
      console.log('⏳ [SCHEDULER] Stock data update already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('🔄 [SCHEDULER] Updating stock data...');
      
      // Reload stock data in decision engine
      await decisionEngine.loadStockData();
      
      const duration = Date.now() - startTime;
      console.log(`✅ [SCHEDULER] Stock data updated in ${duration}ms`);
      
    } catch (error) {
      console.error('❌ [SCHEDULER] Error updating stock data:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async updatePortfolioDecisions() {
    try {
      console.log('🔄 [SCHEDULER] Updating portfolio decisions...');
      
      // Get all portfolios that need updating
      const portfolios = await Portfolio.find({});
      
      if (portfolios.length === 0) {
        console.log('ℹ️ [SCHEDULER] No portfolios to update');
        return;
      }

      let updatedCount = 0;
      
      // Group portfolios by user to avoid duplicate API calls
      const userPortfolios = new Map<string, any[]>();
      portfolios.forEach(portfolio => {
        if (!userPortfolios.has(portfolio.userId.toString())) {
          userPortfolios.set(portfolio.userId.toString(), []);
        }
        userPortfolios.get(portfolio.userId.toString())!.push(portfolio);
      });

      // Update each user's portfolio
      for (const [userId, userPortfolio] of userPortfolios) {
        try {
          for (const portfolioItem of userPortfolio) {
            const decision = decisionEngine.decideActionEnhanced({
              ticker: portfolioItem.ticker,
              entryPrice: portfolioItem.entryPrice,
              currentPrice: portfolioItem.currentPrice,
              stopLoss: portfolioItem.stopLoss,
              takeProfit: portfolioItem.takeProfit,
            });

            // Only update if decision changed
            if (portfolioItem.action !== decision.action || 
                portfolioItem.reason !== decision.reason) {
              
              portfolioItem.action = decision.action;
              portfolioItem.reason = decision.reason;
              portfolioItem.color = decision.color;
              
              await portfolioItem.save();
              updatedCount++;
            }
          }
        } catch (error) {
          console.error(`❌ [SCHEDULER] Error updating portfolio for user ${userId}:`, error);
        }
      }

      console.log(`✅ [SCHEDULER] Updated ${updatedCount} portfolio decisions`);
      
    } catch (error) {
      console.error('❌ [SCHEDULER] Error updating portfolio decisions:', error);
    }
  }

  /**
   * Manually trigger stock data update
   */
  async triggerStockDataUpdate() {
    console.log('🔧 [SCHEDULER] Manual stock data update triggered');
    await this.updateStockData();
  }

  /**
   * Manually trigger portfolio decisions update
   */
  async triggerPortfolioUpdate() {
    console.log('🔧 [SCHEDULER] Manual portfolio update triggered');
    await this.updatePortfolioDecisions();
  }

  /**
   * Update portfolio volatilities
   */
  private async updatePortfolioVolatilities() {
    try {
      console.log('🔄 [SCHEDULER] Updating portfolio volatilities...');
      await volatilityService.updateAllPortfolioVolatilities();
      console.log('✅ [SCHEDULER] Portfolio volatilities updated');
    } catch (error) {
      console.error('❌ [SCHEDULER] Error updating portfolio volatilities:', error);
    }
  }

  /**
   * Manually trigger volatility update
   */
  async triggerVolatilityUpdate() {
    console.log('🔧 [SCHEDULER] Manual volatility update triggered');
    await this.updatePortfolioVolatilities();
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isMarketHours: this.isMarketHours(),
      nextUpdate: this.getNextUpdateTime()
    };
  }

  private isMarketHours(): boolean {
    const now = new Date();
    const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const hour = est.getHours();
    const minute = est.getMinutes();
    const day = est.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Market is open Monday-Friday, 9:30 AM - 4:00 PM EST
    if (day >= 1 && day <= 5) {
      if (hour > 9 || (hour === 9 && minute >= 30)) {
        if (hour < 16) {
          return true;
        }
      }
    }
    
    return false;
  }

  private getNextUpdateTime(): string {
    const now = new Date();
    const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    
    // If market is closed, next update is at 9:30 AM EST next business day
    if (!this.isMarketHours()) {
      const nextDay = new Date(est);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(9, 30, 0, 0);
      return nextDay.toLocaleString("en-US", {timeZone: "America/New_York"});
    }
    
    // If market is open, next update is in 5 minutes
    const nextUpdate = new Date(est);
    nextUpdate.setMinutes(nextUpdate.getMinutes() + 5);
    return nextUpdate.toLocaleString("en-US", {timeZone: "America/New_York"});
  }
}

export const schedulerService = new SchedulerService();
