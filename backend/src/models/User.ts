import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string; // Optional for Google OAuth users
  googleId?: string; // Google OAuth ID
  subscriptionActive: boolean;
  subscriptionTier: 'free' | 'premium' | 'premium+'; // Updated to include premium+
  onboardingCompleted: boolean;
  isAdmin?: boolean;
  role?: 'user' | 'admin'; // User role
  isEmailVerified?: boolean; // Email verification status
  featuredTickers?: string[];
  portfolioType?: string;
  portfolioSource?: string;
  totalCapital?: number;
  riskTolerance?: number;
  language?: string;
  theme?: string;
  notifications?: boolean; // User notification preference
  emailUpdates?: boolean; // User email update preference
  avatar?: string; // Renamed from avatarUrl for consistency
  
  // 🏆 REPUTATION SYSTEM
  reputation: number; // Total realized P&L from all closed positions (USD)
  totalRealizedPnL: number; // Same as reputation but more explicit
  totalPositionsClosed: number; // Total number of positions closed
  winRate: number; // Percentage of profitable positions
  averageWin: number; // Average profit per winning position
  averageLoss: number; // Average loss per losing position
  bestTrade: number; // Best single trade profit
  worstTrade: number; // Worst single trade loss
  
  createdAt: Date;

  apiKey?: string;
  apiSecret?: string;
  shopDomain?: string;
  
  // 💳 STRIPE PAYMENT FIELDS
  stripeCustomerId?: string; // Stripe customer ID
  stripeSubscriptionId?: string; // Current Stripe subscription ID
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'; // Subscription status
  subscriptionEndDate?: Date; // When subscription ends/renews
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // Optional for Google OAuth users
    googleId: { type: String, unique: true, sparse: true }, // Google OAuth ID
    subscriptionActive: { type: Boolean, default: false },
    subscriptionTier: { type: String, enum: ['free', 'premium', 'premium+'], default: 'free' },
    onboardingCompleted: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }, // User role
    isEmailVerified: { type: Boolean, default: false }, // Email verification status
    featuredTickers: { type: [String], default: undefined },
    portfolioType: { type: String },
    portfolioSource: { type: String },
    totalCapital: { type: Number, default: 0 },
    riskTolerance: { type: Number, default: 0 },
    language: { type: String, default: 'en' },
    theme: { type: String, default: 'dark' },
    notifications: { type: Boolean, default: true },
    emailUpdates: { type: Boolean, default: true },
    avatar: { type: String }, // Avatar URL from Google or uploaded

    // 🏆 REPUTATION SYSTEM - Default values for new users
    reputation: { type: Number, default: 0 }, // Total realized P&L
    totalRealizedPnL: { type: Number, default: 0 }, // Same as reputation
    totalPositionsClosed: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 }, // Percentage (0-100)
    averageWin: { type: Number, default: 0 },
    averageLoss: { type: Number, default: 0 },
    bestTrade: { type: Number, default: 0 },
    worstTrade: { type: Number, default: 0 },

    apiKey: { type: String },
    apiSecret: { type: String },
    shopDomain: { type: String },
    
    // 💳 STRIPE PAYMENT FIELDS
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    subscriptionStatus: { type: String, enum: ['active', 'canceled', 'past_due', 'incomplete', 'trialing'] },
    subscriptionEndDate: { type: Date },
  },
  { timestamps: true }
);

// 📊 MongoDB Indexes for Performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ subscriptionTier: 1 });
UserSchema.index({ subscriptionActive: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ 'featuredTickers': 1 });

// 🏆 REPUTATION SYSTEM INDEXES
UserSchema.index({ reputation: -1 }); // For leaderboard queries
UserSchema.index({ totalRealizedPnL: -1 }); // For leaderboard queries
UserSchema.index({ winRate: -1 }); // For win rate leaderboard

// 💳 STRIPE PAYMENT INDEXES
UserSchema.index({ stripeCustomerId: 1 }); // For Stripe customer lookups
UserSchema.index({ stripeSubscriptionId: 1 }); // For subscription lookups
UserSchema.index({ subscriptionStatus: 1 }); // For subscription status queries

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
