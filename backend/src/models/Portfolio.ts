import mongoose, { Schema, Document } from 'mongoose';

export interface IPortfolio extends Document {
  userId: string;
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
  portfolioType: 'solid' | 'dangerous'; // Portfolio type (solid/dangerous)
  portfolioId: string; // Unique identifier for each portfolio (e.g., "solid-1", "dangerous-2")
  portfolioName?: string; // Optional custom name for the portfolio
}

const PortfolioSchema = new Schema<IPortfolio>(
  {
    userId: { type: String, required: true },
    ticker: { type: String, required: true },
    shares: { type: Number, required: true },
    entryPrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    stopLoss: Number,
    takeProfit: Number,
    date: { type: Date, default: Date.now },
    notes: String,
    action: { type: String, enum: ['BUY', 'HOLD', 'SELL'], required: true },
    reason: String,
    color: String,
    portfolioType: { type: String, enum: ['solid', 'dangerous'], required: true, default: 'solid' },
    portfolioId: { type: String, required: true, default: 'solid-1' }, // Default for existing portfolios
    portfolioName: String, // Optional custom name
  },
  { timestamps: true }
);

export default mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);
