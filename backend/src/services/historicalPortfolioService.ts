import HistoricalPortfolio, { IHistoricalPortfolio } from '../models/HistoricalPortfolio';
import { loggerService } from './loggerService';
import { redisService } from './redisService';

export class HistoricalPortfolioService {
  private static instance: HistoricalPortfolioService;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  static getInstance(): HistoricalPortfolioService {
    if (!HistoricalPortfolioService.instance) {
      HistoricalPortfolioService.instance = new HistoricalPortfolioService();
    }
    return HistoricalPortfolioService.instance;
  }

  /**
   * Save today's portfolio snapshot (idempotent - won't create duplicates)
   */
  async saveDailySnapshot(userId: string, portfolioData: any, sectorData: any[]): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Check if snapshot for today already exists
      const existing = await HistoricalPortfolio.findOne({ userId, date: today });
      if (existing) {
        loggerService.info(`📊 [HISTORICAL] Snapshot already exists for ${today}, skipping save`);
        return true; // Already saved, not an error
      }

      // Calculate totals
      const totalCost = portfolioData.reduce((sum: number, stock: any) => sum + (stock.entryPrice * stock.shares), 0);
      const totalValue = portfolioData.reduce((sum: number, stock: any) => sum + (stock.currentPrice * stock.shares), 0);
      const totalPnL = totalValue - totalCost;
      const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

      // Prepare stock data
      const stocks = portfolioData.map((stock: any) => ({
        ticker: stock.ticker,
        shares: stock.shares,
        entryPrice: stock.entryPrice,
        currentPrice: stock.currentPrice,
        value: stock.currentPrice * stock.shares,
        pnl: (stock.currentPrice - stock.entryPrice) * stock.shares,
        pnlPercent: stock.entryPrice > 0 ? ((stock.currentPrice - stock.entryPrice) / stock.entryPrice) * 100 : 0
      }));

      // Create snapshot
      const snapshot = new HistoricalPortfolio({
        userId,
        date: today,
        totalValue,
        totalCost,
        totalPnL,
        totalPnLPercent,
        sectorAllocation: sectorData,
        stocks,
        metadata: {
          dataSource: portfolioData[0]?.dataSource || 'api',
          timestamp: new Date()
        }
      });

      await snapshot.save();
      loggerService.info(`✅ [HISTORICAL] Saved daily snapshot for ${today}`);

      // Clear cache for this user to force refresh
      const cacheKey = `historical_portfolio:${userId}`;
      await redisService.del(cacheKey);

      return true;
    } catch (error) {
      loggerService.error('❌ [HISTORICAL] Error saving snapshot:', error);
      return false;
    }
  }

  /**
   * Get historical portfolio data for last N days (optimized with caching)
   */
  async getHistoricalData(userId: string, days: number = 30): Promise<any[]> {
    try {
      const cacheKey = `historical_portfolio:${userId}:${days}`;

      // Check cache first
      if (redisService.isRedisConnected()) {
        const cached = await redisService.get(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          loggerService.info(`✅ [HISTORICAL] Cache hit for user ${userId}`);
          return data;
        }
      }

      // Query MongoDB for last N days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const snapshots = await HistoricalPortfolio.find({
        userId,
        createdAt: { $gte: startDate }
      })
      .sort({ date: 1 }) // Oldest first for chart
      .lean()
      .exec();

      // Convert to chart format
      const historicalData = snapshots.map(snapshot => {
        // Calculate daily change from previous day
        const snapshotIndex = snapshots.indexOf(snapshot);
        const previousSnapshot = snapshotIndex > 0 ? snapshots[snapshotIndex - 1] : null;
        
        let dailyChange = 0;
        let dailyChangePercent = 0;
        
        if (previousSnapshot) {
          dailyChange = snapshot.totalPnL - previousSnapshot.totalPnL;
          dailyChangePercent = previousSnapshot.totalPnLPercent !== 0 
            ? ((snapshot.totalPnLPercent - previousSnapshot.totalPnLPercent))
            : 0;
        }

        return {
          date: snapshot.date,
          totalValue: snapshot.totalValue,
          totalCost: snapshot.totalCost,
          pnl: snapshot.totalPnL,
          pnlPercent: snapshot.totalPnLPercent,
          dailyChange: dailyChange,
          dailyChangePercent: dailyChangePercent
        };
      });

      // Cache for 5 minutes
      if (redisService.isRedisConnected()) {
        await redisService.set(cacheKey, JSON.stringify(historicalData), this.CACHE_DURATION);
      }

      loggerService.info(`📊 [HISTORICAL] Fetched ${historicalData.length} days of history for user ${userId}`);
      return historicalData;
    } catch (error) {
      loggerService.error('❌ [HISTORICAL] Error fetching historical data:', error);
      return [];
    }
  }

  /**
   * Get latest snapshot for a user
   */
  async getLatestSnapshot(userId: string): Promise<any> {
    try {
      return await HistoricalPortfolio.findOne({ userId })
        .sort({ date: -1 })
        .lean()
        .exec();
    } catch (error) {
      loggerService.error('❌ [HISTORICAL] Error fetching latest snapshot:', error);
      return null;
    }
  }

  /**
   * Cleanup old snapshots (keep last 90 days)
   */
  async cleanupOldSnapshots(keepDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - keepDays);

      const result = await HistoricalPortfolio.deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      loggerService.info(`🧹 [HISTORICAL] Cleaned up ${result.deletedCount} old snapshots`);
      return result.deletedCount || 0;
    } catch (error) {
      loggerService.error('❌ [HISTORICAL] Error cleaning up snapshots:', error);
      return 0;
    }
  }
}

export default HistoricalPortfolioService;
