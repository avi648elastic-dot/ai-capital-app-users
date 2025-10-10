import express from 'express';
import { authenticateToken, authenticateAdmin } from '../middleware/auth';
import notificationService from '../services/notificationService';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const createNotificationSchema = z.object({
  userId: z.string().optional(),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum(['info', 'warning', 'success', 'error', 'action']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.enum(['system', 'portfolio', 'market', 'account', 'action']).optional(),
  actionData: z.object({
    ticker: z.string().optional(),
    action: z.enum(['BUY', 'SELL', 'HOLD']).optional(),
    reason: z.string().optional(),
    portfolioId: z.string().optional()
  }).optional(),
  channels: z.object({
    dashboard: z.boolean().optional(),
    popup: z.boolean().optional(),
    email: z.boolean().optional()
  }).optional(),
  scheduledFor: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional()
});

const getNotificationsSchema = z.object({
  type: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  unreadOnly: z.string().transform(val => val === 'true').optional(),
  limit: z.string().transform(val => parseInt(val)).optional(),
  skip: z.string().transform(val => parseInt(val)).optional()
});

/**
 * @route GET /api/notifications
 * @desc Get user's notifications
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!._id.toString();
    const filters = getNotificationsSchema.parse(req.query);
    
    const result = await notificationService.getUserNotifications({
      userId,
      ...filters
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

/**
 * @route POST /api/notifications
 * @desc Create a new notification (Admin only)
 * @access Admin
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const data = createNotificationSchema.parse(req.body);
    
    const notification = await notificationService.createNotification({
      ...data,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
    });

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
});

/**
 * @route POST /api/notifications/global
 * @desc Create a global notification for all users (Admin only)
 * @access Admin
 */
router.post('/global', authenticateAdmin, async (req, res) => {
  try {
    const { title, message, type, priority } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    const notification = await notificationService.createGlobalNotification(
      title,
      message,
      type,
      priority
    );

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Global notification created successfully'
    });
  } catch (error) {
    console.error('Create global notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create global notification'
    });
  }
});

/**
 * @route POST /api/notifications/stock-action
 * @desc Create notification for stock action (Admin only)
 * @access Admin
 */
router.post('/stock-action', authenticateAdmin, async (req, res) => {
  try {
    const { userId, ticker, action, reason, portfolioId } = req.body;
    
    if (!userId || !ticker || !action || !reason) {
      return res.status(400).json({
        success: false,
        message: 'userId, ticker, action, and reason are required'
      });
    }

    const notification = await notificationService.createStockActionNotification(
      userId,
      ticker,
      action,
      reason,
      portfolioId
    );

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Stock action notification created successfully'
    });
  } catch (error) {
    console.error('Create stock action notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create stock action notification'
    });
  }
});

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id.toString();
    
    const notification = await notificationService.markAsRead(id, userId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

/**
 * @route PUT /api/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!._id.toString();
    
    const count = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      data: { markedCount: count },
      message: `${count} notifications marked as read`
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete notification
 * @access Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id.toString();
    
    const deleted = await notificationService.deleteNotification(id, userId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

/**
 * @route GET /api/notifications/stats
 * @desc Get notification statistics (Admin only)
 * @access Admin
 */
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await notificationService.getNotificationStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics'
    });
  }
});

/**
 * @route POST /api/notifications/cleanup
 * @desc Clean up expired notifications (Admin only)
 * @access Admin
 */
router.post('/cleanup', authenticateAdmin, async (req, res) => {
  try {
    const deletedCount = await notificationService.cleanupExpiredNotifications();

    res.json({
      success: true,
      data: { deletedCount },
      message: `${deletedCount} expired notifications cleaned up`
    });
  } catch (error) {
    console.error('Cleanup notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup notifications'
    });
  }
});

/**
 * @route POST /api/notifications/test
 * @desc Create a test notification for the current user
 * @access Private
 */
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!._id.toString();
    
    const notification = await notificationService.createNotification({
      userId,
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working correctly. The notification should display properly with all styling and functionality.',
      type: 'info',
      priority: 'medium',
      category: 'system',
      channels: {
        dashboard: true,
        popup: true,
        email: false
      }
    });

    res.json({
      success: true,
      data: notification,
      message: 'Test notification created successfully'
    });
  } catch (error) {
    console.error('Create test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test notification'
    });
  }
});

export default router;
