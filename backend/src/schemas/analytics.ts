import { z } from 'zod';

// Analytics query schema
export const analyticsQuerySchema = z.object({
  portfolioId: z.string().optional(),
  days: z.coerce.number().int().positive().max(365).optional().default(30),
  includeCharts: z.coerce.boolean().optional().default(true)
});

// Portfolio performance query schema
export const portfolioPerformanceQuerySchema = z.object({
  portfolioId: z.string().min(1, 'Portfolio ID is required'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['7d', '30d', '60d', '90d', '1y']).optional().default('30d')
});

// Sector allocation query schema
export const sectorAllocationQuerySchema = z.object({
  portfolioId: z.string().optional(),
  includePerformance: z.coerce.boolean().optional().default(true)
});

// Risk metrics query schema
export const riskMetricsQuerySchema = z.object({
  portfolioId: z.string().min(1, 'Portfolio ID is required'),
  days: z.coerce.number().int().positive().max(365).optional().default(90)
});

// Performance comparison schema
export const performanceComparisonSchema = z.object({
  portfolioIds: z.array(z.string()).min(1).max(10),
  metric: z.enum(['returns', 'volatility', 'sharpe', 'maxDrawdown']).optional().default('returns'),
  period: z.enum(['7d', '30d', '60d', '90d', '1y']).optional().default('30d')
});

