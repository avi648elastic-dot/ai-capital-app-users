import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  subscriptionActive: boolean;
  apiKey?: string;
  onboardingCompleted: boolean;
  portfolioType?: 'solid' | 'dangerous';
  portfolioSource?: 'imported' | 'ai-generated';
  riskTolerance?: number; // percentage for stop loss/take profit
  totalCapital?: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  subscriptionActive: {
    type: Boolean,
    default: false,
  },
  apiKey: {
    type: String,
    unique: true,
    sparse: true,
  },
  onboardingCompleted: {
    type: Boolean,
    default: false,
  },
  portfolioType: {
    type: String,
    enum: ['solid', 'dangerous'],
  },
  portfolioSource: {
    type: String,
    enum: ['imported', 'ai-generated'],
  },
  riskTolerance: {
    type: Number,
    default: 7, // 7% default risk tolerance
    min: 1,
    max: 20,
  },
  totalCapital: {
    type: Number,
    min: 0,
  },
}, {
  timestamps: true,
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const bcrypt = require('bcryptjs');
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(candidatePassword, this.password);
};


export default mongoose.model<IUser>('User', UserSchema);
