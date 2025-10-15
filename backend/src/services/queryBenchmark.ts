import mongoose from 'mongoose';
import Portfolio from '../models/Portfolio';
import User from '../models/User';
import Notification from '../models/Notification';
import { loggerService } from './loggerService';

interface QueryResult {
  operation: string;
  duration: number;
  documentsExamined: number;
  documentsReturned: number;
  indexUsed?: string;
  executionStats?: any;
}

class QueryBenchmarkService {
  private results: QueryResult[] = [];

  // Benchmark a query and return performance metrics
  async benchmarkQuery<T>(
    operation: string,
    query: () => Promise<T>,
    explain = false
  ): Promise<{ result: T; metrics: QueryResult }> {
    const startTime = Date.now();
    
    try {
      const result = await query();
      const duration = Date.now() - startTime;
      
      let metrics: QueryResult = {
        operation,
        duration,
        documentsExamined: 0,
        documentsReturned: 0,
      };

      // If explain is enabled, get execution stats
      if (explain) {
        // This would need to be implemented per query type
        // For now, we'll use basic timing
      }

      this.results.push(metrics);
      
      loggerService.info(`Query benchmark: ${operation}`, {
        duration: `${duration}ms`,
        documentsExamined: metrics.documentsExamined,
        documentsReturned: metrics.documentsReturned,
      });

      return { result, metrics };
    } catch (error) {
      const duration = Date.now() - startTime;
      loggerService.error(`Query benchmark failed: ${operation}`, {
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // Benchmark portfolio queries
  async benchmarkPortfolioQueries(userId: string) {
    const benchmarks = [];

    // 1. Get all portfolios for user
    const portfolioQuery = await this.benchmarkQuery(
      'Get user portfolios',
      () => Portfolio.find({ userId }).sort({ createdAt: -1 }).lean()
    );
    benchmarks.push(portfolioQuery.metrics);

    // 2. Get portfolios by type
    const portfolioByTypeQuery = await this.benchmarkQuery(
      'Get portfolios by type',
      () => Portfolio.find({ userId, portfolioType: 'solid' }).lean()
    );
    benchmarks.push(portfolioByTypeQuery.metrics);

    // 3. Get portfolios by specific portfolioId
    const portfolioByIdQuery = await this.benchmarkQuery(
      'Get portfolios by portfolioId',
      () => Portfolio.find({ userId, portfolioId: 'solid-1' }).lean()
    );
    benchmarks.push(portfolioByIdQuery.metrics);

    // 4. Count portfolios
    const countQuery = await this.benchmarkQuery(
      'Count user portfolios',
      () => Portfolio.countDocuments({ userId })
    );
    benchmarks.push(countQuery.metrics);

    // 5. Get distinct portfolio IDs
    const distinctQuery = await this.benchmarkQuery(
      'Get distinct portfolio IDs',
      () => Portfolio.distinct('portfolioId', { userId })
    );
    benchmarks.push(distinctQuery.metrics);

    return benchmarks;
  }

  // Benchmark user queries
  async benchmarkUserQueries() {
    const benchmarks = [];

    // 1. Find user by email
    const userByEmailQuery = await this.benchmarkQuery(
      'Find user by email',
      () => User.findOne({ email: 'test@example.com' }).lean()
    );
    benchmarks.push(userByEmailQuery.metrics);

    // 2. Find users by subscription tier
    const usersByTierQuery = await this.benchmarkQuery(
      'Find users by subscription tier',
      () => User.find({ subscriptionTier: 'premium' }).lean()
    );
    benchmarks.push(usersByTierQuery.metrics);

    // 3. Count users
    const countUsersQuery = await this.benchmarkQuery(
      'Count users',
      () => User.countDocuments()
    );
    benchmarks.push(countUsersQuery.metrics);

    return benchmarks;
  }

  // Benchmark notification queries
  async benchmarkNotificationQueries(userId: string) {
    const benchmarks = [];

    // 1. Get user notifications
    const notificationsQuery = await this.benchmarkQuery(
      'Get user notifications',
      () => Notification.find({ userId }).sort({ createdAt: -1 }).lean()
    );
    benchmarks.push(notificationsQuery.metrics);

    // 2. Get unread notifications
    const unreadQuery = await this.benchmarkQuery(
      'Get unread notifications',
      () => Notification.find({ userId, isRead: false }).lean()
    );
    benchmarks.push(unreadQuery.metrics);

    // 3. Count unread notifications
    const countUnreadQuery = await this.benchmarkQuery(
      'Count unread notifications',
      () => Notification.countDocuments({ userId, isRead: false })
    );
    benchmarks.push(countUnreadQuery.metrics);

    return benchmarks;
  }

  // Run comprehensive benchmark suite
  async runBenchmarkSuite(userId: string) {
    loggerService.info('Starting comprehensive query benchmark suite');

    const results = {
      portfolio: await this.benchmarkPortfolioQueries(userId),
      user: await this.benchmarkUserQueries(),
      notifications: await this.benchmarkNotificationQueries(userId),
    };

    // Calculate summary statistics
    const allBenchmarks = [
      ...results.portfolio,
      ...results.user,
      ...results.notifications,
    ];

    const summary = {
      totalQueries: allBenchmarks.length,
      averageDuration: allBenchmarks.reduce((sum, b) => sum + b.duration, 0) / allBenchmarks.length,
      slowestQuery: allBenchmarks.reduce((max, b) => b.duration > max.duration ? b : max),
      fastestQuery: allBenchmarks.reduce((min, b) => b.duration < min.duration ? b : min),
      queriesOver100ms: allBenchmarks.filter(b => b.duration > 100).length,
      queriesOver500ms: allBenchmarks.filter(b => b.duration > 500).length,
    };

    loggerService.info('Query benchmark summary', summary);

    return {
      results,
      summary,
      recommendations: this.generateRecommendations(allBenchmarks),
    };
  }

  // Generate optimization recommendations
  private generateRecommendations(benchmarks: QueryResult[]): string[] {
    const recommendations: string[] = [];

    // Check for slow queries
    const slowQueries = benchmarks.filter(b => b.duration > 100);
    if (slowQueries.length > 0) {
      recommendations.push(`Found ${slowQueries.length} queries over 100ms. Consider adding indexes or optimizing queries.`);
    }

    // Check for very slow queries
    const verySlowQueries = benchmarks.filter(b => b.duration > 500);
    if (verySlowQueries.length > 0) {
      recommendations.push(`Found ${verySlowQueries.length} queries over 500ms. These need immediate optimization.`);
    }

    // Check for queries that examine many documents
    const inefficientQueries = benchmarks.filter(b => b.documentsExamined > b.documentsReturned * 10);
    if (inefficientQueries.length > 0) {
      recommendations.push(`Found ${inefficientQueries.length} queries examining many more documents than returned. Consider adding compound indexes.`);
    }

    // Specific recommendations based on common patterns
    const portfolioQueries = benchmarks.filter(b => b.operation.includes('portfolio'));
    if (portfolioQueries.some(b => b.duration > 50)) {
      recommendations.push('Portfolio queries are slow. Ensure indexes exist on (userId, portfolioType) and (userId, portfolioId).');
    }

    const notificationQueries = benchmarks.filter(b => b.operation.includes('notification'));
    if (notificationQueries.some(b => b.duration > 50)) {
      recommendations.push('Notification queries are slow. Ensure indexes exist on (userId, isRead) and (userId, createdAt).');
    }

    return recommendations;
  }

  // Get benchmark results
  getResults(): QueryResult[] {
    return this.results;
  }

  // Clear results
  clearResults(): void {
    this.results = [];
  }

  // Export results to JSON
  exportResults(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        totalQueries: this.results.length,
        averageDuration: this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length,
        slowestQuery: this.results.reduce((max, r) => r.duration > max.duration ? r : max),
        fastestQuery: this.results.reduce((min, r) => r.duration < min.duration ? r : min),
      },
    }, null, 2);
  }
}

export const queryBenchmark = new QueryBenchmarkService();
