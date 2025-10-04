import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;
  portfolio: mongoose.Types.ObjectId;
  type: 'BUY' | 'SELL';
  ticker: string;
  shares: number;
  price: number;
  date: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    portfolio: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true },
    type: { type: String, enum: ['BUY', 'SELL'], required: true },
    ticker: { type: String, required: true },
    shares: { type: Number, required: true },
    price: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
