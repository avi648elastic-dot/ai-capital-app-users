import mongoose, { Schema, Document } from 'mongoose';

export interface IPositionHistory extends Document {
  userId: string;
  ticker: string;
  shares: number;
  entryPrice: number;
  exitPrice: number;
  realizedPnL: number; // The actual USD profit/loss made
  realizedPnLPercent: number; // The percentage profit/loss
  entryDate: Date;
  exitDate: Date;
  portfolioType: 'solid' | 'risky';
  portfolioId: string;
  exitReason: 'manual_delete' | 'stop_loss' | 'take_profit' | 'manual_close';
  notes?: string;
  action: 'BUY' | 'SELL';
}

const PositionHistorySchema = new Schema<IPositionHistory>(
  {
    userId: { type: String, required: true },
    ticker: { type: String, required: true },
    shares: { type: Number, required: true },
    entryPrice: { type: Number, required: true },
    exitPrice: { type: Number, required: true },
    realizedPnL: { type: Number, required: true }, // USD amount made/lost
    realizedPnLPercent: { type: Number, required: true }, // Percentage
    entryDate: { type: Date, required: true },
    exitDate: { type: Date, default: Date.now },
    portfolioType: { type: String, enum: ['solid', 'risky'], required: true },
    portfolioId: { type: String, required: true },
    exitReason: { 
      type: String, 
      enum: ['manual_delete', 'stop_loss', 'take_profit', 'manual_close'], 
      required: true 
    },
    notes: String,
    action: { type: String, enum: ['BUY', 'SELL'], required: true, default: 'SELL' }
  },
  { timestamps: true }
);

// 📊 MongoDB Indexes for Performance
PositionHistorySchema.index({ userId: 1, exitDate: -1 });
PositionHistorySchema.index({ userId: 1, realizedPnL: -1 });
PositionHistorySchema.index({ ticker: 1 });
PositionHistorySchema.index({ exitReason: 1 });
PositionHistorySchema.index({ portfolioType: 1 });
PositionHistorySchema.index({ realizedPnL: -1 }); // For leaderboard queries

export default mongoose.model<IPositionHistory>('PositionHistory', PositionHistorySchema);
