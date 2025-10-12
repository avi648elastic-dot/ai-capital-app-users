import cron from 'node-cron';
import { decisionEngine } from './decisionEngine';
import { stockDataService } from './stockDataService';
import { volatilityService } from './volatilityService';
import { riskManagementService } from './riskManagementService';
import { historicalDataService } from './historicalDataService';
import notificationService from './notificationService';
import { redisService } from './redisService';
import { cronLockService } from './cronLockService';
import { loggerService } from './loggerService';
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
      loggerService.info('🕐 [SCHEDULER] 15-minute stock data update triggered');
      await cronLockService.withLock(
        'stock-data-update',
        () => this.updateStockData(),
        { ttl: 900, maxRetries: 2 } // 15 minutes lock, 2 retries
      );
    }, {
      timezone: 'America/New_York'
    });

    // Update portfolio decisions every 5 minutes during market hours
    cron.schedule('*/5 9-16 * * 1-5', async () => {
      loggerService.info('🕐 [SCHEDULER] 5-minute portfolio decisions update triggered');
      await cronLockService.withLock(
        'portfolio-decisions-update',
        () => this.updatePortfolioDecisions(),
        { ttl: 300, maxRetries: 2 } // 5 minutes lock, 2 retries
      );
    }, {
      timezone: 'America/New_York'
    });

    // Removed 2-minute test scheduler - users can refresh manually in admin

    // Update stock data once at 9:30 AM EST (market open)
    cron.schedule('30 9 * * 1-5', async () => {
      loggerService.info('🔔 [SCHEDULER] Market opening - updating all data');
      await cronLockService.withLock(
        'market-open-update',
        async () => {
          await this.updateStockData();
          await this.updatePortfolioDecisions();
        },
        { ttl: 1800, maxRetries: 3 } // 30 minutes lock, 3 retries
      );
    }, {
      timezone: 'America/New_York'
    });

    // Update stock data once at 4:00 PM EST (market close)
    cron.schedule('0 16 * * 1-5', async () => {
      loggerService.info('🔔 [SCHEDULER] Market closing - final update');
      await cronLockService.withLock(
        'market-close-update',
        async () => {
          await this.updateStockData();
          await this.updatePortfolioDecisions();
        },
        { ttl: 1800, maxRetries: 3 } // 30 minutes lock, 3 retries
      );
    }, {
      timezone: 'America/New_York'
    });

    // Update portfolio volatilities daily at 6:00 PM EST (after market close)
    cron.schedule('0 18 * * 1-5', async () => {
      loggerService.info('📊 [SCHEDULER] Daily volatility update triggered');
      await cronLockService.withLock(
        'volatility-update',
        () => this.updatePortfolioVolatilities(),
        { ttl: 3600, maxRetries: 2 } // 1 hour lock, 2 retries
      );
    }, {
      timezone: 'America/New_York'
    });

    // Update historical data daily at 6:30 PM EST (after market close)
    cron.schedule('30 18 * * 1-5', async () => {
      console.log('📈 [SCHEDULER] Daily historical data update triggered');
      await cronLockService.withLock(
        'historical-data-update',
        () => this.updateHistoricalData(),
        { ttl: 3600, maxRetries: 2 } // 1 hour lock, 2 retries
      );
    }, {
      timezone: 'America/New_York'
    });

    // Update risk management decisions every 2 minutes during market hours
    cron.schedule('*/2 9-16 * * 1-5', async () => {
      console.log('⚠️ [SCHEDULER] Risk management update triggered');
      await cronLockService.withLock(
        'risk-management-update',
        () => this.updateRiskManagement(),
        { ttl: 120, maxRetries: 1 } // 2 minutes lock, 1 retry
      );
    }, {
      timezone: 'America/New_York'
    });

    console.log('✅ [SCHEDULER] Scheduled updates configured');
    console.log('📅 [SCHEDULER] Stock data updates: Every 15 minutes (9:30 AM - 4:00 PM EST)');
    console.log('📅 [SCHEDULER] Portfolio decisions: Every 5 minutes (9:30 AM - 4:00 PM EST)');
    console.log('📅 [SCHEDULER] Portfolio volatilities: Daily at 6:00 PM EST');
    console.log('📅 [SCHEDULER] Risk management: Every 2 minutes (9:30 AM - 4:00 PM EST)');
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
      
      // Note: Decision engine now fetches data dynamically with 10-minute cache
      // No need to pre-load stock data anymore
      
      const duration = Date.now() - startTime;
      console.log(`✅ [SCHEDULER] Stock data cache ready (${duration}ms)`);
      
    } catch (error) {
      console.error('❌ [SCHEDULER] Error updating stock data:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async updatePortfolioDecisions() {
    try {
      console.log('🔄 [SCHEDULER] Updating portfolio decisions and prices...');
      
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
          // Get unique tickers for this user
          const tickers = [...new Set(userPortfolio.map((item: any) => item.ticker))];
          
          // Fetch real-time prices for this user's stocks
          let realTimeData = new Map();
          try {
            realTimeData = await stockDataService.getMultipleStockData(tickers);
            console.log(`📊 [SCHEDULER] Fetched real-time data for user ${userId}: ${realTimeData.size} stocks`);
          } catch (priceError) {
            console.warn(`⚠️ [SCHEDULER] Could not fetch real-time prices for user ${userId}:`, priceError);
          }

          for (const portfolioItem of userPortfolio) {
            // Get real-time price if available
            const realTimeStock = realTimeData.get(portfolioItem.ticker);
            const newCurrentPrice = realTimeStock?.current || portfolioItem.currentPrice;
            
            // Calculate decision with real-time price
            const decision = await decisionEngine.decideActionEnhanced({
              ticker: portfolioItem.ticker,
              entryPrice: portfolioItem.entryPrice,
              currentPrice: newCurrentPrice,
              stopLoss: portfolioItem.stopLoss,
              takeProfit: portfolioItem.takeProfit,
            });

            // Check if anything needs updating
            const needsUpdate = 
              portfolioItem.action !== decision.action || 
              portfolioItem.reason !== decision.reason ||
              portfolioItem.currentPrice !== newCurrentPrice;

            if (needsUpdate) {
              const previousAction = portfolioItem.action;
              const previousReason = portfolioItem.reason;
              
              portfolioItem.action = decision.action;
              portfolioItem.reason = decision.reason;
              portfolioItem.color = decision.color;
              portfolioItem.currentPrice = newCurrentPrice; // ✅ Update price in database
              
              await portfolioItem.save();
              updatedCount++;
              
              // Send notification ONLY for SELL actions (user-specific notifications)
              if (previousAction && previousAction !== decision.action && decision.action === 'SELL') {
                try {
                  await notificationService.createStockActionNotification(
                    userId,
                    portfolioItem.ticker,
                    decision.action,
                    decision.reason,
                    portfolioItem.portfolioId
                  );
                  console.log(`🔔 [SCHEDULER] Sent SELL notification for ${portfolioItem.ticker} to user ${userId}: ${previousAction} → ${decision.action}`);
                } catch (notificationError) {
                  console.error(`❌ [SCHEDULER] Failed to send SELL notification for ${portfolioItem.ticker}:`, notificationError);
                }
              }
            }
          }
        } catch (error) {
          console.error(`❌ [SCHEDULER] Error updating portfolio for user ${userId}:`, error);
        }
      }

      console.log(`✅ [SCHEDULER] Updated ${updatedCount} portfolio items (decisions + prices)`);
      
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
   * Update historical data for analytics
   */
  private async updateHistoricalData() {
    try {
      console.log('🔄 [SCHEDULER] Updating historical data for analytics...');
      
      // Get all unique tickers from all portfolios
      const portfolios = await Portfolio.find({});
      const uniqueTickers = [...new Set(portfolios.map(p => p.ticker))];
      
      console.log(`📊 [SCHEDULER] Updating historical data for ${uniqueTickers.length} tickers`);
      
      // Update historical data for each ticker
      for (const ticker of uniqueTickers) {
        try {
          // Get 90 days of historical data
          const historicalData = await historicalDataService.getHistoricalData(ticker, 90);
          if (historicalData.length > 0) {
            console.log(`✅ [SCHEDULER] Updated ${historicalData.length} days of data for ${ticker}`);
          }
        } catch (error) {
          console.error(`❌ [SCHEDULER] Error updating historical data for ${ticker}:`, error);
        }
      }
      
      console.log('✅ [SCHEDULER] Historical data update completed');
    } catch (error) {
      console.error('❌ [SCHEDULER] Error updating historical data:', error);
    }
  }

  /**
   * Manually trigger historical data update
   */
  async triggerHistoricalDataUpdate() {
    console.log('🔧 [SCHEDULER] Manual historical data update triggered');
    await this.updateHistoricalData();
  }

  /**
   * Update risk management for all users
   */
  private async updateRiskManagement() {
    try {
      console.log('🔄 [SCHEDULER] Updating risk management...');
      
      // Get all unique user IDs
      const userIds = await Portfolio.distinct('userId');
      
      for (const userId of userIds) {
        try {
          await riskManagementService.updatePortfolioDecisions(userId);
        } catch (error) {
          console.error(`❌ [SCHEDULER] Error updating risk management for user ${userId}:`, error);
        }
      }
      
      console.log('✅ [SCHEDULER] Risk management updated for all users');
    } catch (error) {
      console.error('❌ [SCHEDULER] Error updating risk management:', error);
    }
  }

  /**
   * Manually trigger risk management update
   */
  async triggerRiskManagementUpdate() {
    console.log('🔧 [SCHEDULER] Manual risk management update triggered');
    await this.updateRiskManagement();
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

  /**
   * 🔒 Legacy locking methods removed - now using cronLockService.withLock()
   * This provides better Redis connection handling and error recovery
   */
}

export const schedulerService = new SchedulerService();
