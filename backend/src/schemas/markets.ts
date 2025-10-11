import { z } from 'zod';

// Featured tickers schema
export const featuredTickersSchema = z.object({
  featuredTickers: z.array(z.string().min(1).max(10).regex(/^[A-Z0-9\.\-:]+$/i))
    .length(4)
    .describe('Exactly 4 stock ticker symbols')
});

// Market overview query schema
export const marketOverviewQuerySchema = z.object({
  refresh: z.boolean().optional().default(false)
});

