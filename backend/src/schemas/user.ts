import { z } from 'zod';

/**
 * 👤 User Schemas
 */

// User profile update schema
export const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
    .optional(),
  
  email: z.string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be less than 100 characters')
    .toLowerCase()
    .optional(),
  
  subscriptionTier: z.enum(['free', 'premium', 'premium+'])
    .optional(),
  
  riskTolerance: z.number()
    .min(1, 'Risk tolerance must be at least 1')
    .max(10, 'Risk tolerance cannot exceed 10')
    .optional(),
  
  totalCapital: z.number()
    .positive('Total capital must be positive')
    .max(10000000, 'Total capital cannot exceed $10,000,000')
    .optional(),
  
  featuredTickers: z.array(z.string()
    .min(1, 'Ticker cannot be empty')
    .max(10, 'Ticker must be less than 10 characters')
    .regex(/^[A-Z0-9\.\-:]+$/, 'Invalid ticker format')
    .transform(val => val.toUpperCase())
  )
    .max(10, 'Maximum 10 featured tickers allowed')
    .optional(),
});

// Avatar upload schema
export const avatarUploadSchema = z.object({
  // File validation will be handled by multer middleware
  // This schema is for additional validation if needed
});

// User settings schema
export const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark'])
    .optional()
    .default('dark'),
  
  notifications: z.object({
    email: z.boolean().optional().default(true),
    push: z.boolean().optional().default(true),
    dashboard: z.boolean().optional().default(true),
  }).optional(),
  
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private'])
      .optional()
      .default('private'),
    shareAnalytics: z.boolean().optional().default(false),
  }).optional(),
});

// User query schema
export const userQuerySchema = z.object({
  subscriptionTier: z.enum(['free', 'premium', 'premium+', 'all'])
    .optional()
    .default('all'),
  
  isActive: z.coerce.boolean().optional(),
  
  limit: z.coerce.number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(50),
  
  offset: z.coerce.number()
    .min(0, 'Offset must be non-negative')
    .optional()
    .default(0),
  
  search: z.string()
    .max(100, 'Search term must be less than 100 characters')
    .optional(),
});
