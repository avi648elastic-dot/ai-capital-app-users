import User from '../models/User';
import PositionHistory from '../models/PositionHistory';
import Portfolio from '../models/Portfolio';
import { loggerService } from './loggerService';

export class ReputationService {
  
  /**
   * Calculate and update user reputation when a position is closed
   */
  async updateReputationOnPositionClose(
    userId: string,
    portfolioItem: any,
    exitPrice: number,
    exitReason: 'manual_delete' | 'stop_loss' | 'take_profit' | 'manual_close'
  ): Promise<void> {
    try {
      loggerService.info(`🏆 [REPUTATION] Updating reputation for user ${userId} on position close`);
      
      // Calculate realized P&L
      const entryPrice = portfolioItem.entryPrice;
      const shares = portfolioItem.shares;
      const realizedPnL = (exitPrice - entryPrice) * shares;
      const realizedPnLPercent = entryPrice > 0 ? ((exitPrice - entryPrice) / entryPrice) * 100 : 0;
      
      loggerService.info(`🏆 [REPUTATION] Position: ${portfolioItem.ticker}, Entry: $${entryPrice}, Exit: $${exitPrice}, Shares: ${shares}, P&L: $${realizedPnL.toFixed(2)}`);
      
      // Save to position history
      const positionHistory = new PositionHistory({
        userId,
        ticker: portfolioItem.ticker,
        shares,
        entryPrice,
        exitPrice,
        realizedPnL,
        realizedPnLPercent,
        entryDate: portfolioItem.createdAt || portfolioItem.date,
        exitDate: new Date(),
        portfolioType: portfolioItem.portfolioType,
        portfolioId: portfolioItem.portfolioId,
        exitReason,
        notes: `Closed position - ${exitReason}`,
        action: 'SELL'
      });
      
      await positionHistory.save();
      loggerService.info(`🏆 [REPUTATION] Position history saved for ${portfolioItem.ticker}`);
      
      // Update user reputation stats
      await this.updateUserReputationStats(userId);
      
    } catch (error) {
      loggerService.error(`❌ [REPUTATION] Error updating reputation:`, error);
      throw error;
    }
  }
  
  /**
   * Recalculate and update all user reputation statistics
   */
  async updateUserReputationStats(userId: string): Promise<void> {
    try {
      loggerService.info(`🏆 [REPUTATION] Recalculating reputation stats for user ${userId}`);
      
      // Get all closed positions for this user
      const closedPositions = await PositionHistory.find({ userId }).sort({ exitDate: -1 });
      
      if (closedPositions.length === 0) {
        loggerService.info(`🏆 [REPUTATION] No closed positions found for user ${userId}`);
        return;
      }
      
      // Calculate stats
      const totalRealizedPnL = closedPositions.reduce((sum, pos) => sum + pos.realizedPnL, 0);
      const totalPositions = closedPositions.length;
      
      // Calculate win rate
      const winningPositions = closedPositions.filter(pos => pos.realizedPnL > 0);
      const losingPositions = closedPositions.filter(pos => pos.realizedPnL < 0);
      const winRate = totalPositions > 0 ? (winningPositions.length / totalPositions) * 100 : 0;
      
      // Calculate averages
      const averageWin = winningPositions.length > 0 
        ? winningPositions.reduce((sum, pos) => sum + pos.realizedPnL, 0) / winningPositions.length 
        : 0;
      
      const averageLoss = losingPositions.length > 0 
        ? losingPositions.reduce((sum, pos) => sum + pos.realizedPnL, 0) / losingPositions.length 
        : 0;
      
      // Find best and worst trades
      const bestTrade = closedPositions.length > 0 
        ? Math.max(...closedPositions.map(pos => pos.realizedPnL)) 
        : 0;
      
      const worstTrade = closedPositions.length > 0 
        ? Math.min(...closedPositions.map(pos => pos.realizedPnL)) 
        : 0;
      
      // Update user document
      await User.findByIdAndUpdate(userId, {
        reputation: totalRealizedPnL,
        totalRealizedPnL,
        totalPositionsClosed: totalPositions,
        winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
        averageWin: Math.round(averageWin * 100) / 100,
        averageLoss: Math.round(averageLoss * 100) / 100,
        bestTrade: Math.round(bestTrade * 100) / 100,
        worstTrade: Math.round(worstTrade * 100) / 100
      });
      
      loggerService.info(`🏆 [REPUTATION] Updated reputation for user ${userId}:`, {
        totalRealizedPnL,
        totalPositions,
        winRate,
        averageWin,
        averageLoss,
        bestTrade,
        worstTrade
      });
      
    } catch (error) {
      loggerService.error(`❌ [REPUTATION] Error updating user reputation stats:`, error);
      throw error;
    }
  }
  
