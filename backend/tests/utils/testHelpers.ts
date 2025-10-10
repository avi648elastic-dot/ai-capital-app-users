import mongoose from 'mongoose';
import User from '../../src/models/User';
import Portfolio from '../../src/models/Portfolio';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aicapital-test');
  }
};

export const disconnectDB = async () => {
  await mongoose.connection.close();
};

export const clearDB = async () => {
  await User.deleteMany({});
  await Portfolio.deleteMany({});
};

export const createTestUser = async (userData = {}) => {
  const defaultData = {
    name: 'Test User',
    email: 'test@example.com',
    password: await bcrypt.hash('TestPassword123', 10),
    subscriptionTier: 'premium'
  };

  const user = await User.create({ ...defaultData, ...userData });
  return user;
};

export const createTestToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret');
};

export const createTestPortfolio = async (userId: string, portfolioData = {}) => {
  const defaultData = {
    userId,
    ticker: 'AAPL',
    shares: 10,
    entryPrice: 150,
    currentPrice: 155,
    portfolioType: 'solid',
    portfolioId: 'solid-1',
    action: 'HOLD'
  };

  const portfolio = await Portfolio.create({ ...defaultData, ...portfolioData });
  return portfolio;
};

export const mockStockData = {
  AAPL: {
    symbol: 'AAPL',
    price: 155.50,
    change: 2.30,
    changePercent: 1.50,
    volume: 45000000,
    marketCap: 2500000000000,
    exchange: 'NASDAQ'
  },
  MSFT: {
    symbol: 'MSFT',
    price: 310.25,
    change: -1.75,
    changePercent: -0.56,
    volume: 25000000,
    marketCap: 2300000000000,
    exchange: 'NASDAQ'
  }
};

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
