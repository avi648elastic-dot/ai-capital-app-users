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
  portfolioType: 'solid' | 'risky'; // Portfolio type (solid/risky)
  portfolioId: string; // Unique identifier for each portfolio (e.g., "solid-1", "risky-2")
  portfolioName?: string; // Optional custom name for the portfolio
  volatility?: number; // Portfolio volatility (calculated daily)
  lastVolatilityUpdate?: Date; // When volatility was last calculated
  sector?: string; // Stock sector (automatically assigned when stock is added)
  isTraining?: boolean; // Mark as training/test stock (excluded from expert portfolio)
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
    portfolioType: { type: String, enum: ['solid', 'risky'], required: true, default: 'solid' },
    portfolioId: { type: String, required: true, default: 'solid-1' }, // Default for existing portfolios
    portfolioName: String, // Optional custom name
    volatility: { type: Number, default: 0 }, // Portfolio volatility
    lastVolatilityUpdate: { type: Date, default: null }, // Last volatility calculation
    sector: String, // Stock sector (auto-assigned)
    isTraining: { type: Boolean, default: false }, // Training/test stock flag
  },
  { timestamps: true }
);

// 📊 MongoDB Indexes for Performance
PortfolioSchema.index({ userId: 1, portfolioType: 1 });
PortfolioSchema.index({ userId: 1, portfolioId: 1 });
PortfolioSchema.index({ ticker: 1 });
PortfolioSchema.index({ action: 1 });
PortfolioSchema.index({ createdAt: -1 });
PortfolioSchema.index({ updatedAt: -1 });
PortfolioSchema.index({ userId: 1, ticker: 1 }, { unique: true }); // Prevent duplicate stocks per user

// 🔒 Pre-save hook for stock limits validation
PortfolioSchema.pre('save', async function(next) {
  try {
    // 🆓 FREE APP MODE: Bypass all subscription limit checks
    // TO RE-ENABLE AFTER GOOGLE APPROVAL: Uncomment the code below and remove the bypass
    
    // Get user to check subscription tier
    const User = mongoose.model('User');
    const user = await User.findById(this.userId);
    
    if (!user) {
      const error = new Error('User not found');
      return next(error);
    }

    // Validate ticker format
    if (!/^[A-Z0-9\.\-:]+$/.test(this.ticker)) {
      const error = new Error('Invalid ticker format');
      return next(error);
    }

    // Ensure ticker is uppercase
    this.ticker = this.ticker.toUpperCase();

    // Admins bypass all limits
    if (user.isAdmin === true || user.role === 'admin') {
      return next();
    }

    // Check effective subscription tier (includes trial logic)
    let effectiveTier = user.subscriptionTier;
    if (user.isTrialActive && user.trialEndDate && new Date() < user.trialEndDate) {
      effectiveTier = 'premium+'; // Trial users get premium+ access
    }

    // Check stock limits based on effective subscription tier
    if (effectiveTier === 'free') {
      // Free users: max 10 stocks total
      const stockCount = await mongoose.model('Portfolio').countDocuments({ userId: this.userId });
      if (stockCount >= 10) {
        const error = new Error('Free users are limited to 10 stocks total. Upgrade to Premium to add more stocks.');
        return next(error);
      }
    } else if (effectiveTier === 'premium') {
      // Premium users: max 5 stocks per portfolio
      const portfolioStockCount = await mongoose.model('Portfolio').countDocuments({ 
        userId: this.userId, 
        portfolioId: this.portfolioId 
      });
      if (portfolioStockCount >= 5) {
        const error = new Error('Premium users are limited to 5 stocks per portfolio. Upgrade to Premium+ to add more stocks.');
        return next(error);
      }
    } else if (effectiveTier === 'premium+') {
      // Premium+ users: max 20 stocks per portfolio
      const portfolioStockCount = await mongoose.model('Portfolio').countDocuments({ 
        userId: this.userId, 
        portfolioId: this.portfolioId 
      });
      if (portfolioStockCount >= 20) {
        const error = new Error('Premium+ users are limited to 20 stocks per portfolio.');
        return next(error);
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

export default mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);
