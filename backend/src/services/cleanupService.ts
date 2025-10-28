import mongoose from 'mongoose';

export class CleanupService {
  private static instance: CleanupService;

  static getInstance() {
    if (!this.instance) this.instance = new CleanupService();
    return this.instance;
  }

  /**
   * Remove orphaned portfolios that reference non-existent users.
   * Dry-run supported.
   */
  async removeOrphanedPortfolios(dryRun: boolean = false) {
    const { default: Portfolio } = await import('../models/Portfolio');
    const { default: User } = await import('../models/User');

    const portfolios = await Portfolio.find({}, { _id: 1, userId: 1, ticker: 1, createdAt: 1 }).lean();
    const userIds = [...new Set(portfolios.map(p => String(p.userId)))];
    const existingUsers = await User.find({ _id: { $in: userIds } }, { _id: 1 }).lean();
    const existingSet = new Set(existingUsers.map(u => String(u._id)));

    const orphanIds = portfolios.filter(p => !existingSet.has(String(p.userId))).map(p => p._id);

    if (orphanIds.length === 0) return { removed: 0, orphanIds: [] };
    if (dryRun) return { removed: 0, orphanIds };

    const res = await Portfolio.deleteMany({ _id: { $in: orphanIds } });
    return { removed: res.deletedCount || 0, orphanIds };
  }

  /**
   * Soft-flag users inactive for N days (default 60). No deletion.
   * Adds `inactiveSince` and returns count.
   */
  async flagInactiveUsers(days: number = 60) {
    const { default: User } = await import('../models/User');
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const users = await User.find({}, { _id: 1, lastLogin: 1, updatedAt: 1, createdAt: 1 }).lean();
    const toFlag: string[] = [];
    for (const u of users) {
      const activity = (u as any).lastLogin || (u as any).updatedAt || (u as any).createdAt;
      if (activity && new Date(activity) < cutoff) {
        toFlag.push(String((u as any)._id));
      }
    }

    if (toFlag.length === 0) return { flagged: 0, userIds: [] };

    const res = await User.updateMany(
      { _id: { $in: toFlag } },
      { $set: { inactiveSince: new Date() } }
    );
    return { flagged: res.modifiedCount || 0, userIds: toFlag };
  }
}

export default CleanupService.getInstance();


