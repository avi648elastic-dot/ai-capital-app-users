import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHistoricalPortfolio extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPercent: number;
  sectorAllocation: Array<{
    sector: string;
    percentage: number;
    value: number;
  }>;
  stocks: Array<{
    ticker: string;
    shares: number;
    entryPrice: number;
    currentPrice: number;
    value: number;
    pnl: number;
    pnlPercent: number;
  }>;
  metadata: {
    dataSource: string;
    timestamp: Date;
  };
  createdAt: Date;
}

const HistoricalPortfolioSchema: Schema<IHistoricalPortfolio> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  totalValue: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  totalPnL: { type: Number, required: true },
  totalPnLPercent: { type: Number, required: true },
  sectorAllocation: [{
    sector: String,
    percentage: Number,
    value: Number
  }],
  stocks: [{
    ticker: String,
    shares: Number,
    entryPrice: Number,
    currentPrice: Number,
    value: Number,
    pnl: Number,
    pnlPercent: Number
  }],
  metadata: {
    dataSource: String,
    timestamp: Date
  },
  createdAt: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

// Compound index for efficient querying
HistoricalPortfolioSchema.index({ userId: 1, date: -1 });

const HistoricalPortfolio: Model<IHistoricalPortfolio> = mongoose.model<IHistoricalPortfolio>('HistoricalPortfolio', HistoricalPortfolioSchema);

export default HistoricalPortfolio;
