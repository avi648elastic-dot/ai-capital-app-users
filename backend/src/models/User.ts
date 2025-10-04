import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  subscriptionActive: boolean;
  onboardingCompleted: boolean;
  portfolioType?: string;
  portfolioSource?: string;
  totalCapital?: number;
  riskTolerance?: number;
  createdAt: Date;

  // 🟢 שדות חדשים עבור Shopify Integration
  apiKey?: string;
  apiSecret?: string;
  shopDomain?: string;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    subscriptionActive: { type: Boolean, default: false },
    onboardingCompleted: { type: Boolean, default: false },
    portfolioType: { type: String },
    portfolioSource: { type: String },
    totalCapital: { type: Number, default: 0 },
    riskTolerance: { type: Number, default: 0 },

    // 🟢 תוספת Shopify
    apiKey: { type: String },
    apiSecret: { type: String },
    shopDomain: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
