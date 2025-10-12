/**
 * 🔍 Query Performance Benchmarking Utility
 * 
 * This utility helps benchmark MongoDB queries using .explain()
 * to identify slow queries and optimize indexes.
 */

import mongoose from 'mongoose';
import { loggerService } from '../services/loggerService';

interface ExplainStats {
  executionTimeMillis: number;
  totalKeysExamined: number;
  totalDocsExamined: number;
  nReturned: number;
  stage: string;
  indexUsed?: string;
}

/**
 * Benchmark a MongoDB query using .explain()
 */
export async function benchmarkQuery(
  model: mongoose.Model<any>,
  query: any,
  queryName: string
): Promise<ExplainStats> {
  try {
    const startTime = Date.now();
    
    // Execute query with explain
    const explanation = await model.find(query).explain('executionStats');
    
    const duration = Date.now() - startTime;
    
    // Extract relevant stats - Type-safe access to MongoDB explain result
    const explainResult = explanation as any;
    const executionStats = explainResult.executionStats || {};
    const executionStages = executionStats.executionStages || {};
    
    const stats: ExplainStats = {
      executionTimeMillis: executionStats.executionTimeMillis || duration,
      totalKeysExamined: executionStats.totalKeysExamined || 0,
      totalDocsExamined: executionStats.totalDocsExamined || 0,
      nReturned: executionStats.nReturned || 0,
      stage: executionStages.stage || 'UNKNOWN',
      indexUsed: executionStages.indexName,
    };

    // Log performance metrics
    loggerService.info(`📊 [QUERY BENCHMARK] ${queryName}`, {
      duration: `${stats.executionTimeMillis}ms`,
      keysExamined: stats.totalKeysExamined,
      docsExamined: stats.totalDocsExamined,
      returned: stats.nReturned,
      stage: stats.stage,
      indexUsed: stats.indexUsed || 'NONE',
      efficiency: stats.totalDocsExamined === 0 
        ? '100%' 
        : `${((stats.nReturned / stats.totalDocsExamined) * 100).toFixed(2)}%`,
    });

    // Warn if query is inefficient
    if (stats.executionTimeMillis > 100) {
      loggerService.warn(`⚠️ [SLOW QUERY] ${queryName} took ${stats.executionTimeMillis}ms`, {
        query: JSON.stringify(query),
        recommendation: stats.indexUsed 
          ? 'Query is slow despite using index. Consider query optimization.'
          : 'No index used! Add appropriate index to improve performance.',
      });
    }

    if (stats.totalDocsExamined > stats.nReturned * 10) {
      loggerService.warn(`⚠️ [INEFFICIENT QUERY] ${queryName} scanned ${stats.totalDocsExamined} docs but returned ${stats.nReturned}`, {
        query: JSON.stringify(query),
        recommendation: 'Add more selective indexes or refine query conditions.',
      });
    }

    return stats;
  } catch (error) {
    loggerService.error(`❌ [QUERY BENCHMARK] Failed to benchmark ${queryName}`, { error });
    throw error;
  }
}

/**
 * Benchmark common queries for a model
 */
export async function benchmarkModelQueries(
  model: mongoose.Model<any>,
  modelName: string,
  queries: { name: string; query: any }[]
): Promise<void> {
  loggerService.info(`🔍 [BENCHMARK] Starting benchmark for ${modelName}`);
  
  for (const { name, query } of queries) {
    await benchmarkQuery(model, query, `${modelName}.${name}`);
  }
  
  loggerService.info(`✅ [BENCHMARK] Completed benchmark for ${modelName}`);
}

/**
 * Run benchmark tests on all critical queries
 */
export async function runFullBenchmark(): Promise<void> {
  try {
    loggerService.info('🚀 [BENCHMARK] Starting full query benchmark suite');
    
    // Import models
    const User = (await import('../models/User')).default;
    const Portfolio = (await import('../models/Portfolio')).default;
    const HistoricalData = (await import('../models/HistoricalData')).default;
    const Watchlist = (await import('../models/Watchlist')).default;

    // Benchmark User queries
    await benchmarkModelQueries(User, 'User', [
      { name: 'findByEmail', query: { email: 'test@example.com' } },
      { name: 'findPremiumUsers', query: { subscriptionTier: 'premium' } },
      { name: 'findActiveUsers', query: { lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
    ]);

    // Benchmark Portfolio queries
    await benchmarkModelQueries(Portfolio, 'Portfolio', [
      { name: 'findByUserId', query: { userId: new mongoose.Types.ObjectId() } },
      { name: 'findByUserAndType', query: { userId: new mongoose.Types.ObjectId(), type: 'sim' } },
      { name: 'findWithStocks', query: { 'stocks.0': { $exists: true } } },
    ]);

    // Benchmark HistoricalData queries
    await benchmarkModelQueries(HistoricalData, 'HistoricalData', [
      { name: 'findBySymbol', query: { symbol: 'AAPL' } },
      { name: 'findRecentBySymbol', query: { symbol: 'AAPL', date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } },
      { name: 'findByDateRange', query: { date: { $gte: new Date('2024-01-01'), $lte: new Date('2024-12-31') } } },
    ]);

    // Benchmark Watchlist queries
    await benchmarkModelQueries(Watchlist, 'Watchlist', [
      { name: 'findByUserId', query: { userId: new mongoose.Types.ObjectId() } },
      { name: 'findByUserAndTicker', query: { userId: new mongoose.Types.ObjectId(), ticker: 'AAPL' } },
      { name: 'findWithAlerts', query: { 'priceAlert.isActive': true } },
    ]);

    loggerService.info('✅ [BENCHMARK] Full query benchmark suite completed');
  } catch (error) {
    loggerService.error('❌ [BENCHMARK] Error running benchmark suite', { error });
    throw error;
  }
}

export default {
  benchmarkQuery,
  benchmarkModelQueries,
  runFullBenchmark,
};

