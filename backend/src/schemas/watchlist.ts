import { z } from 'zod';

// Add stock to watchlist schema
export const addWatchlistStockSchema = z.object({
  ticker: z.string()
    .min(1, 'Ticker is required')
    .max(10, 'Ticker too long')
    .regex(/^[A-Z0-9\.\-:]+$/i, 'Invalid ticker format')
    .transform(val => val.toUpperCase()),
  
  name: z.string().optional(),
  
  notifications: z.boolean().optional().default(true)
});

// Update notifications schema
export const updateNotificationsSchema = z.object({
  enabled: z.boolean()
});

// Price alert schema
export const priceAlertSchema = z.object({
  type: z.enum(['high', 'low', 'both']),
  
  highPrice: z.number()
    .positive('High price must be greater than 0')
    .optional(),
  
  lowPrice: z.number()
    .positive('Low price must be greater than 0')
    .optional(),
  
  enabled: z.boolean().optional().default(true)
}).refine(
  (data) => {
    // If type is 'high' or 'both', highPrice must be provided
    if ((data.type === 'high' || data.type === 'both') && !data.highPrice) {
      return false;
    }
    // If type is 'low' or 'both', lowPrice must be provided
    if ((data.type === 'low' || data.type === 'both') && !data.lowPrice) {
      return false;
    }
    // If type is 'both', lowPrice must be less than highPrice
    if (data.type === 'both' && data.lowPrice && data.highPrice && data.lowPrice >= data.highPrice) {
      return false;
    }
    return true;
  },
  {
    message: 'Invalid price alert configuration'
  }
);

// Toggle alert schema
export const toggleAlertSchema = z.object({
  enabled: z.boolean()
});

// Watchlist query schema
export const watchlistQuerySchema = z.object({
  includeDisabled: z.boolean().optional().default(false)
});

