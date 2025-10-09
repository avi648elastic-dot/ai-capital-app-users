import Notification, { INotification } from '../models/Notification';
import User from '../models/User';
import nodemailer from 'nodemailer';

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
  private emailTransporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeEmailService();
  }

  private async initializeEmailService() {
    try {
      this.emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
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
        ...data.channels
      }
    });

    await notification.save();
    
    // Process delivery based on channels
    await this.processNotificationDelivery(notification);
    
    return notification;
  }

  /**
   * Create notifications for stock actions
   */
  async createStockActionNotification(
    userId: string,
    ticker: string,
    action: 'BUY' | 'SELL' | 'HOLD',
    reason: string,
    portfolioId?: string
  ): Promise<INotification> {
    const actionMessages = {
      BUY: `AI recommends BUYING ${ticker}`,
      SELL: `AI recommends SELLING ${ticker}`,
      HOLD: `AI recommends HOLDING ${ticker}`
    };

    return this.createNotification({
      userId,
      title: actionMessages[action],
      message: reason,
      type: 'action',
      priority: action === 'SELL' ? 'high' : 'medium',
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
        email: action === 'SELL' // Only email for SELL actions
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
        email: priority === 'urgent'
      }
    });
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(filters: NotificationFilters): Promise<{
    notifications: INotification[];
    total: number;
    unreadCount: number;
  }> {
    const query: any = {};
    
    if (filters.userId) {
      query.$or = [
        { userId: filters.userId },
        { userId: null } // Global notifications
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

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50)
        .skip(filters.skip || 0),
      Notification.countDocuments(query),
      Notification.countDocuments({ ...query, readAt: { $exists: false } })
    ]);

    return { notifications, total, unreadCount };
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

    await Promise.all(promises);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: INotification): Promise<void> {
    if (!this.emailTransporter) {
      console.warn('Email service not available');
      return;
    }

    try {
      let userEmail = '';
      if (notification.userId) {
        const user = await User.findById(notification.userId);
        userEmail = user?.email || '';
      }

      if (!userEmail && notification.userId) {
        console.warn('User email not found for notification:', notification._id);
        return;
      }

      // For global notifications, we would need to get all user emails
      // For now, skip email for global notifications
      if (!notification.userId) {
        console.log('Skipping email for global notification');
        return;
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `AiCapital: ${notification.title}`,
        html: this.generateEmailTemplate(notification)
      };

      await this.emailTransporter.sendMail(mailOptions);
      
      await Notification.updateOne(
        { _id: notification._id },
        { 'deliveryStatus.email': 'sent' }
      );

      console.log('✅ Email notification sent:', notification._id);
    } catch (error) {
      console.error('❌ Failed to send email notification:', error);
      
      await Notification.updateOne(
        { _id: notification._id },
        { 'deliveryStatus.email': 'failed' }
      );
    }
  }

  /**
   * Generate email template
   */
  private generateEmailTemplate(notification: INotification): string {
    const actionColors = {
      info: '#3B82F6',
      warning: '#F59E0B',
      success: '#10B981',
      error: '#EF4444',
      action: '#8B5CF6'
    };

    const color = actionColors[notification.type];

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${notification.title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">AiCapital</h1>
            <p style="color: #94a3b8; margin: 5px 0 0 0;">Professional Portfolio Management</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
              <div style="width: 40px; height: 40px; background: ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                <span style="color: white; font-weight: bold; font-size: 18px;">
                  ${notification.type === 'action' ? '📈' : 
                    notification.type === 'warning' ? '⚠️' :
                    notification.type === 'success' ? '✅' :
                    notification.type === 'error' ? '❌' : 'ℹ️'}
                </span>
              </div>
              <h2 style="margin: 0; color: #1e293b; font-size: 20px;">${notification.title}</h2>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid ${color}; margin-bottom: 20px;">
              <p style="margin: 0; color: #475569; font-size: 16px;">${notification.message}</p>
            </div>
            
            ${notification.actionData ? `
              <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 16px;">Action Details</h3>
                ${notification.actionData.ticker ? `<p style="margin: 5px 0; color: #475569;"><strong>Ticker:</strong> ${notification.actionData.ticker}</p>` : ''}
                ${notification.actionData.action ? `<p style="margin: 5px 0; color: #475569;"><strong>Action:</strong> <span style="color: ${color}; font-weight: bold;">${notification.actionData.action}</span></p>` : ''}
                ${notification.actionData.reason ? `<p style="margin: 5px 0; color: #475569;"><strong>Reason:</strong> ${notification.actionData.reason}</p>` : ''}
              </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/dashboard" style="background: ${color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Dashboard</a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 14px;">
            <p>This is an automated message from AiCapital.</p>
            <p>If you no longer wish to receive these notifications, please update your preferences in your dashboard.</p>
          </div>
        </body>
      </html>
    `;
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
}

export default new NotificationService();
