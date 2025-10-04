import mongoose, { Schema, Document } from 'mongoose';

export interface IPortfolio extends Document {
  user: mongoose.Types.ObjectId;
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
}

const PortfolioSchema: Schema = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticker: { type: String, required: true },
    shares: { type: Number, required: true },
    entryPrice: { type: Number, required: true },
    currentPrice: { type: Number, default: 0 },
    stopLoss: { type: Number },
    takeProfit: { type: Number },
    date: { type: Date, default: Date.now },
    notes: { type: String },
    action: { type: String, enum: ['BUY', 'HOLD', 'SELL'], required: true },
    reason: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);
