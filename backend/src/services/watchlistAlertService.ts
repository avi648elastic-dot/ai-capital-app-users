// Watchlist Alert Service
// Major's requirement: "Connect watchlist alerts to real notification system"

import Watchlist from '../models/Watchlist';
import notificationService from './notificationService';
import { loggerService } from './loggerService';
import { googleFinanceFormulasService } from './googleFinanceFormulasService';

interface AlertCheckResult {
  ticker: string;
  currentPrice: number;
  alertTriggered: boolean;
  alertType: 'high' | 'low' | 'both' | null;
  triggeredPrice: number;
  message: string;
}

class WatchlistAlertService {
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  /**
   * Start monitoring watchlist alerts
   */
  startMonitoring(): void {
    if (this.isRunning) {
      loggerService.warn('⚠️ [WATCHLIST ALERTS] Already running');
      return;
    }

    this.isRunning = true;
    loggerService.info('🚨 [WATCHLIST ALERTS] Starting alert monitoring');

    // Check immediately
    this.checkAllAlerts();

    // Set up interval
    this.checkInterval = setInterval(() => {
      this.checkAllAlerts();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Stop monitoring watchlist alerts
   */
  stopMonitoring(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    loggerService.info('🛑 [WATCHLIST ALERTS] Stopping alert monitoring');

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check all active watchlist alerts
   */
  private async checkAllAlerts(): Promise<void> {
    try {
      // Get all watchlist items with active alerts
      const watchlistItems = await Watchlist.find({
        'priceAlert.enabled': true,
        'priceAlert.highPrice': { $exists: true, $ne: null },
        $or: [
          { 'priceAlert.lowPrice': { $exists: true, $ne: null } },
          { 'priceAlert.type': { $in: ['high', 'both'] } }
        ]
      });

      if (watchlistItems.length === 0) {
        return;
      }

      loggerService.info(`🔍 [WATCHLIST ALERTS] Checking ${watchlistItems.length} active alerts`);

      // Check each item
      for (const item of watchlistItems) {
        await this.checkItemAlert(item);
      }

    } catch (error) {
      loggerService.error('❌ [WATCHLIST ALERTS] Error checking alerts', { error });
    }
  }

  /**
   * Check alert for a specific watchlist item
   * Only create notifications for stocks in user's portfolio
   */
  private async checkItemAlert(item: any): Promise<void> {
    try {
      // Note: Users can set watchlist alerts for stocks they don't own yet
      // This allows alerts for potential purchases, not just current holdings
      loggerService.info(`🔍 [WATCHLIST ALERTS] Checking alert for ${item.ticker} (user: ${item.userId})`);

      // Get current price
      const metrics = await googleFinanceFormulasService.getStockMetrics(item.ticker);
      
      if (!metrics || !metrics.current) {
        loggerService.warn(`⚠️ [WATCHLIST ALERTS] No price data for ${item.ticker}`);
        return;
      }

      const currentPrice = metrics.current;
      
      // CRITICAL FIX: Update lastPrice BEFORE checking (needed for threshold crossing detection)
      const previousPrice = item.lastPrice;
      item.lastPrice = currentPrice;
      
      // Use the Watchlist model's checkPriceAlert method (with threshold crossing logic)
      const alertResult = item.checkPriceAlert(currentPrice);
      
      if (alertResult.triggered) {
        const alert = item.priceAlert;
        const alertType = alertResult.type!;
        const triggeredPrice = alertType === 'high' ? alert.highPrice : alert.lowPrice;
        
        loggerService.info(`🔔 [WATCHLIST ALERTS] Alert triggered for ${item.ticker}`, {
          type: alertType,
          previousPrice,
          currentPrice,
          threshold: triggeredPrice,
          crossedThreshold: true
        });
        
        await this.triggerAlert(item, currentPrice, alertType, triggeredPrice, alertResult.message!);
      } else {
        // Save the updated lastPrice even if no alert triggered
        await item.save();
      }

    } catch (error) {
      loggerService.error(`❌ [WATCHLIST ALERTS] Error checking ${item.ticker}`, { error });
    }
  }

  /**
   * Trigger an alert and send notification
   */
  private async triggerAlert(
    item: any, 
    currentPrice: number, 
    alertType: 'high' | 'low', 
    triggeredPrice: number, 
    message: string
  ): Promise<void> {
    try {
      loggerService.info(`🚨 [WATCHLIST ALERTS] Alert triggered for ${item.ticker}`, {
        currentPrice,
        alertType,
        triggeredPrice,
        message
      });

      // Increment trigger count
      await Watchlist.findByIdAndUpdate(item._id, {
        $inc: { 'priceAlert.triggeredCount': 1 },
        $set: { 'priceAlert.lastTriggered': new Date() }
      });

      // Create notification
      await notificationService.createNotification({
        userId: item.userId,
        type: 'action',
        priority: 'high',
        title: `🎯 Price Alert: ${item.ticker}`,
        message: message,
        actionData: {
          ticker: item.ticker,
          action: alertType === 'high' ? 'SELL' : 'BUY',
          reason: `Price ${alertType === 'high' ? 'above' : 'below'} target`
        }
      });

    } catch (error) {
      loggerService.error(`❌ [WATCHLIST ALERTS] Error triggering alert for ${item.ticker}`, { error });
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(): Promise<{
    totalAlerts: number;
    activeAlerts: number;
    triggeredToday: number;
  }> {
    try {
      const totalAlerts = await Watchlist.countDocuments({
        'priceAlert': { $exists: true, $ne: null }
      });

      const activeAlerts = await Watchlist.countDocuments({
        'priceAlert.enabled': true
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const triggeredToday = await Watchlist.countDocuments({
        'priceAlert.lastTriggered': { $gte: today }
      });

      return {
        totalAlerts,
        activeAlerts,
        triggeredToday
      };
    } catch (error) {
      loggerService.error('❌ [WATCHLIST ALERTS] Error getting stats', { error });
      return {
        totalAlerts: 0,
        activeAlerts: 0,
        triggeredToday: 0
      };
    }
  }
}

// Create singleton instance
export const watchlistAlertService = new WatchlistAlertService();
