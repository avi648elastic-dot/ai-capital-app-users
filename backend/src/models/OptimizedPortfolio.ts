/**
 * 🚀 OPTIMIZED PORTFOLIO MODEL
 * Implements advanced indexing, aggregation pipelines, and query optimization
 */

import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IOptimizedPortfolio extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  ticker: string;
  shares: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  notes?: string;
  portfolioType: 'solid' | 'risky';
  portfolioId?: string;
  decision?: 'BUY' | 'SELL' | 'HOLD';
  score?: number;
  pnlPercent?: number;
  totalPnL?: number;
  lastPriceUpdate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OptimizedPortfolioSchema: Schema<IOptimizedPortfolio> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ticker: { type: String, required: true, uppercase: true, index: true },
    shares: { type: Number, required: true, min: 0 },
    entryPrice: { type: Number, required: true, min: 0 },
    currentPrice: { type: Number, required: true, min: 0 },
    stopLoss: { type: Number, min: 0 },
    takeProfit: { type: Number, min: 0 },
    notes: { type: String, maxlength: 500 },
    portfolioType: { type: String, enum: ['solid', 'risky'], required: true, index: true },
    portfolioId: { type: String, index: true },
    decision: { type: String, enum: ['BUY', 'SELL', 'HOLD'], index: true },
    score: { type: Number, min: -10, max: 10 },
    pnlPercent: { type: Number },
    totalPnL: { type: Number },
    lastPriceUpdate: { type: Date, default: Date.now, index: true }
  },
  { 
    timestamps: true,
    // Optimize for read-heavy workloads
    readPreference: 'secondaryPreferred'
  }
);

// 🚀 PERFORMANCE OPTIMIZED INDEXES
// Compound indexes for common query patterns
OptimizedPortfolioSchema.index({ userId: 1, portfolioType: 1 }); // User's portfolios by type
OptimizedPortfolioSchema.index({ userId: 1, ticker: 1 }); // User's specific stock
OptimizedPortfolioSchema.index({ userId: 1, createdAt: -1 }); // User's latest additions
OptimizedPortfolioSchema.index({ ticker: 1, lastPriceUpdate: 1 }); // Price update queries
OptimizedPortfolioSchema.index({ userId: 1, decision: 1 }); // User's decisions
OptimizedPortfolioSchema.index({ userId: 1, portfolioId: 1 }); // Portfolio-specific queries

// Sparse indexes for optional fields
OptimizedPortfolioSchema.index({ decision: 1 }, { sparse: true });
OptimizedPortfolioSchema.index({ score: 1 }, { sparse: true });

// Text index for search functionality
OptimizedPortfolioSchema.index({ 
  ticker: 'text', 
  notes: 'text' 
}, { 
  weights: { ticker: 10, notes: 1 },
  name: 'portfolio_text_search'
});

// 🚀 AGGREGATION PIPELINES FOR COMPLEX QUERIES
OptimizedPortfolioSchema.statics.getUserPortfolioSummary = function(userId: string) {
  return this.aggregate([
    { $match: { userId: new Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalStocks: { $sum: 1 },
        totalValue: { 
          $sum: { 
            $multiply: ['$shares', '$currentPrice'] 
          } 
        },
        totalPnL: { 
          $sum: { 
            $subtract: [
              { $multiply: ['$shares', '$currentPrice'] },
              { $multiply: ['$shares', '$entryPrice'] }
            ]
          } 
        },
        avgScore: { $avg: '$score' },
        buySignals: { 
          $sum: { 
            $cond: [{ $eq: ['$decision', 'BUY'] }, 1, 0] 
          } 
        },
        sellSignals: { 
          $sum: { 
            $cond: [{ $eq: ['$decision', 'SELL'] }, 1, 0] 
          } 
        },
        holdSignals: { 
          $sum: { 
            $cond: [{ $eq: ['$decision', 'HOLD'] }, 1, 0] 
          } 
        }
      }
    }
  ]);
};

