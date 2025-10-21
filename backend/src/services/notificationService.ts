import Notification, { INotification } from '../models/Notification';
import User from '../models/User';
import pushNotificationService from './pushNotificationService';
import emailService from './emailService';

interface CreateNotificationData {
  userId?: string;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error' | 'action';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'system' | 'portfolio' | 'market' | 'account' | 'action';
  actionData?: {
    ticker?: string;
    action?: 'BUY' | 'SELL' | 'HOLD';
    reason?: string;
    portfolioId?: string;
  };
  channels?: {
    dashboard?: boolean;
    popup?: boolean;
    email?: boolean;
    push?: boolean;
  };
  scheduledFor?: Date;
  expiresAt?: Date;
}

interface NotificationFilters {
  userId?: string;
  type?: string;
  category?: string;
  priority?: string;
  status?: string;
  unreadOnly?: boolean;
  limit?: number;
  skip?: number;
}

class NotificationService {
  constructor() {
    // Email service is now initialized globally
    console.log('📧 [NOTIFICATION SERVICE] Using professional email service');
  }

  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationData): Promise<INotification> {
    const notification = new Notification({
      ...data,
      channels: {
        dashboard: true,
        popup: true,
        email: false,
        push: false,
        ...data.channels
      }
    });

    await notification.save();
    
    // Process delivery based on channels
    await this.processNotificationDelivery(notification);
    
    return notification;
  }

  /**
   * Create notifications for stock actions (SELL only for users)
   */
  async createStockActionNotification(
    userId: string,
    ticker: string,
    action: 'BUY' | 'SELL' | 'HOLD',
    reason: string,
    portfolioId?: string
  ): Promise<INotification> {
    // Only create notifications for SELL actions (as per user requirements)
    if (action !== 'SELL') {
      throw new Error('Only SELL notifications are allowed for user portfolios');
    }

    const actionMessages = {
      BUY: `AI recommends BUYING ${ticker}`,
      SELL: `🚨 SELL Signal: ${ticker}`,
      HOLD: `AI recommends HOLDING ${ticker}`
    };

    return this.createNotification({
      userId,
      title: actionMessages[action],
      message: reason,
      type: 'action',
      priority: 'high', // SELL actions are always high priority
      category: 'portfolio',
      actionData: {
        ticker,
        action,
        reason,
        portfolioId
      },
      channels: {
        dashboard: true,
        popup: true,
        email: true, // Always email for SELL actions
        push: true   // Always push for SELL actions
      }
    });
  }

  /**
   * Create global notification for all users
   */
  async createGlobalNotification(
    title: string,
    message: string,
    type: 'info' | 'warning' | 'success' | 'error' = 'info',
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<INotification> {
    return this.createNotification({
      title,
      message,
      type,
      priority,
      category: 'system',
      channels: {
        dashboard: true,
        popup: priority === 'urgent' || priority === 'high',
        email: priority === 'urgent',
        push: priority === 'urgent' || priority === 'high'
      }
    });
  }

  /**
   * Get notifications for a user (only their own + global notifications)
   * Enhanced with portfolio filtering to only show relevant notifications
   */
  async getUserNotifications(filters: NotificationFilters): Promise<{
    notifications: INotification[];
    total: number;
    unreadCount: number;
  }> {
    const query: any = {};
    
    if (filters.userId) {
      // Users can only see their own notifications + global notifications (userId: null)
      query.$or = [
        { userId: filters.userId }, // User's own notifications
        { userId: null } // Global notifications (admin-created)
      ];
    }
    
    if (filters.type) query.type = filters.type;
    if (filters.category) query.category = filters.category;
    if (filters.priority) query.priority = filters.priority;
    if (filters.status) query.status = filters.status;
    
    if (filters.unreadOnly) {
      query.readAt = { $exists: false };
    }

    // Remove expired notifications
    query.$or = [
      ...(query.$or || []),
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ];

    // Get user's portfolio to filter relevant notifications
    let userPortfolioTickers: string[] = [];
    if (filters.userId) {
      try {
        const { default: Portfolio } = await import('../models/Portfolio');
        const portfolioItems = await Portfolio.find({ 
          userId: filters.userId,
          action: 'BUY' // Only BUY actions (actual holdings)
        }).select('ticker');
        userPortfolioTickers = portfolioItems.map(item => item.ticker);
      } catch (error) {
        console.warn('Failed to fetch user portfolio for notification filtering:', error);
      }
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50)
        .skip(filters.skip || 0),
      Notification.countDocuments(query),
      Notification.countDocuments({ ...query, readAt: { $exists: false } })
    ]);

    // Filter notifications to only show relevant ones
    const filteredNotifications = notifications.filter(notification => {
      // Always show global notifications (userId: null)
      if (!notification.userId) return true;
      
      // Always show system notifications
      if (notification.category === 'system') return true;
      
      // For portfolio/market notifications, only show if user has the stock
      if (notification.actionData?.ticker) {
        return userPortfolioTickers.includes(notification.actionData.ticker);
      }
      
      // Show all other notifications
      return true;
    });

    return { 
      notifications: filteredNotifications, 
      total: filteredNotifications.length, 
      unreadCount: filteredNotifications.filter(n => !n.readAt).length 
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<INotification | null> {
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: notificationId,
        $or: [{ userId }, { userId: null }] // User's notifications or global
      },
      { 
        readAt: new Date(),
        'deliveryStatus.dashboard': 'read'
      },
      { new: true }
    );

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany(
      { 
        $or: [{ userId }, { userId: null }],
        readAt: { $exists: false }
      },
      { 
        readAt: new Date(),
        'deliveryStatus.dashboard': 'read'
      }
    );

    return result.modifiedCount;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const result = await Notification.deleteOne({
      _id: notificationId,
      userId // Only user can delete their own notifications
    });

    return result.deletedCount > 0;
  }

  /**
   * Process notification delivery across all channels
   */
  private async processNotificationDelivery(notification: INotification): Promise<void> {
    const promises = [];

    // Dashboard delivery (always available)
    promises.push(
      Notification.updateOne(
        { _id: notification._id },
        { 
          status: 'delivered',
          'deliveryStatus.dashboard': 'delivered'
        }
      )
    );

    // Popup delivery (if enabled)
    if (notification.channels.popup) {
      promises.push(
        Notification.updateOne(
          { _id: notification._id },
          { 'deliveryStatus.popup': 'delivered' }
        )
      );
    }

    // Email delivery (if enabled)
    if (notification.channels.email) {
      promises.push(this.sendEmailNotification(notification));
    }

    // Push notification delivery (if enabled)
    if (notification.channels.push && notification.userId) {
      promises.push(this.sendPushNotification(notification));
    }

    await Promise.all(promises);
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(notification: INotification): Promise<void> {
    try {
      const pushData = {
        title: notification.title,
        body: notification.message,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: `aicapital-${notification.category}`,
        data: {
          notificationId: (notification._id as any).toString(),
          type: notification.type,
          category: notification.category,
          priority: notification.priority,
          actionData: notification.actionData,
          url: notification.actionData?.ticker 
            ? `${process.env.FRONTEND_URL}/watchlist` 
            : `${process.env.FRONTEND_URL}/dashboard`
        },
        actions: [
          {
            action: 'view',
            title: 'View Details',
            icon: '/icons/view.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/icons/dismiss.png'
          }
        ],
        requireInteraction: notification.priority === 'urgent',
        silent: notification.priority === 'low',
        vibrate: notification.priority === 'urgent' ? [200, 100, 200, 100, 200] : [200, 100, 200]
      };

      const result = await pushNotificationService.sendToUser(
        notification.userId!.toString(),
        pushData
      );

      await Notification.updateOne(
        { _id: notification._id },
        { 
          'deliveryStatus.push': result.sent > 0 ? 'sent' : 'failed',
          'deliveryStatus.pushDetails': result
        }
      );

      console.log(`📱 Push notification sent:`, {
        notificationId: notification._id,
        userId: notification.userId,
        sent: result.sent,
        failed: result.failed
      });
    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
      
      await Notification.updateOne(
        { _id: notification._id },
        { 'deliveryStatus.push': 'failed' }
      );
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: INotification): Promise<void> {
    if (!emailService.isReady()) {
      console.warn('⚠️ [EMAIL] Email service not available');
      return;
    }

    try {
      let userEmail = '';
      if (notification.userId) {
        const user = await User.findById(notification.userId);
        userEmail = user?.email || '';
      }

      if (!userEmail && notification.userId) {
        console.warn('⚠️ [EMAIL] User email not found for notification:', notification._id);
        return;
      }

      // For global notifications, we would need to get all user emails
      // For now, skip email for global notifications
      if (!notification.userId) {
        console.log('ℹ️ [EMAIL] Skipping email for global notification');
        return;
      }

      // Use the new email service
      const success = await emailService.sendNotificationEmail(userEmail, {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        actionData: notification.actionData
      });
      
      await Notification.updateOne(
        { _id: notification._id },
        { 'deliveryStatus.email': success ? 'sent' : 'failed' }
      );

      if (success) {
        console.log('✅ [EMAIL] Email notification sent:', notification._id);
      } else {
        console.error('❌ [EMAIL] Failed to send email notification:', notification._id);
      }
    } catch (error) {
      console.error('❌ [EMAIL] Failed to send email notification:', error);
      
      await Notification.updateOne(
        { _id: notification._id },
        { 'deliveryStatus.email': 'failed' }
      );
    }
  }


  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    const result = await Notification.deleteMany({
      expiresAt: { $lt: new Date() }
    });

    return result.deletedCount;
  }

  /**
   * Clean up invalid portfolio notifications (non-SELL actions)
   */
  async cleanupInvalidPortfolioNotifications(): Promise<number> {
    const result = await Notification.deleteMany({
      category: 'portfolio',
      'actionData.action': { $in: ['BUY', 'HOLD'] }
    });

    return result.deletedCount;
  }

  /**
   * Get notification statistics for admin
   */
  async getNotificationStats(): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    recentActivity: number;
  }> {
    const [
      total,
      unread,
      byType,
      byCategory,
      recentActivity
    ] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ readAt: { $exists: false } }),
      Notification.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Notification.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Notification.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);

    return {
      total,
      unread,
      byType: byType.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byCategory: byCategory.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentActivity
    };
  }

  /**
   * Clear all notifications for all users (Admin only)
   */
  async clearAllNotifications(): Promise<number> {
    const result = await Notification.deleteMany({});
    console.log(`🗑️ [ADMIN] Cleared ${result.deletedCount} notifications for all users`);
    return result.deletedCount;
  }

  /**
   * Clear all notifications for a specific user (Admin only)
   */
  async clearUserNotifications(userId: string): Promise<number> {
    const result = await Notification.deleteMany({ userId });
    console.log(`🗑️ [ADMIN] Cleared ${result.deletedCount} notifications for user ${userId}`);
    return result.deletedCount;
  }

  /**
   * Clean up irrelevant notifications (stocks not in user's portfolio)
   */
  async cleanupIrrelevantNotifications(): Promise<number> {
    try {
      // Get all users and their portfolio tickers
      const { default: User } = await import('../models/User');
      const { default: Portfolio } = await import('../models/Portfolio');
      
      const users = await User.find({}).select('_id');
      let totalDeleted = 0;
      
      for (const user of users) {
        // Get user's portfolio tickers
        const portfolioItems = await Portfolio.find({ 
          userId: user._id,
          action: 'BUY'
        }).select('ticker');
        const userTickers = portfolioItems.map(item => item.ticker);
        
        // Delete notifications for stocks not in user's portfolio
        const result = await Notification.deleteMany({
          userId: user._id,
          'actionData.ticker': { $exists: true, $nin: userTickers },
          category: { $in: ['portfolio', 'market'] }
        });
        
        totalDeleted += result.deletedCount;
        
        if (result.deletedCount > 0) {
          console.log(`🧹 [CLEANUP] Removed ${result.deletedCount} irrelevant notifications for user ${user._id}`);
        }
      }
      
      console.log(`✅ [CLEANUP] Total irrelevant notifications cleaned up: ${totalDeleted}`);
      return totalDeleted;
      
    } catch (error) {
      console.error('❌ [CLEANUP] Error cleaning up irrelevant notifications:', error);
      throw error;
    }
  }
}

export default new NotificationService();
