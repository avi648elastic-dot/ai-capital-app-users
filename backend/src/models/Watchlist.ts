import mongoose, { Schema, Document } from 'mongoose';

export interface IPriceAlert {
  type: 'high' | 'low' | 'both';
  highPrice?: number;
  lowPrice?: number;
  enabled: boolean;
  lastTriggered?: Date;
  triggeredCount: number;
}

export interface IWatchlistItem extends Document {
  userId: mongoose.Types.ObjectId;
  ticker: string;
  name?: string;
  addedAt: Date;
  notifications: boolean;
  priceAlert?: IPriceAlert;
  lastPrice?: number;
  lastChecked?: Date;
  metadata?: {
    sector?: string;
    industry?: string;
    marketCap?: number;
  };
}

const PriceAlertSchema = new Schema({
  type: {
    type: String,
    enum: ['high', 'low', 'both'],
    default: 'both'
  },
  highPrice: {
    type: Number,
    required: function() {
      return this.type === 'high' || this.type === 'both';
    }
  },
  lowPrice: {
    type: Number,
    required: function() {
      return this.type === 'low' || this.type === 'both';
    }
  },
  enabled: {
    type: Boolean,
    default: true
  },
  lastTriggered: {
    type: Date
  },
  triggeredCount: {
    type: Number,
    default: 0
  }
});

const WatchlistSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  ticker: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  notifications: {
    type: Boolean,
    default: true
  },
  priceAlert: {
    type: PriceAlertSchema,
    default: null
  },
  lastPrice: {
    type: Number
  },
  lastChecked: {
    type: Date
  },
  metadata: {
    sector: String,
    industry: String,
    marketCap: Number
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
WatchlistSchema.index({ userId: 1, ticker: 1 }, { unique: true });

// Index for price monitoring queries
WatchlistSchema.index({ 'priceAlert.enabled': 1, lastChecked: 1 });

// Virtual for determining if alert should be checked
WatchlistSchema.virtual('needsCheck').get(function() {
  if (!this.priceAlert || !this.priceAlert.enabled) return false;
  if (!this.lastChecked) return true;
  
  // Check every 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastChecked < fiveMinutesAgo;
});

// Method to check if price alert is triggered
WatchlistSchema.methods.checkPriceAlert = function(currentPrice: number): {
  triggered: boolean;
  type?: 'high' | 'low';
  message?: string;
} {
  if (!this.priceAlert || !this.priceAlert.enabled) {
    return { triggered: false };
  }

  const alert = this.priceAlert;

  // Check high price alert
  if ((alert.type === 'high' || alert.type === 'both') && alert.highPrice) {
    if (currentPrice >= alert.highPrice) {
      return {
        triggered: true,
        type: 'high',
        message: `${this.ticker} reached your target high price of $${alert.highPrice.toFixed(2)}! Current price: $${currentPrice.toFixed(2)}`
      };
    }
  }

  // Check low price alert
  if ((alert.type === 'low' || alert.type === 'both') && alert.lowPrice) {
    if (currentPrice <= alert.lowPrice) {
      return {
        triggered: true,
        type: 'low',
        message: `${this.ticker} dropped to your target low price of $${alert.lowPrice.toFixed(2)}! Current price: $${currentPrice.toFixed(2)}`
      };
    }
  }

  return { triggered: false };
};

// Method to update last triggered
WatchlistSchema.methods.markAlertTriggered = function() {
  if (this.priceAlert) {
    this.priceAlert.lastTriggered = new Date();
    this.priceAlert.triggeredCount += 1;
  }
  return this.save();
};

export default mongoose.model<IWatchlistItem>('Watchlist', WatchlistSchema);

