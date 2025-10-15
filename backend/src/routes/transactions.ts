import express from 'express';
import { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import Transaction from '../models/Transaction';
import User from '../models/User';

const router = express.Router();

// Get deleted transactions audit for a user
router.get('/audit/deleted', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { search, portfolioId, startDate, endDate } = req.query;

    // Build query for deleted transactions
    const query: any = {
      userId,
      type: 'delete'
    };

    if (portfolioId) {
      query.portfolioId = portfolioId;
    }

    if (startDate || endDate) {
      query.deletedAt = {};
      if (startDate) {
        query.deletedAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.deletedAt.$lte = new Date(endDate as string);
      }
    }

    // For now, we'll create mock data since we don't have a deleted transactions collection
    // In a real implementation, you'd have a separate DeletedTransaction model
    const mockDeletedTransactions = [
      {
        _id: '1',
        userId,
        transactionId: 'tx_123',
        type: 'delete',
        beforeSnapshot: {
          ticker: 'AAPL',
          amount: 1000,
          price: 150.00,
          type: 'buy',
          date: new Date('2024-01-15')
        },
        amount: 1000,
        ticker: 'AAPL',
        portfolioId: 'portfolio_1',
        deletedBy: userId,
        deletedAt: new Date('2024-01-20'),
        reason: 'User requested deletion'
      },
      {
        _id: '2',
        userId,
        transactionId: 'tx_124',
        type: 'delete',
        beforeSnapshot: {
          ticker: 'GOOGL',
          amount: 500,
          price: 2800.00,
          type: 'sell',
          date: new Date('2024-01-18')
        },
        amount: 500,
        ticker: 'GOOGL',
        portfolioId: 'portfolio_1',
        deletedBy: userId,
        deletedAt: new Date('2024-01-22'),
        reason: 'Duplicate transaction'
      }
    ];

    // Filter by search term if provided
    let filteredTransactions = mockDeletedTransactions;
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredTransactions = mockDeletedTransactions.filter(tx => 
        tx.ticker.toLowerCase().includes(searchTerm) ||
        tx.reason?.toLowerCase().includes(searchTerm)
      );
    }

    res.json({
      success: true,
      transactions: filteredTransactions,
      total: filteredTransactions.length
    });

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

    // Mock summary data
    const summary = {
      totalDeletedCount: 2,
      totalDeletedAmount: 1500,
      byTicker: {
        'AAPL': { count: 1, amount: 1000 },
        'GOOGL': { count: 1, amount: 500 }
      },
      byPortfolio: {
        'portfolio_1': { count: 2, amount: 1500 }
      }
    };

    res.json({
      success: true,
      ...summary
    });

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