  /**
   * Get leaderboard of top traders by reputation
   */
  async getLeaderboard(limit: number = 50): Promise<any[]> {
    try {
      loggerService.info(`🏆 [REPUTATION] Fetching leaderboard (top ${limit})`);
      
      const leaderboard = await User.find({
        totalPositionsClosed: { $gt: 0 } // Only users who have closed positions
      })
      .select('name reputation totalRealizedPnL totalPositionsClosed winRate bestTrade avatar')
      .sort({ reputation: -1 })
      .limit(limit);
      
      // Add ranking
      const rankedLeaderboard = leaderboard.map((user, index) => ({
        rank: index + 1,
        name: user.name,
        reputation: user.reputation,
        totalRealizedPnL: user.totalRealizedPnL,
        totalPositionsClosed: user.totalPositionsClosed,
        winRate: user.winRate,
        bestTrade: user.bestTrade,
        avatar: user.avatar,
        isProfitable: user.reputation > 0
      }));
      
      loggerService.info(`🏆 [REPUTATION] Leaderboard generated with ${rankedLeaderboard.length} users`);
      return rankedLeaderboard;
      
    } catch (error) {
      loggerService.error(`❌ [REPUTATION] Error fetching leaderboard:`, error);
      throw error;
    }
  }
  
  /**
   * Get user's trading history
   */
  async getUserTradingHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const history = await PositionHistory.find({ userId })
        .sort({ exitDate: -1 })
        .limit(limit);
      
      return history.map(pos => ({
        ticker: pos.ticker,
        shares: pos.shares,
        entryPrice: pos.entryPrice,
        exitPrice: pos.exitPrice,
        realizedPnL: pos.realizedPnL,
        realizedPnLPercent: pos.realizedPnLPercent,
        entryDate: pos.entryDate,
        exitDate: pos.exitDate,
        portfolioType: pos.portfolioType,
        exitReason: pos.exitReason,
        isProfitable: pos.realizedPnL > 0
      }));
      
    } catch (error) {
      loggerService.error(`❌ [REPUTATION] Error fetching user trading history:`, error);
      throw error;
    }
  }
  
  /**
   * Get user's reputation summary
   */
  async getUserReputationSummary(userId: string): Promise<any> {
    try {
      const user = await User.findById(userId).select('name reputation totalRealizedPnL totalPositionsClosed winRate averageWin averageLoss bestTrade worstTrade');
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return {
        name: user.name,
        reputation: user.reputation,
        totalRealizedPnL: user.totalRealizedPnL,
        totalPositionsClosed: user.totalPositionsClosed,
        winRate: user.winRate,
        averageWin: user.averageWin,
        averageLoss: user.averageLoss,
        bestTrade: user.bestTrade,
        worstTrade: user.worstTrade,
        isProfitable: user.reputation > 0,
        rank: await this.getUserRank(userId)
      };
      
    } catch (error) {
      loggerService.error(`❌ [REPUTATION] Error fetching user reputation summary:`, error);
      throw error;
    }
  }
  
  /**
   * Get user's rank in the leaderboard
   */
  async getUserRank(userId: string): Promise<number> {
    try {
      const user = await User.findById(userId).select('reputation');
      if (!user) return 0;
      
      const rank = await User.countDocuments({
        reputation: { $gt: user.reputation },
        totalPositionsClosed: { $gt: 0 }
      });
      
      return rank + 1; // +1 because rank starts from 1
      
    } catch (error) {
      loggerService.error(`❌ [REPUTATION] Error getting user rank:`, error);
      return 0;
    }
  }
}

export const reputationService = new ReputationService();
