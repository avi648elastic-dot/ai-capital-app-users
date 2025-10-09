import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  subscriptionActive: boolean;
  subscriptionTier: 'free' | 'premium' | 'premium+'; // Updated to include premium+
  onboardingCompleted: boolean;
  isAdmin?: boolean;
  featuredTickers?: string[];
  portfolioType?: string;
  portfolioSource?: string;
  totalCapital?: number;
  riskTolerance?: number;
  language?: string;
  theme?: string;
  avatarUrl?: string; // New field for avatar
  createdAt: Date;

  apiKey?: string;
  apiSecret?: string;
  shopDomain?: string;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    subscriptionActive: { type: Boolean, default: false },
    subscriptionTier: { type: String, enum: ['free', 'premium', 'premium+'], default: 'free' },
    onboardingCompleted: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    featuredTickers: { type: [String], default: undefined },
    portfolioType: { type: String },
    portfolioSource: { type: String },
    totalCapital: { type: Number, default: 0 },
    riskTolerance: { type: Number, default: 0 },
    language: { type: String, default: 'en' },
    theme: { type: String, default: 'dark' },
    avatarUrl: { type: String }, // New field for avatar

    apiKey: { type: String },
    apiSecret: { type: String },
    shopDomain: { type: String },
  },
  { timestamps: true }
);

// 📊 MongoDB Indexes for Performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ subscriptionTier: 1 });
UserSchema.index({ subscriptionActive: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ 'featuredTickers': 1 });

// 🔒 Pre-save hook for portfolio limits validation
UserSchema.pre('save', async function(next) {
  try {
    // Validate subscription tier limits
    if (this.subscriptionTier === 'free') {
      // Free users: max 10 stocks total, 1 portfolio type
      const Portfolio = mongoose.model('Portfolio');
      const stockCount = await Portfolio.countDocuments({ userId: this._id });
      
      if (stockCount > 10) {
        const error = new Error('Free users are limited to 10 stocks total');
        return next(error);
      }
    } else if (this.subscriptionTier === 'premium') {
      // Premium users: max 15 stocks per portfolio, 3 portfolios each type
      const Portfolio = mongoose.model('Portfolio');
      const solidPortfolios = await Portfolio.countDocuments({ 
        userId: this._id, 
        portfolioType: 'solid' 
      });
      const riskyPortfolios = await Portfolio.countDocuments({ 
        userId: this._id, 
        portfolioType: 'risky' 
      });
      
      if (solidPortfolios > 3 || riskyPortfolios > 3) {
        const error = new Error('Premium users are limited to 3 portfolios of each type');
        return next(error);
      }
    } else if (this.subscriptionTier === 'premium+') {
      // Premium+ users: max 20 stocks per portfolio, 5 portfolios each type
      const Portfolio = mongoose.model('Portfolio');
      const solidPortfolios = await Portfolio.countDocuments({ 
        userId: this._id, 
        portfolioType: 'solid' 
      });
      const riskyPortfolios = await Portfolio.countDocuments({ 
        userId: this._id, 
        portfolioType: 'risky' 
      });
      
      if (solidPortfolios > 5 || riskyPortfolios > 5) {
        const error = new Error('Premium+ users are limited to 5 portfolios of each type');
        return next(error);
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

export default mongoose.model<IUser>('User', UserSchema);
