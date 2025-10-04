import mongoose, { Document, Schema } from 'mongoose';

export interface IPortfolio extends Document {
  userId: mongoose.Types.ObjectId;
  ticker: string;
  shares: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  date: Date;
  notes?: string;
  action: 'BUY' | 'HOLD' | 'SELL';
  reason?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioSchema = new Schema<IPortfolio>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ticker: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  shares: {
    type: Number,
    required: true,
    min: 0,
  },
  entryPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  stopLoss: {
    type: Number,
    min: 0,
  },
  takeProfit: {
    type: Number,
    min: 0,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  notes: {
    type: String,
    trim: true,
  },
  action: {
    type: String,
    enum: ['BUY', 'HOLD', 'SELL'],
    default: 'HOLD',
  },
  reason: {
    type: String,
  },
  color: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
PortfolioSchema.index({ userId: 1, ticker: 1 });

export default mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);
