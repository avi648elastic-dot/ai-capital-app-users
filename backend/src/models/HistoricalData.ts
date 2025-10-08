import mongoose, { Document, Schema } from 'mongoose';

export interface IHistoricalData extends Document {
  ticker: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose: number;
  userId?: string; // Optional: for user-specific data
}

const HistoricalDataSchema = new Schema<IHistoricalData>(
  {
    ticker: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    open: { type: Number, required: true },
    high: { type: Number, required: true },
    low: { type: Number, required: true },
    close: { type: Number, required: true },
    volume: { type: Number, required: true },
    adjustedClose: { type: Number, required: true },
    userId: { type: String, index: true }
  },
  { 
    timestamps: true
  }
);

// Create compound indexes for efficient queries
HistoricalDataSchema.index({ ticker: 1, date: -1 });
HistoricalDataSchema.index({ ticker: 1, date: 1 }, { unique: true });

export default mongoose.models.HistoricalData || mongoose.model<IHistoricalData>('HistoricalData', HistoricalDataSchema);
