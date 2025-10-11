import express from 'express';
import Watchlist, { IWatchlistItem, IPriceAlert } from '../models/Watchlist';
import { authenticateToken } from '../middleware/auth';
import { loggerService } from '../services/loggerService';
import axios from 'axios';

const router = express.Router();

// Get user's watchlist
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    
    const watchlist = await Watchlist.find({ userId }).sort({ addedAt: -1 });
    
    // Fetch current prices for all items
    const watchlistWithPrices = await Promise.all(
      watchlist.map(async (item) => {
        try {
          // Fetch current price from your stock data service
          const priceResponse = await axios.get(
            `${process.env.API_URL || 'http://localhost:5000'}/api/stocks/price/${item.ticker}`,
            {
              headers: { Authorization: req.headers.authorization }
            }
          );
          
          const currentPrice = priceResponse.data.price || item.lastPrice || 0;
          const change = item.lastPrice ? currentPrice - item.lastPrice : 0;
          const changePercent = item.lastPrice ? ((currentPrice - item.lastPrice) / item.lastPrice) * 100 : 0;
          
          return {
            id: item._id,
            ticker: item.ticker,
            name: item.name || item.ticker,
            currentPrice,
            change,
            changePercent,
            notifications: item.notifications,
            priceAlert: item.priceAlert,
            addedAt: item.addedAt,
            lastChecked: item.lastChecked,
            metadata: item.metadata
          };
        } catch (error) {
          loggerService.error(`❌ [WATCHLIST] Error fetching price for ${item.ticker}`, { error });
          return {
            id: item._id,
            ticker: item.ticker,
            name: item.name || item.ticker,
            currentPrice: item.lastPrice || 0,
            change: 0,
            changePercent: 0,
            notifications: item.notifications,
            priceAlert: item.priceAlert,
            addedAt: item.addedAt,
            lastChecked: item.lastChecked,
            metadata: item.metadata
          };
        }
      })
    );
    
    res.json({ watchlist: watchlistWithPrices });
  } catch (error) {
    loggerService.error('❌ [WATCHLIST] Error fetching watchlist', { error });
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// Add stock to watchlist
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { ticker, name, priceAlert } = req.body;
    
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker is required' });
    }
    
    // Check if already exists
    const existing = await Watchlist.findOne({ userId, ticker: ticker.toUpperCase() });
    if (existing) {
      return res.status(400).json({ error: 'Stock already in watchlist' });
    }
    
    // Check subscription limits
    const user = (req as any).user;
    const watchlistCount = await Watchlist.countDocuments({ userId });
    const maxStocks = user.subscriptionTier === 'premium' || user.subscriptionTier === 'premium+' ? 20 : 5;
    
    if (watchlistCount >= maxStocks) {
      return res.status(403).json({ 
        error: `You've reached your limit of ${maxStocks} stocks. ${user.subscriptionTier === 'free' ? 'Upgrade to Premium+ for up to 20 stocks.' : ''}` 
      });
    }
    
    // Fetch current price
    let currentPrice = 0;
    try {
      const priceResponse = await axios.get(
        `${process.env.API_URL || 'http://localhost:5000'}/api/stocks/price/${ticker}`,
        {
          headers: { Authorization: req.headers.authorization }
        }
      );
      currentPrice = priceResponse.data.price || 0;
    } catch (error) {
      loggerService.warn(`⚠️ [WATCHLIST] Could not fetch price for ${ticker}`, { error });
    }
    
    // Create watchlist item
    const watchlistItem = new Watchlist({
      userId,
      ticker: ticker.toUpperCase(),
      name: name || ticker.toUpperCase(),
      notifications: true,
      priceAlert: priceAlert || null,
      lastPrice: currentPrice,
      lastChecked: new Date()
    });
    
    await watchlistItem.save();
    
    loggerService.info(`✅ [WATCHLIST] Added ${ticker} to watchlist for user ${userId}`);
    
    res.json({ 
      message: 'Stock added to watchlist',
      item: {
        id: watchlistItem._id,
        ticker: watchlistItem.ticker,
        name: watchlistItem.name,
        currentPrice,
        notifications: watchlistItem.notifications,
        priceAlert: watchlistItem.priceAlert,
        addedAt: watchlistItem.addedAt
      }
    });
  } catch (error) {
    loggerService.error('❌ [WATCHLIST] Error adding to watchlist', { error });
    res.status(500).json({ error: 'Failed to add stock to watchlist' });
  }
});

