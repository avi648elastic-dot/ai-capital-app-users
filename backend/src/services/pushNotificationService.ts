import { loggerService } from './loggerService';

interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

interface UserPushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: Date;
}

class PushNotificationService {
  private subscriptions: Map<string, UserPushSubscription[]> = new Map();
  private vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || ''
  };

  constructor() {
    this.loadSubscriptions();
  }

  /**
   * Register a push subscription for a user
   */
  async registerSubscription(
    userId: string,
    subscription: any,
    userAgent?: string
  ): Promise<boolean> {
    try {
      const userSubscriptions = this.subscriptions.get(userId) || [];
      
      // Check if subscription already exists
      const exists = userSubscriptions.find(sub => sub.endpoint === subscription.endpoint);
      if (exists) {
        loggerService.info(`📱 [PUSH] Subscription already exists for user ${userId}`);
        return true;
      }

      const pushSubscription: UserPushSubscription = {
        userId,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        },
        userAgent,
        createdAt: new Date()
      };

      userSubscriptions.push(pushSubscription);
      this.subscriptions.set(userId, userSubscriptions);
      
      await this.saveSubscriptions();
      
      loggerService.info(`✅ [PUSH] Registered push subscription for user ${userId}`);
      return true;
    } catch (error) {
      loggerService.error(`❌ [PUSH] Failed to register subscription for user ${userId}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(
    userId: string,
    notification: PushNotificationData
  ): Promise<{ sent: number; failed: number }> {
    const userSubscriptions = this.subscriptions.get(userId);
    if (!userSubscriptions || userSubscriptions.length === 0) {
      loggerService.warn(`⚠️ [PUSH] No subscriptions found for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const subscription of userSubscriptions) {
      try {
        await this.sendPushNotification(subscription, notification);
        sent++;
        loggerService.info(`✅ [PUSH] Sent to user ${userId}`);
      } catch (error) {
        failed++;
        loggerService.error(`❌ [PUSH] Failed to send to user ${userId}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          endpoint: subscription.endpoint
        });
        
        // Remove invalid subscription
        await this.removeSubscription(userId, subscription.endpoint);
      }
    }

    return { sent, failed };
  }

  /**
   * Send push notification to all users (global)
   */
  async sendToAllUsers(notification: PushNotificationData): Promise<{
    totalUsers: number;
    sent: number;
    failed: number;
  }> {
    let totalSent = 0;
    let totalFailed = 0;
    let totalUsers = 0;

    for (const [userId, subscriptions] of this.subscriptions) {
      totalUsers++;
      const result = await this.sendToUser(userId, notification);
      totalSent += result.sent;
      totalFailed += result.failed;
    }

    loggerService.info(`📢 [PUSH] Global notification sent`, {
      totalUsers,
      sent: totalSent,
      failed: totalFailed
    });

    return { totalUsers, sent: totalSent, failed: totalFailed };
  }

  /**
   * Send actual push notification using web-push library
   */
  private async sendPushNotification(
    subscription: UserPushSubscription,
    notification: PushNotificationData
  ): Promise<void> {
    // For now, we'll simulate push notifications
    // In production, you'd use the 'web-push' library:
    
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/logo.png',
      badge: notification.badge || '/logo.png',
      tag: notification.tag,
      data: notification.data,
      actions: notification.actions,
      requireInteraction: notification.requireInteraction || false,
      silent: notification.silent || false,
      vibrate: notification.vibrate || [200, 100, 200]
    });

    // Simulate sending (replace with actual web-push implementation)
    loggerService.info(`📱 [PUSH] Simulating push notification`, {
      userId: subscription.userId,
      title: notification.title,
      body: notification.body,
      endpoint: subscription.endpoint.substring(0, 50) + '...'
    });

    // TODO: Implement actual web-push sending
    // const webpush = require('web-push');
    // webpush.setVapidDetails(
    //   'mailto:admin@aicapital.com',
    //   this.vapidKeys.publicKey,
    //   this.vapidKeys.privateKey
    // );
    // 
    // await webpush.sendNotification(subscription, payload);
  }

  /**
   * Remove a subscription
   */
  async removeSubscription(userId: string, endpoint: string): Promise<boolean> {
    try {
      const userSubscriptions = this.subscriptions.get(userId) || [];
      const filtered = userSubscriptions.filter(sub => sub.endpoint !== endpoint);
      
      if (filtered.length === userSubscriptions.length) {
        return false; // No subscription removed
      }

      this.subscriptions.set(userId, filtered);
      await this.saveSubscriptions();
      
      loggerService.info(`🗑️ [PUSH] Removed subscription for user ${userId}`);
      return true;
    } catch (error) {
      loggerService.error(`❌ [PUSH] Failed to remove subscription`, {
        userId,
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Get user's push subscriptions
   */
  getUserSubscriptions(userId: string): UserPushSubscription[] {
    return this.subscriptions.get(userId) || [];
  }

  /**
   * Get push notification statistics
   */
  getStats(): {
    totalUsers: number;
    totalSubscriptions: number;
    averagePerUser: number;
  } {
    const totalUsers = this.subscriptions.size;
    const totalSubscriptions = Array.from(this.subscriptions.values())
      .reduce((sum, subs) => sum + subs.length, 0);
    const averagePerUser = totalUsers > 0 ? totalSubscriptions / totalUsers : 0;

    return {
      totalUsers,
      totalSubscriptions,
      averagePerUser
    };
  }

  /**
   * Load subscriptions from storage (in production, use database)
   */
  private async loadSubscriptions(): Promise<void> {
    // In production, load from database
    // For now, we'll use in-memory storage
    loggerService.info(`📱 [PUSH] Push notification service initialized`);
  }

  /**
   * Save subscriptions to storage (in production, use database)
   */
  private async saveSubscriptions(): Promise<void> {
    // In production, save to database
    // For now, we'll use in-memory storage
    loggerService.info(`💾 [PUSH] Subscriptions saved to memory`);
  }
}

export default new PushNotificationService();
