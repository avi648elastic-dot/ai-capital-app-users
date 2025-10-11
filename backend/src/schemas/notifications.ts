import { z } from 'zod';

// Get notifications query schema
export const getNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  unreadOnly: z.coerce.boolean().optional().default(false),
  type: z.enum(['success', 'error', 'warning', 'info']).optional(),
  category: z.enum(['market', 'portfolio', 'system', 'alert']).optional()
});

// Create notification schema
export const createNotificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long'),
  
  message: z.string()
    .min(1, 'Message is required')
    .max(1000, 'Message too long'),
  
  type: z.enum(['success', 'error', 'warning', 'info']).default('info'),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  
  category: z.enum(['market', 'portfolio', 'system', 'alert']).default('system'),
  
  actionData: z.object({
    ticker: z.string().optional(),
    action: z.enum(['BUY', 'HOLD', 'SELL']).optional(),
    reason: z.string().optional(),
    portfolioId: z.string().optional()
  }).optional(),
  
  channels: z.object({
    dashboard: z.boolean().optional().default(true),
    popup: z.boolean().optional().default(true),
    email: z.boolean().optional().default(false),
    push: z.boolean().optional().default(false)
  }).optional()
});

// Global notification schema
export const globalNotificationSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long'),
  
  message: z.string()
    .min(1, 'Message is required')
    .max(1000, 'Message too long'),
  
  type: z.enum(['success', 'error', 'warning', 'info']).default('info'),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  
  targetUsers: z.enum(['all', 'premium', 'free', 'active']).default('all'),
  
  channels: z.object({
    dashboard: z.boolean().optional().default(true),
    popup: z.boolean().optional().default(false),
    email: z.boolean().optional().default(false),
    push: z.boolean().optional().default(false)
  }).optional()
});

// Stock action notification schema
export const stockActionNotificationSchema = z.object({
  ticker: z.string()
    .min(1, 'Ticker is required')
    .max(10, 'Ticker too long')
    .regex(/^[A-Z0-9\.\-:]+$/i, 'Invalid ticker format'),
  
  action: z.enum(['BUY', 'HOLD', 'SELL']),
  
  reason: z.string()
    .min(1, 'Reason is required')
    .max(500, 'Reason too long'),
  
  targetUsers: z.enum(['all', 'premium', 'free', 'holders']).default('all')
});

// Mark notification as read schema
export const markReadSchema = z.object({
  channel: z.enum(['dashboard', 'popup']).optional()
});

// Cleanup notifications schema
export const cleanupNotificationsSchema = z.object({
  olderThan: z.coerce.number().int().positive().max(365).default(30), // days
  deliveryStatus: z.enum(['delivered', 'read', 'dismissed']).optional()
});

