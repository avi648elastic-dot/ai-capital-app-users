import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDeletedTransactionAudit extends Document {
  userId: Types.ObjectId | string;
  transactionId?: string;
  type: 'delete';
  beforeSnapshot: any;
  amount: number;
  ticker: string;
  portfolioId?: string;
  deletedBy: Types.ObjectId | string;
  deletedAt: Date;
  reason?: string;
}

const DeletedTransactionAuditSchema = new Schema<IDeletedTransactionAudit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    transactionId: { type: String },
    type: { type: String, enum: ['delete'], default: 'delete' },
    beforeSnapshot: { type: Schema.Types.Mixed, required: true },
    amount: { type: Number, required: true },
    ticker: { type: String, required: true, index: true },
    portfolioId: { type: String, index: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date, default: Date.now, index: true },
    reason: { type: String }
  },
  { timestamps: true }
);

DeletedTransactionAuditSchema.index({ userId: 1, deletedAt: -1 });
DeletedTransactionAuditSchema.index({ userId: 1, portfolioId: 1, deletedAt: -1 });

export default mongoose.model<IDeletedTransactionAudit>('DeletedTransactionAudit', DeletedTransactionAuditSchema);


