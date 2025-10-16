import express from 'express';
import { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import Transaction from '../models/Transaction';
import User from '../models/User';
import DeletedTransactionAudit from '../models/DeletedTransactionAudit';

const router = express.Router();

// Get deleted transactions audit for a user
router.get('/audit/deleted', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { search, portfolioId, startDate, endDate } = req.query as any;

    const query: any = { userId };
    if (portfolioId) query.portfolioId = portfolioId;
    if (startDate || endDate) {
      query.deletedAt = {};
      if (startDate) query.deletedAt.$gte = new Date(startDate);
      if (endDate) query.deletedAt.$lte = new Date(endDate);
    }

    let transactions = await DeletedTransactionAudit.find(query).sort({ deletedAt: -1 }).lean();
    if (search) {
      const term = String(search).toLowerCase();
      transactions = transactions.filter((tx: any) =>
        tx.ticker.toLowerCase().includes(term) ||
        (tx.reason || '').toLowerCase().includes(term) ||
        (tx.beforeSnapshot?.notes || '').toLowerCase().includes(term)
      );
    }

    res.json({ success: true, transactions, total: transactions.length });

  } catch (error: any) {
    console.error('Error fetching deleted transactions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch deleted transactions',
      message: error.message 
    });
  }
});

// Get deleted transactions summary
router.get('/audit/deleted/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { portfolioId, startDate, endDate } = req.query as any;
    const match: any = { userId };
    if (portfolioId) match.portfolioId = portfolioId;
    if (startDate || endDate) {
      match.deletedAt = {};
      if (startDate) match.deletedAt.$gte = new Date(startDate);
      if (endDate) match.deletedAt.$lte = new Date(endDate);
    }

    const docs = await DeletedTransactionAudit.find(match).lean();
    const totalDeletedCount = docs.length;
    const totalDeletedAmount = docs.reduce((s: number, d: any) => s + (d.amount || 0), 0);

    const byTicker: Record<string, { count: number; amount: number }> = {};
    const byPortfolio: Record<string, { count: number; amount: number }> = {};
    docs.forEach((d: any) => {
      if (!byTicker[d.ticker]) byTicker[d.ticker] = { count: 0, amount: 0 };
      byTicker[d.ticker].count++;
      byTicker[d.ticker].amount += d.amount || 0;

      const pid = d.portfolioId || 'default';
      if (!byPortfolio[pid]) byPortfolio[pid] = { count: 0, amount: 0 };
      byPortfolio[pid].count++;
      byPortfolio[pid].amount += d.amount || 0;
    });

    res.json({ success: true, totalDeletedCount, totalDeletedAmount, byTicker, byPortfolio });

  } catch (error: any) {
    console.error('Error fetching deleted transactions summary:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch deleted transactions summary',
      message: error.message 
    });
  }
});

export default router;
