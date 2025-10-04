import express from 'express';
import Portfolio from '../models/Portfolio';
import { authenticateToken, requireSubscription } from '../middleware/auth';
import { decisionEngine } from '../services/decisionEngine';

const router = express.Router();

// Get user portfolio
router.get('/', authenticateToken, async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ userId: req.user!._id }).sort({ createdAt: -1 });
    
    // Calculate totals
    const totals = portfolio.reduce((acc, item) => {
      const cost = item.entryPrice * item.shares;
      const value = item.currentPrice * item.shares;
      const pnl = value - cost;
      const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

      return {
        initial: acc.initial + cost,
        current: acc.current + value,
        totalPnL: acc.totalPnL + pnl,
        totalPnLPercent: acc.initial > 0 ? (acc.totalPnL / acc.initial) * 100 : 0,
      };
    }, { initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 });

    res.json({ portfolio, totals });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add stock to portfolio
router.post('/add', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const { ticker, shares, entryPrice, currentPrice, stopLoss, takeProfit, notes } = req.body;

    if (!ticker || !shares || !entryPrice || !currentPrice) {
      return res.status(400).json({ message: 'Ticker, shares, entry price, and current price are required' });
    }

    const portfolioItem = new Portfolio({
      userId: req.user!._id,
      ticker: ticker.toUpperCase(),
      shares: Number(shares),
      entryPrice: Number(entryPrice),
      currentPrice: Number(currentPrice),
      stopLoss: stopLoss ? Number(stopLoss) : undefined,
      takeProfit: takeProfit ? Number(takeProfit) : undefined,
      notes,
    });

    // Get decision for this stock
    const decision = decisionEngine.decideActionEnhanced({
      ticker: portfolioItem.ticker,
      entryPrice: portfolioItem.entryPrice,
      currentPrice: portfolioItem.currentPrice,
      stopLoss: portfolioItem.stopLoss,
      takeProfit: portfolioItem.takeProfit,
    });

    portfolioItem.action = decision.action;
    portfolioItem.reason = decision.reason;
    portfolioItem.color = decision.color;

    await portfolioItem.save();

    res.status(201).json({ message: 'Stock added successfully', portfolioItem });
  } catch (error) {
    console.error('Add stock error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update stock in portfolio
router.put('/:id', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const portfolioItem = await Portfolio.findOne({ _id: id, userId: req.user!._id });
    if (!portfolioItem) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        (portfolioItem as any)[key] = updates[key];
      }
    });

    // Recalculate decision
    const decision = decisionEngine.decideActionEnhanced({
      ticker: portfolioItem.ticker,
      entryPrice: portfolioItem.entryPrice,
      currentPrice: portfolioItem.currentPrice,
      stopLoss: portfolioItem.stopLoss,
      takeProfit: portfolioItem.takeProfit,
    });

    portfolioItem.action = decision.action;
    portfolioItem.reason = decision.reason;
    portfolioItem.color = decision.color;

    await portfolioItem.save();

    res.json({ message: 'Portfolio item updated successfully', portfolioItem });
  } catch (error) {
    console.error('Update portfolio error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete stock from portfolio
router.delete('/:id', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const { id } = req.params;

    const portfolioItem = await Portfolio.findOneAndDelete({ _id: id, userId: req.user!._id });
    if (!portfolioItem) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    res.json({ message: 'Portfolio item deleted successfully' });
  } catch (error) {
    console.error('Delete portfolio error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update all portfolio decisions
router.get('/decisions', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ userId: req.user!._id });
    
    const updatedPortfolio = await Promise.all(
      portfolio.map(async (item) => {
        const decision = decisionEngine.decideActionEnhanced({
          ticker: item.ticker,
          entryPrice: item.entryPrice,
          currentPrice: item.currentPrice,
          stopLoss: item.stopLoss,
          takeProfit: item.takeProfit,
        });

        item.action = decision.action;
        item.reason = decision.reason;
        item.color = decision.color;
        
        return item.save();
      })
    );

    res.json({ message: 'Portfolio decisions updated', portfolio: updatedPortfolio });
  } catch (error) {
    console.error('Update decisions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
