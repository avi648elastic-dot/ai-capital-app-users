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
import emailService from './emailService';
import User from '../models/User';
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

    // Check and downgrade expired trial users daily at midnight UTC
    cron.schedule('0 0 * * *', async () => {
      loggerService.info('🎁 [SCHEDULER] Daily trial expiration check triggered');
      await cronLockService.withLock(
        'trial-expiration-check',
        () => this.checkTrialExpiration(),
        { ttl: 3600, maxRetries: 2 } // 1 hour lock, 2 retries
      );
    }, {
      timezone: 'UTC'
    });

    console.log('✅ [SCHEDULER] Scheduled updates configured');
    console.log('📅 [SCHEDULER] Stock data updates: Every 15 minutes (9:30 AM - 4:00 PM EST)');
    console.log('📅 [SCHEDULER] Portfolio decisions: Every 5 minutes (9:30 AM - 4:00 PM EST)');
    console.log('📅 [SCHEDULER] Portfolio volatilities: Daily at 6:00 PM EST');
    console.log('📅 [SCHEDULER] Risk management: Every 2 minutes (9:30 AM - 4:00 PM EST)');
    console.log('📅 [SCHEDULER] Trial expiration check: Daily at midnight UTC');
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
      
      // Get all portfolios that need updating (exclude training stocks)
      const portfolios = await Portfolio.find({
        isTraining: { $ne: true } // Exclude training stocks from decision updates
      });
      
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
          // 🔍 Check if user exists before processing their portfolio
          const User = (await import('../models/User')).default;
          const user = await User.findById(userId);
          
          if (!user) {
            console.warn(`⚠️ [SCHEDULER] User ${userId} no longer exists - skipping orphaned portfolios`);
            continue; // Skip this user's portfolios
          }

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
      
      // Update historical data for each ticker (store last 120 days)
      for (let i = 0; i < uniqueTickers.length; i++) {
        const ticker = uniqueTickers[i];
        try {
          // Get 120 days of historical data
          const historicalData = await historicalDataService.getHistoricalData(ticker, 120);
          if (historicalData.length > 0) {
            console.log(`✅ [SCHEDULER] Updated ${historicalData.length} days of data for ${ticker}`);
          }
          
          // Small delay to avoid rate limiting (except for last ticker)
          if (i < uniqueTickers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
          }
        } catch (error) {
          console.error(`❌ [SCHEDULER] Error updating historical data for ${ticker}:`, error);
          // Still add delay even on error to avoid rate limiting
          if (i < uniqueTickers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
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
          // 🔍 Check if user exists before processing their risk management
          const User = (await import('../models/User')).default;
          const user = await User.findById(userId);
          
          if (!user) {
            console.warn(`⚠️ [SCHEDULER] User ${userId} no longer exists - skipping risk management update`);
            continue; // Skip this user
          }

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
   * Check and downgrade users whose trial period has expired
   */
  private async checkTrialExpiration(): Promise<void> {
    try {
      loggerService.info('🎁 [TRIAL CHECK] Checking for expired trial users...');
      const now = new Date();
      
      // Find all users with active trials that have expired
      const expiredTrialUsers = await User.find({
        isTrialActive: true,
        trialEndDate: { $lt: now }, // Trial ended before now
        subscriptionTier: 'premium+',
        // Don't downgrade users who have paid subscriptions
        $or: [
          { stripeSubscriptionId: { $exists: false } },
          { stripeSubscriptionId: null },
          { subscriptionStatus: { $ne: 'active' } }
        ]
      });

      loggerService.info(`📊 [TRIAL CHECK] Found ${expiredTrialUsers.length} expired trial users to downgrade`);

      let downgradedCount = 0;
      let skippedAdminCount = 0;

      for (const user of expiredTrialUsers) {
        try {
          // Don't downgrade admin users
          if (user.isAdmin === true || user.role === 'admin') {
            skippedAdminCount++;
            loggerService.info(`⏭️ [TRIAL CHECK] Skipping admin user: ${user.email}`);
            continue;
          }

          // Downgrade to free tier
          await User.findByIdAndUpdate(user._id, {
            subscriptionTier: 'free',
            subscriptionActive: false,
            isTrialActive: false,
            subscriptionStatus: 'canceled'
          });

          downgradedCount++;
          loggerService.info(`✅ [TRIAL CHECK] Downgraded user to free: ${user.email} (trial ended: ${user.trialEndDate?.toISOString()})`);
        } catch (error) {
          loggerService.error(`❌ [TRIAL CHECK] Error downgrading user ${user.email}:`, error);
        }
      }

      loggerService.info(`✅ [TRIAL CHECK] Completed: ${downgradedCount} users downgraded, ${skippedAdminCount} admins skipped`);
      
      // Also check for users whose trial is about to expire soon (for notifications)
      // Check for users expiring in 7 days, 3 days, and 1 day
      await this.sendTrialExpirationReminders(now);

    } catch (error) {
      loggerService.error('❌ [TRIAL CHECK] Error checking trial expiration:', error);
    }
  }

  /**
   * Send trial expiration reminder emails
   * Checks for users expiring in 7 days, 3 days, and 1 day
   */
  private async sendTrialExpirationReminders(now: Date): Promise<void> {
    try {
      loggerService.info('📧 [TRIAL REMINDERS] Checking for users whose trial is expiring soon...');
      
      // Define reminder thresholds: 7 days, 3 days, and 1 day
      const reminderDays = [7, 3, 1];
      
      for (const daysThreshold of reminderDays) {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + daysThreshold);
        
        // Find users whose trial expires exactly on this date (within 24 hours)
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const usersExpiringOnDate = await User.find({
          isTrialActive: true,
          trialEndDate: { $gte: startOfDay, $lte: endOfDay },
          subscriptionTier: 'premium+',
          // Don't send to users who already have paid subscriptions
          $or: [
            { stripeSubscriptionId: { $exists: false } },
            { stripeSubscriptionId: null },
            { subscriptionStatus: { $ne: 'active' } }
          ]
        });
        
        loggerService.info(`📧 [TRIAL REMINDERS] Found ${usersExpiringOnDate.length} users expiring in ${daysThreshold} day(s)`);
        
        let emailsSent = 0;
        let emailsFailed = 0;
        
        for (const user of usersExpiringOnDate) {
          try {
            // Check if user wants to receive email updates
            if (user.emailUpdates === false) {
              loggerService.info(`⏭️ [TRIAL REMINDERS] Skipping ${user.email} - email updates disabled`);
              continue;
            }
            
            // Calculate exact days remaining
            const daysRemaining = Math.ceil((user.trialEndDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysRemaining !== daysThreshold) {
              // Skip if not exactly at threshold (to avoid duplicate emails)
              continue;
            }
            
            const success = await emailService.sendTrialExpirationEmail(user.email, {
              name: user.name,
              daysRemaining: daysRemaining,
              trialEndDate: user.trialEndDate!
            });
            
            if (success) {
              emailsSent++;
              loggerService.info(`✅ [TRIAL REMINDERS] Sent ${daysThreshold}-day reminder to ${user.email}`);
            } else {
              emailsFailed++;
              loggerService.warn(`⚠️ [TRIAL REMINDERS] Failed to send reminder to ${user.email}`);
            }
          } catch (error) {
            emailsFailed++;
            loggerService.error(`❌ [TRIAL REMINDERS] Error sending reminder to ${user.email}:`, error);
          }
        }
        
        loggerService.info(`✅ [TRIAL REMINDERS] ${daysThreshold}-day reminders: ${emailsSent} sent, ${emailsFailed} failed`);
      }
    } catch (error) {
      loggerService.error('❌ [TRIAL REMINDERS] Error sending trial expiration reminders:', error);
    }
  }

  /**
   * 🔒 Legacy locking methods removed - now using cronLockService.withLock()
   * This provides better Redis connection handling and error recovery
   */
}

export const schedulerService = new SchedulerService();
