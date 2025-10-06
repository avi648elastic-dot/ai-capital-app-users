import express from 'express';
import Portfolio from '../models/Portfolio';
import { authenticateToken, requireSubscription } from '../middleware/auth';
import { decisionEngine } from '../services/decisionEngine';
import { stockDataService } from '../services/stockDataService';

const router = express.Router();

// Get user portfolio with real-time prices
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 [PORTFOLIO] Fetching portfolio for user:', req.user!._id);
    
    const portfolio = await Portfolio.find({ userId: req.user!._id }).sort({ createdAt: -1 });
    
    if (portfolio.length === 0) {
      return res.json({ portfolio: [], totals: { initial: 0, current: 0, totalPnL: 0, totalPnLPercent: 0 } });
    }

    // Get unique tickers
    const tickers = [...new Set(portfolio.map(item => item.ticker))];
    console.log('🔍 [PORTFOLIO] Updating prices for tickers:', tickers);

    // Fetch real-time data for all tickers
    console.log('🔍 [PORTFOLIO] Fetching real-time data for tickers:', tickers);
    const realTimeData = await stockDataService.getMultipleStockData(tickers);
    console.log('✅ [PORTFOLIO] Fetched real-time data for', realTimeData.size, 'stocks');
    
    // Log the actual data we got
    realTimeData.forEach((data, symbol) => {
      console.log(`📊 [PORTFOLIO] ${symbol}: $${data.current} (vs stored: $${portfolio.find(p => p.ticker === symbol)?.currentPrice})`);
    });

    // Update portfolio with real-time prices
    const updatedPortfolio = portfolio.map(item => {
      const realTimeStock = realTimeData.get(item.ticker);
      const currentPrice = realTimeStock?.current || item.currentPrice; // Fallback to stored price
      
      console.log(`🔍 [PORTFOLIO] ${item.ticker}: Entry=${item.entryPrice}, Current=${currentPrice}, RealTime=${realTimeStock?.current || 'N/A'}`);
      
      return {
        ...item.toObject(),
        currentPrice: currentPrice,
        // Update action and reason based on real-time data
        action: item.action || 'HOLD',
        reason: item.reason || 'Real-time data updated',
        color: item.color || 'yellow'
      };
    });

    // Calculate totals with real-time prices
    const totals = updatedPortfolio.reduce((acc, item) => {
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

    console.log('✅ [PORTFOLIO] Portfolio updated with real-time prices');
    res.json({ portfolio: updatedPortfolio, totals });
  } catch (error) {
    console.error('❌ [PORTFOLIO] Get portfolio error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add stock to portfolio
router.post('/add', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const { ticker, shares, entryPrice, currentPrice, stopLoss, takeProfit, notes, portfolioType } = req.body;

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
      portfolioType: portfolioType || 'solid', // Use provided portfolio type or default to solid
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

// Update all portfolio decisions with real-time data
router.get('/decisions', authenticateToken, requireSubscription, async (req, res) => {
  try {
    console.log('🔍 [DECISIONS] Updating portfolio decisions for user:', req.user!._id);
    
    const portfolio = await Portfolio.find({ userId: req.user!._id });
    
    if (portfolio.length === 0) {
      return res.json({ message: 'No portfolio items found', portfolio: [] });
    }

    // Get unique tickers and fetch real-time data
    const tickers = [...new Set(portfolio.map(item => item.ticker))];
    console.log('🔍 [DECISIONS] Fetching real-time data for:', tickers);
    
    const realTimeData = await stockDataService.getMultipleStockData(tickers);
    console.log('✅ [DECISIONS] Fetched real-time data for', realTimeData.size, 'stocks');
    
    const updatedPortfolio = await Promise.all(
      portfolio.map(async (item) => {
        // Get real-time price
        const realTimeStock = realTimeData.get(item.ticker);
        const currentPrice = realTimeStock?.current || item.currentPrice;
        
        // Update current price in database
        item.currentPrice = currentPrice;
        
        // Get decision based on real-time data
        const decision = decisionEngine.decideActionEnhanced({
          ticker: item.ticker,
          entryPrice: item.entryPrice,
          currentPrice: currentPrice,
          stopLoss: item.stopLoss,
          takeProfit: item.takeProfit,
        });

        item.action = decision.action;
        item.reason = decision.reason;
        item.color = decision.color;
        
        return item.save();
      })
    );

    console.log('✅ [DECISIONS] Portfolio decisions updated with real-time data');
    res.json({ message: 'Portfolio decisions updated with real-time data', portfolio: updatedPortfolio });
  } catch (error) {
    console.error('❌ [DECISIONS] Update decisions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