// Remove stock from watchlist
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    
    const watchlistItem = await Watchlist.findOneAndDelete({ 
      _id: id, 
      userId 
    });
    
    if (!watchlistItem) {
      return res.status(404).json({ error: 'Watchlist item not found' });
    }
    
    loggerService.info(`✅ [WATCHLIST] Removed ${watchlistItem.ticker} from watchlist for user ${userId}`);
    
    res.json({ message: 'Stock removed from watchlist' });
  } catch (error) {
    loggerService.error('❌ [WATCHLIST] Error removing from watchlist', { error });
    res.status(500).json({ error: 'Failed to remove stock from watchlist' });
  }
});

// Toggle notifications for a stock
router.patch('/:id/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { notifications } = req.body;
    
    const watchlistItem = await Watchlist.findOneAndUpdate(
      { _id: id, userId },
      { notifications },
      { new: true }
    );
    
    if (!watchlistItem) {
      return res.status(404).json({ error: 'Watchlist item not found' });
    }
    
    loggerService.info(`✅ [WATCHLIST] Updated notifications for ${watchlistItem.ticker}`);
    
    res.json({ 
      message: 'Notifications updated',
      notifications: watchlistItem.notifications
    });
  } catch (error) {
    loggerService.error('❌ [WATCHLIST] Error updating notifications', { error });
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Set price alert for a stock
router.patch('/:id/alert', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { type, highPrice, lowPrice, enabled } = req.body;
    
    // Validate price alert
    if (!type || !['high', 'low', 'both'].includes(type)) {
      return res.status(400).json({ error: 'Invalid alert type. Must be "high", "low", or "both"' });
    }
    
    if ((type === 'high' || type === 'both') && (!highPrice || highPrice <= 0)) {
      return res.status(400).json({ error: 'High price must be greater than 0' });
    }
    
    if ((type === 'low' || type === 'both') && (!lowPrice || lowPrice <= 0)) {
      return res.status(400).json({ error: 'Low price must be greater than 0' });
    }
    
    if (type === 'both' && highPrice && lowPrice && lowPrice >= highPrice) {
      return res.status(400).json({ error: 'Low price must be less than high price' });
    }
    
    const priceAlert: IPriceAlert = {
      type,
      highPrice: type === 'high' || type === 'both' ? highPrice : undefined,
      lowPrice: type === 'low' || type === 'both' ? lowPrice : undefined,
      enabled: enabled !== undefined ? enabled : true,
      triggeredCount: 0
    };
    
    const watchlistItem = await Watchlist.findOneAndUpdate(
      { _id: id, userId },
      { priceAlert },
      { new: true }
    );
    
    if (!watchlistItem) {
      return res.status(404).json({ error: 'Watchlist item not found' });
    }
    
    loggerService.info(`✅ [WATCHLIST] Set price alert for ${watchlistItem.ticker}`, { 
      type, 
      highPrice, 
      lowPrice 
    });
    
    res.json({ 
      message: 'Price alert set',
      priceAlert: watchlistItem.priceAlert
    });
  } catch (error) {
    loggerService.error('❌ [WATCHLIST] Error setting price alert', { error });
    res.status(500).json({ error: 'Failed to set price alert' });
  }
});

// Remove price alert for a stock
router.delete('/:id/alert', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    
    const watchlistItem = await Watchlist.findOneAndUpdate(
      { _id: id, userId },
      { priceAlert: null },
      { new: true }
    );
    
    if (!watchlistItem) {
      return res.status(404).json({ error: 'Watchlist item not found' });
    }
    
    loggerService.info(`✅ [WATCHLIST] Removed price alert for ${watchlistItem.ticker}`);
    
    res.json({ message: 'Price alert removed' });
  } catch (error) {
    loggerService.error('❌ [WATCHLIST] Error removing price alert', { error });
    res.status(500).json({ error: 'Failed to remove price alert' });
  }
});

// Toggle price alert enabled/disabled
router.patch('/:id/alert/toggle', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    
    const watchlistItem = await Watchlist.findOne({ _id: id, userId });
    
    if (!watchlistItem) {
      return res.status(404).json({ error: 'Watchlist item not found' });
    }
    
    if (!watchlistItem.priceAlert) {
      return res.status(400).json({ error: 'No price alert set for this stock' });
    }
    
    watchlistItem.priceAlert.enabled = !watchlistItem.priceAlert.enabled;
    await watchlistItem.save();
    
    loggerService.info(`✅ [WATCHLIST] Toggled price alert for ${watchlistItem.ticker} to ${watchlistItem.priceAlert.enabled}`);
    
    res.json({ 
      message: `Price alert ${watchlistItem.priceAlert.enabled ? 'enabled' : 'disabled'}`,
      enabled: watchlistItem.priceAlert.enabled
    });
  } catch (error) {
    loggerService.error('❌ [WATCHLIST] Error toggling price alert', { error });
    res.status(500).json({ error: 'Failed to toggle price alert' });
  }
});

export default router;

