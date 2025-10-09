import { z } from 'zod';

/**
 * 📊 Portfolio Schemas
 */

// Stock entry schema
export const stockSchema = z.object({
  ticker: z.string()
    .min(1, 'Ticker is required')
    .max(10, 'Ticker must be less than 10 characters')
    .regex(/^[A-Z0-9\.\-:]+$/, 'Ticker can only contain uppercase letters, numbers, dots, dashes, and colons')
    .transform(val => val.toUpperCase()),
  
  shares: z.number()
    .positive('Shares must be a positive number')
    .max(1000000, 'Shares cannot exceed 1,000,000'),
  
  entryPrice: z.number()
    .positive('Entry price must be positive')
    .max(100000, 'Entry price cannot exceed $100,000'),
  
  currentPrice: z.number()
    .positive('Current price must be positive')
    .max(100000, 'Current price cannot exceed $100,000')
    .optional(),
  
  stopLoss: z.number()
    .positive('Stop loss must be positive')
    .max(100000, 'Stop loss cannot exceed $100,000')
    .optional(),
  
  takeProfit: z.number()
    .positive('Take profit must be positive')
    .max(100000, 'Take profit cannot exceed $100,000')
    .optional(),
  
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
  
  portfolioType: z.enum(['solid', 'risky']),
  
  portfolioId: z.string()
    .min(1, 'Portfolio ID is required')
    .max(50, 'Portfolio ID must be less than 50 characters'),
});

// Portfolio creation schema
export const createPortfolioSchema = z.object({
  stocks: z.array(stockSchema)
    .min(1, 'At least one stock is required')
    .max(20, 'Maximum 20 stocks allowed'),
  
  totalCapital: z.number()
    .positive('Total capital must be positive')
    .max(10000000, 'Total capital cannot exceed $10,000,000'),
  
  riskTolerance: z.number()
    .min(1, 'Risk tolerance must be at least 1')
    .max(10, 'Risk tolerance cannot exceed 10'),
});

// Portfolio update schema
export const updatePortfolioSchema = z.object({
  ticker: z.string()
    .min(1, 'Ticker is required')
    .max(10, 'Ticker must be less than 10 characters')
    .regex(/^[A-Z0-9\.\-:]+$/, 'Invalid ticker format')
    .transform(val => val.toUpperCase()),
  
  shares: z.number()
    .positive('Shares must be positive')
    .max(1000000, 'Shares cannot exceed 1,000,000')
    .optional(),
  
  entryPrice: z.number()
    .positive('Entry price must be positive')
    .max(100000, 'Entry price cannot exceed $100,000')
    .optional(),
  
  stopLoss: z.number()
    .positive('Stop loss must be positive')
    .max(100000, 'Stop loss cannot exceed $100,000')
    .optional(),
  
  takeProfit: z.number()
    .positive('Take profit must be positive')
    .max(100000, 'Take profit cannot exceed $100,000')
    .optional(),
  
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
});

// Portfolio query schema
export const portfolioQuerySchema = z.object({
  portfolioType: z.enum(['solid', 'risky', 'all'])
    .optional()
    .default('all'),
  
  portfolioId: z.string()
    .max(50, 'Portfolio ID must be less than 50 characters')
    .optional(),
  
  limit: z.coerce.number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(50),
  
  offset: z.coerce.number()
    .min(0, 'Offset must be non-negative')
    .optional()
    .default(0),
});
