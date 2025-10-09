import axios from 'axios';
import Cookies from 'js-cookie';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'action';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionData?: {
    ticker?: string;
    action?: 'BUY' | 'SELL' | 'HOLD';
    reason?: string;
  };
}

class NotificationService {
  private permissionGranted = false;
  private lastNotificationTime = 0;
  private readonly THROTTLE_DURATION = 5000; // 5 seconds between notifications

  constructor() {
    this.requestPermission();
  }

  /**
   * Request browser notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permissionGranted = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      return this.permissionGranted;
    }

    return false;
  }

  /**
   * Show browser notification
   */
  showNotification(notification: Notification): void {
    if (!this.permissionGranted || !('Notification' in window)) {
      return;
    }

    // Throttle notifications to avoid spam
    const now = Date.now();
    if (now - this.lastNotificationTime < this.THROTTLE_DURATION) {
      return;
    }
    this.lastNotificationTime = now;

    const options: NotificationOptions = {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification._id, // Prevent duplicate notifications
      requireInteraction: notification.priority === 'urgent' || notification.priority === 'high',
      silent: notification.priority === 'low',
      timestamp: Date.now(),
      data: {
        notificationId: notification._id,
        type: notification.type,
        priority: notification.priority
      }
    };

    // Add action buttons for action notifications
    if (notification.type === 'action' && notification.actionData) {
      options.actions = [
        {
          action: 'view',
          title: 'View Portfolio',
          icon: '/favicon.ico'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ];
    }

    const browserNotification = new Notification(notification.title, options);

    // Handle notification click
    browserNotification.onclick = () => {
      window.focus();
      browserNotification.close();
      
      // Mark as read if user has token
      this.markAsRead(notification._id);
      
      // Navigate to dashboard
      window.location.href = '/dashboard';
    };

    // Handle action button clicks
    browserNotification.addEventListener('actionclick', (event) => {
      if (event.action === 'view') {
        window.focus();
        window.location.href = '/dashboard';
        this.markAsRead(notification._id);
      }
      browserNotification.close();
    });

    // Auto-close after 10 seconds (except for urgent notifications)
    if (notification.priority !== 'urgent') {
      setTimeout(() => {
        browserNotification.close();
      }, 10000);
    }
  }

  /**
   * Mark notification as read
   */
  private async markAsRead(notificationId: string): Promise<void> {
    try {
      const token = Cookies.get('token');
      if (!token) return;

      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'error': return '❌';
      case 'action': return '📈';
      default: return '🔔';
    }
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Export types
export type { Notification };
