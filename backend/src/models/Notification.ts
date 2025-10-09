import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId?: string; // null for global notifications
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'action';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'system' | 'portfolio' | 'market' | 'account' | 'action';
  
  // Action-specific fields
  actionData?: {
    ticker?: string;
    action?: 'BUY' | 'SELL' | 'HOLD';
    reason?: string;
    portfolioId?: string;
  };
  
  // Delivery channels
  channels: {
    dashboard: boolean;
    popup: boolean;
    email: boolean;
  };
  
  // Status tracking
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  deliveryStatus: {
    dashboard: 'pending' | 'delivered' | 'read' | 'failed';
    popup: 'pending' | 'delivered' | 'dismissed' | 'failed';
    email: 'pending' | 'sent' | 'delivered' | 'failed';
  };
  
  // Timestamps
  scheduledFor?: Date;
  expiresAt?: Date;
  readAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: {
    type: String,
    default: null, // null = global notification
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'action'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['system', 'portfolio', 'market', 'account', 'action'],
    default: 'system'
  },
  actionData: {
    ticker: String,
    action: {
      type: String,
      enum: ['BUY', 'SELL', 'HOLD']
    },
    reason: String,
    portfolioId: String
  },
  channels: {
    dashboard: {
      type: Boolean,
      default: true
    },
    popup: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  deliveryStatus: {
    dashboard: {
      type: String,
      enum: ['pending', 'delivered', 'read', 'failed'],
      default: 'pending'
    },
    popup: {
      type: String,
      enum: ['pending', 'delivered', 'dismissed', 'failed'],
      default: 'pending'
    },
    email: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending'
    }
  },
  scheduledFor: Date,
  expiresAt: Date,
  readAt: Date
}, {
  timestamps: true
});

// Indexes for performance
NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ category: 1, priority: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
