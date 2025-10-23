import express from 'express';
import Watchlist, { IWatchlistItem, IPriceAlert } from '../models/Watchlist';
import User from '../models/User';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { 
  addWatchlistStockSchema, 
  updateNotificationsSchema, 
  priceAlertSchema,
  toggleAlertSchema,
  watchlistQuerySchema
} from '../schemas/watchlist';
import { loggerService } from '../services/loggerService';
import { googleFinanceFormulasService } from '../services/googleFinanceFormulasService';

const router = express.Router();

// Test endpoint to debug stock price fetching
router.get('/test-price/:ticker', authenticateToken, async (req, res) => {
  try {
    const { ticker } = req.params;
    loggerService.info(`🧪 [TEST] Testing price fetch for ${ticker}`);
    
    const metrics = await googleFinanceFormulasService.getStockMetrics(ticker);
    
    res.json({
      ticker,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    loggerService.error(`❌ [TEST] Error testing price fetch for ${req.params.ticker}`, { error });
    res.status(500).json({ error: 'Failed to test price fetch' });
  }
});

// Get user's watchlist
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    
    loggerService.info(`📊 [WATCHLIST] Fetching watchlist for user ${userId}`);
    
    const watchlist = await Watchlist.find({ userId }).sort({ addedAt: -1 });
    
    // Fetch current prices for all items
    const watchlistWithPrices = await Promise.all(
      watchlist.map(async (item) => {
        try {
          // Fetch current price from Google Finance service
          loggerService.info(`🔍 [WATCHLIST] Fetching price for ${item.ticker}`);
          const metrics = await googleFinanceFormulasService.getStockMetrics(item.ticker);
          
          loggerService.info(`📊 [WATCHLIST] ${item.ticker} metrics:`, {
            current: metrics?.current,
            dataSource: metrics?.dataSource,
            symbol: metrics?.symbol
          });
          
          // Handle fallback data better - if current is 0 but we have fallback data, use a reasonable price
          let currentPrice = metrics?.current || item.lastPrice || 0;
          
          // If current price is 0 and we have metrics with fallback data, use a reasonable estimate
          if (currentPrice === 0 && metrics && metrics.dataSource === 'fallback') {
            // Use a reasonable estimate based on common stock prices
            currentPrice = 10.0; // Default to $10 for unknown stocks
            loggerService.warn(`⚠️ [WATCHLIST] Using fallback price $10 for ${item.ticker} (no real price data available)`);
          }
          const change = item.lastPrice ? currentPrice - item.lastPrice : 0;
          const changePercent = item.lastPrice ? ((currentPrice - item.lastPrice) / item.lastPrice) * 100 : 0;
          
          // Update the stored lastPrice and lastChecked in the database
          if (metrics?.current && metrics.current !== item.lastPrice) {
            item.lastPrice = metrics.current;
            item.lastChecked = new Date();
            await item.save();
          }
          
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
router.post('/add', authenticateToken, validate({ body: addWatchlistStockSchema }), async (req, res) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { ticker, name, notifications } = req.body;
    
    loggerService.info(`📊 [WATCHLIST] Add stock request`, { userId, ticker, name });
    
    // Check if already exists
    const existing = await Watchlist.findOne({ userId, ticker: ticker.toUpperCase() });
    if (existing) {
      return res.status(400).json({ error: 'Stock already in watchlist' });
    }
    
    // Check subscription limits
    const userData = await User.findById(userId);
    const watchlistCount = await Watchlist.countDocuments({ userId });
    const maxStocks = userData?.subscriptionTier === 'premium' || userData?.subscriptionTier === 'premium+' ? 20 : 5;
    
    if (watchlistCount >= maxStocks) {
      return res.status(403).json({ 
        error: `You've reached your limit of ${maxStocks} stocks. ${userData?.subscriptionTier === 'free' ? 'Upgrade to Premium+ for up to 20 stocks.' : ''}` 
      });
    }
    
    // Fetch current price
    let currentPrice = 0;
    try {
      const metrics = await googleFinanceFormulasService.getStockMetrics(ticker);
      currentPrice = metrics?.current || 0;
    } catch (error) {
      loggerService.warn(`⚠️ [WATCHLIST] Could not fetch price for ${ticker}`, { error });
    }
    
    // Create watchlist item
    const watchlistItem = new Watchlist({
      userId,
      ticker: ticker.toUpperCase(),
      name: name || ticker.toUpperCase(),
      notifications: notifications !== undefined ? notifications : true,
      priceAlert: null, // Price alerts are set separately via PATCH /alert
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
    const userId = (req as any).user._id || (req as any).user.id;
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
router.patch('/:id/notifications', authenticateToken, validate({ body: updateNotificationsSchema }), async (req, res) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { id } = req.params;
    const { enabled } = req.body;
    const notifications = enabled;
    
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

// Set price alert for a stock - COMPLETE FIX FOR MAJOR
router.patch('/:id/alert', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { id } = req.params;
    
    loggerService.info(`🔔 [WATCHLIST ALERT] ============================================`);
    loggerService.info(`🔔 [WATCHLIST ALERT] Incoming request from user: ${userId}`);
    loggerService.info(`🔔 [WATCHLIST ALERT] Item ID: ${id}`);
    loggerService.info(`🔔 [WATCHLIST ALERT] Request body:`, req.body);
    loggerService.info(`🔔 [WATCHLIST ALERT] ============================================`);
    
    // Manual validation (bypass Zod to avoid issues)
    const { type, highPrice, lowPrice, enabled } = req.body;
    
    if (!type || !['high', 'low', 'both'].includes(type)) {
      loggerService.error(`❌ [WATCHLIST ALERT] Invalid type: ${type}`);
      return res.status(400).json({ 
        error: 'Invalid alert type',
        details: 'Type must be one of: high, low, both'
      });
    }
    
    if (type === 'high' && (!highPrice || highPrice <= 0)) {
      loggerService.error(`❌ [WATCHLIST ALERT] High price required but not provided`);
      return res.status(400).json({ 
        error: 'High price required',
        details: 'High price must be greater than 0'
      });
    }
    
    if (type === 'low' && (!lowPrice || lowPrice <= 0)) {
      loggerService.error(`❌ [WATCHLIST ALERT] Low price required but not provided`);
      return res.status(400).json({ 
        error: 'Low price required',
        details: 'Low price must be greater than 0'
      });
    }
    
    // Build price alert object
    const priceAlert: IPriceAlert = {
      type: type as 'high' | 'low' | 'both',
      highPrice: highPrice ? Number(highPrice) : undefined,
      lowPrice: lowPrice ? Number(lowPrice) : undefined,
      enabled: enabled !== undefined ? Boolean(enabled) : true,
      triggeredCount: 0
    };
    
    loggerService.info(`📊 [WATCHLIST ALERT] Price alert object:`, priceAlert);
    loggerService.info(`🔍 [WATCHLIST ALERT] Searching for watchlist item...`);
    
    // Find the item first to verify it exists
    const existingItem = await Watchlist.findOne({ _id: id, userId });
    
    if (!existingItem) {
      loggerService.error(`❌ [WATCHLIST ALERT] Item NOT FOUND - ID: ${id}, UserID: ${userId}`);
      
      // Check if item exists at all (maybe wrong user?)
      const anyItem = await Watchlist.findById(id);
      if (anyItem) {
        loggerService.error(`❌ [WATCHLIST ALERT] Item exists but belongs to different user! ItemUserID: ${anyItem.userId}, RequestUserID: ${userId}`);
        return res.status(403).json({ error: 'Not authorized to modify this watchlist item' });
      }
      
      return res.status(404).json({ error: 'Watchlist item not found' });
    }
    
    loggerService.info(`✅ [WATCHLIST ALERT] Found item: ${existingItem.ticker} for user ${userId}`);
    loggerService.info(`📊 [WATCHLIST ALERT] Current priceAlert:`, existingItem.priceAlert);
    
    // Update the item
    existingItem.priceAlert = priceAlert;
    await existingItem.save();
    
    loggerService.info(`✅ [WATCHLIST ALERT] Successfully saved! New priceAlert:`, existingItem.priceAlert);
    loggerService.info(`🔔 [WATCHLIST ALERT] ============================================`);
    
    res.json({ 
      success: true,
      message: 'Price alert set successfully',
      priceAlert: existingItem.priceAlert,
      ticker: existingItem.ticker
    });
    
  } catch (error) {
    loggerService.error('❌ [WATCHLIST ALERT] CRITICAL ERROR:', { 
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userId: (req as any).user?._id || (req as any).user?.id,
      itemId: req.params.id,
      body: req.body
    });
    
    res.status(500).json({ 
      error: 'Failed to set price alert',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Remove price alert for a stock
router.delete('/:id/alert', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
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
    const userId = (req as any).user._id || (req as any).user.id;
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

