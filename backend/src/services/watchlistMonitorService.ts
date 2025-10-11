import Watchlist from '../models/Watchlist';
import Notification from '../models/Notification';
import { googleFinanceFormulasService } from './googleFinanceFormulasService';
import { loggerService } from './loggerService';

class WatchlistMonitorService {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
  private isMonitoring = false;

  /**
   * Start the automated watchlist monitoring service
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      loggerService.warn('⚠️ [WATCHLIST MONITOR] Service already running');
      return;
    }

    loggerService.info('🚀 [WATCHLIST MONITOR] Starting automated price monitoring service');
    
    // Run immediately
    this.checkAllWatchlists();
    
    // Then run every 5 minutes
    this.monitoringInterval = setInterval(() => {
      this.checkAllWatchlists();
    }, this.CHECK_INTERVAL);
    
    this.isMonitoring = true;
    
    loggerService.info(`✅ [WATCHLIST MONITOR] Service started - checking prices every ${this.CHECK_INTERVAL / 1000}s`);
  }

  /**
   * Stop the automated watchlist monitoring service
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isMonitoring = false;
      loggerService.info('🛑 [WATCHLIST MONITOR] Service stopped');
    }
  }

  /**
   * Check all watchlists for price alerts
   */
  private async checkAllWatchlists(): Promise<void> {
    try {
      loggerService.info('🔍 [WATCHLIST MONITOR] Starting price check cycle');
      
      // Find all watchlist items with enabled price alerts
      const watchlistItems = await Watchlist.find({
        'priceAlert.enabled': true,
        notifications: true
      });
      
      if (watchlistItems.length === 0) {
        loggerService.info('ℹ️ [WATCHLIST MONITOR] No active price alerts to check');
        return;
      }
      
      loggerService.info(`📊 [WATCHLIST MONITOR] Checking ${watchlistItems.length} stocks with active alerts`);
      
      let alertsTriggered = 0;
      let pricesChecked = 0;
      let errors = 0;
      
      // Process in batches to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < watchlistItems.length; i += batchSize) {
        const batch = watchlistItems.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (item) => {
            try {
              await this.checkWatchlistItem(item);
              pricesChecked++;
            } catch (error) {
              errors++;
              loggerService.error(`❌ [WATCHLIST MONITOR] Error checking ${item.ticker}`, {
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          })
        );
        
        // Small delay between batches
        if (i + batchSize < watchlistItems.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      loggerService.info(`✅ [WATCHLIST MONITOR] Price check cycle complete`, {
        totalStocks: watchlistItems.length,
        pricesChecked,
        alertsTriggered,
        errors
      });
      
    } catch (error) {
      loggerService.error('❌ [WATCHLIST MONITOR] Error in check cycle', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check a single watchlist item for price alerts
   */
  private async checkWatchlistItem(item: any): Promise<void> {
    try {
      // Fetch current price
      const metrics = await googleFinanceFormulasService.getStockMetrics(item.ticker);
      
      if (!metrics || !metrics.current) {
        loggerService.warn(`⚠️ [WATCHLIST MONITOR] No price data for ${item.ticker}`);
        return;
      }
      
      const currentPrice = metrics.current;
      
      // Update last checked time and last price
      item.lastChecked = new Date();
      item.lastPrice = currentPrice;
      
      // Check if price alert is triggered
      const alertResult = item.checkPriceAlert(currentPrice);
      
      if (alertResult.triggered) {
        loggerService.info(`🔔 [WATCHLIST MONITOR] Alert triggered for ${item.ticker}`, {
          type: alertResult.type,
          currentPrice,
          alertPrice: alertResult.type === 'high' ? item.priceAlert.highPrice : item.priceAlert.lowPrice
        });
        
        // Create notification
        await this.createPriceAlertNotification(
          item.userId,
          item.ticker,
          currentPrice,
          alertResult.type!,
          alertResult.message!
        );
        
        // Mark alert as triggered
        await item.markAlertTriggered();
        
        // Optionally disable alert after first trigger
        // item.priceAlert.enabled = false;
        
        loggerService.info(`✅ [WATCHLIST MONITOR] Notification sent for ${item.ticker} alert`);
      }
      
      // Save updated item
      await item.save();
      
    } catch (error) {
      loggerService.error(`❌ [WATCHLIST MONITOR] Error checking ${item.ticker}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Create a price alert notification
   */
  private async createPriceAlertNotification(
    userId: any,
    ticker: string,
    currentPrice: number,
    alertType: 'high' | 'low',
    message: string
  ): Promise<void> {
    try {
      const notification = new Notification({
        userId: userId.toString(),
        type: 'success',
        title: `Price Alert: ${ticker}`,
        message,
        priority: 'high',
        category: 'market',
        actionData: {
          ticker,
          action: alertType === 'high' ? 'SELL' : 'BUY' as 'BUY' | 'SELL' | 'HOLD'
        },
        channels: {
          dashboard: true,
          popup: true,
          email: false
        },
        status: 'pending'
      });
      
      await notification.save();
      
      loggerService.info(`📬 [WATCHLIST MONITOR] Notification created for user ${userId}`, {
        ticker,
        alertType,
        currentPrice
      });
      
    } catch (error) {
      loggerService.error('❌ [WATCHLIST MONITOR] Error creating notification', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Manually trigger a price check for a specific user
   */
  public async checkUserWatchlist(userId: string): Promise<{
    success: boolean;
    checked: number;
    alertsTriggered: number;
    errors: number;
  }> {
    try {
      const watchlistItems = await Watchlist.find({
        userId,
        'priceAlert.enabled': true,
        notifications: true
      });
      
      let alertsTriggered = 0;
      let errors = 0;
      
      for (const item of watchlistItems) {
        try {
          const alertResult = await this.checkWatchlistItem(item);
          if (alertResult) {
            alertsTriggered++;
          }
        } catch (error) {
          errors++;
        }
      }
      
      return {
        success: true,
        checked: watchlistItems.length,
        alertsTriggered,
        errors
      };
      
    } catch (error) {
      loggerService.error('❌ [WATCHLIST MONITOR] Error checking user watchlist', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        success: false,
        checked: 0,
        alertsTriggered: 0,
        errors: 1
      };
    }
  }

  /**
   * Get monitoring service status
   */
  public getStatus(): {
    isMonitoring: boolean;
    checkInterval: number;
    checkIntervalMinutes: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      checkInterval: this.CHECK_INTERVAL,
      checkIntervalMinutes: this.CHECK_INTERVAL / 60000
    };
  }
}

// Export singleton instance
export const watchlistMonitorService = new WatchlistMonitorService();