OptimizedPortfolioSchema.statics.getPortfolioByType = function(userId: string, portfolioType: string) {
  return this.find({ 
    userId: new Types.ObjectId(userId), 
    portfolioType 
  })
  .sort({ createdAt: -1 })
  .lean(); // Use lean() for better performance
};

OptimizedPortfolioSchema.statics.getTopPerformers = function(userId: string, limit: number = 10) {
  return this.find({ userId: new Types.ObjectId(userId) })
    .sort({ pnlPercent: -1 })
    .limit(limit)
    .lean();
};

OptimizedPortfolioSchema.statics.getWorstPerformers = function(userId: string, limit: number = 10) {
  return this.find({ userId: new Types.ObjectId(userId) })
    .sort({ pnlPercent: 1 })
    .limit(limit)
    .lean();
};

OptimizedPortfolioSchema.statics.getStocksNeedingUpdate = function(maxAgeMinutes: number = 10) {
  const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
  return this.find({ 
    lastPriceUpdate: { $lt: cutoffTime } 
  })
  .select('ticker lastPriceUpdate')
  .lean();
};

OptimizedPortfolioSchema.statics.bulkUpdatePrices = function(updates: Array<{_id: string, currentPrice: number}>) {
  const bulkOps = updates.map(update => ({
    updateOne: {
      filter: { _id: new Types.ObjectId(update._id) },
      update: { 
        $set: { 
          currentPrice: update.currentPrice,
          lastPriceUpdate: new Date()
        } 
      }
    }
  }));

  return this.bulkWrite(bulkOps, { ordered: false });
};

// 🚀 VIRTUAL FIELDS FOR CALCULATED VALUES
OptimizedPortfolioSchema.virtual('totalValue').get(function() {
  return this.shares * this.currentPrice;
});

OptimizedPortfolioSchema.virtual('totalPnL').get(function() {
  return (this.shares * this.currentPrice) - (this.shares * this.entryPrice);
});

OptimizedPortfolioSchema.virtual('pnlPercent').get(function() {
  return ((this.currentPrice - this.entryPrice) / this.entryPrice) * 100;
});

// 🚀 PRE-SAVE HOOKS FOR DATA VALIDATION AND OPTIMIZATION
OptimizedPortfolioSchema.pre('save', function(next) {
  // Auto-calculate P&L if not provided
  if (!this.pnlPercent) {
    this.pnlPercent = ((this.currentPrice - this.entryPrice) / this.entryPrice) * 100;
  }
  
  if (!this.totalPnL) {
    this.totalPnL = (this.shares * this.currentPrice) - (this.shares * this.entryPrice);
  }

  // Update last price update timestamp
  this.lastPriceUpdate = new Date();
  
  next();
});

// 🚀 QUERY OPTIMIZATION MIDDLEWARE
OptimizedPortfolioSchema.pre(/^find/, function() {
  // Apply default sorting for better performance
  if (!this.getOptions().sort) {
    this.sort({ createdAt: -1 });
  }
});

// 🚀 STATIC METHODS FOR PERFORMANCE OPTIMIZATION
OptimizedPortfolioSchema.statics.findUserPortfolioOptimized = function(userId: string, options: any = {}) {
  const query = this.find({ userId: new Types.ObjectId(userId) });
  
  // Apply lean() for better performance if not explicitly disabled
  if (options.lean !== false) {
    query.lean();
  }
  
  // Apply projection to reduce data transfer
  if (options.fields) {
    query.select(options.fields);
  }
  
  // Apply pagination
  if (options.limit) {
    query.limit(options.limit);
  }
  
  if (options.skip) {
    query.skip(options.skip);
  }
  
  return query;
};

// 🚀 CACHING HELPERS
OptimizedPortfolioSchema.statics.getCacheKey = function(userId: string, options: any = {}) {
  const params = Object.keys(options).sort().map(key => `${key}:${options[key]}`).join('|');
  return `portfolio:${userId}:${params}`;
};

// Export the optimized model
export default mongoose.model<IOptimizedPortfolio>('OptimizedPortfolio', OptimizedPortfolioSchema);
