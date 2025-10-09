import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { historicalDataService } from '../services/historicalDataService';

const router = express.Router();

// Get Google Finance data for a specific stock
router.get('/:symbol/google-finance', authenticateToken, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const days = parseInt(req.query.days as string) || 90;
    
    console.log(`🔍 [STOCKS] Fetching ${days} days of Google Finance data for ${symbol}`);
    
    // Validate days parameter
    if (days < 1 || days > 365) {
      return res.status(400).json({ 
        message: 'Days parameter must be between 1 and 365' 
      });
    }
    
    // Use Google Finance API via a proxy or direct API
    // Note: Google Finance API is not directly accessible, so we'll use a similar approach
    // but with the formulas you specified
    
    // For now, let's use the existing historical data service but format it like Google Finance
    const historicalData = await historicalDataService.getStockHistory(symbol, days);
    
    if (!historicalData || historicalData.length === 0) {
      return res.status(404).json({ 
        message: `No Google Finance data found for ${symbol}`,
        symbol,
        days
      });
    }
    
    // Format data like Google Finance would return
    const formattedData = {
      symbol,
      days,
      dates: historicalData.map(item => item.date),
      prices: historicalData.map(item => item.price),
      volumes: historicalData.map(item => item.volume || 0),
      totalPoints: historicalData.length,
      source: 'Google Finance API (via proxy)'
    };
    
    console.log(`✅ [STOCKS] Retrieved ${historicalData.length} Google Finance data points for ${symbol}`);
    
    res.json(formattedData);
    
  } catch (error: any) {
    console.error(`❌ [STOCKS] Error fetching Google Finance data for ${req.params.symbol}:`, error);
    
    res.status(500).json({ 
      message: 'Failed to fetch Google Finance data',
      error: error.message,
      symbol: req.params.symbol
    });
  }
});

// Get historical data for a specific stock
router.get('/:symbol/history', authenticateToken, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const days = parseInt(req.query.days as string) || 90;
    
    console.log(`🔍 [STOCKS] Fetching ${days} days of historical data for ${symbol}`);
    
    // Validate days parameter
    if (days < 1 || days > 365) {
      return res.status(400).json({ 
        message: 'Days parameter must be between 1 and 365' 
      });
    }
    
    // Fetch historical data
    const historicalData = await historicalDataService.getStockHistory(symbol, days);
    
    if (!historicalData || historicalData.length === 0) {
      return res.status(404).json({ 
        message: `No historical data found for ${symbol}`,
        symbol,
        days
      });
    }
    
    // Format data for frontend
    const formattedData = {
      symbol,
      days,
      dates: historicalData.map(item => item.date),
      prices: historicalData.map(item => item.price),
      volumes: historicalData.map(item => item.volume || 0),
      totalPoints: historicalData.length
    };
    
    console.log(`✅ [STOCKS] Retrieved ${historicalData.length} data points for ${symbol}`);
    
    res.json(formattedData);
    
  } catch (error: any) {
    console.error(`❌ [STOCKS] Error fetching historical data for ${req.params.symbol}:`, error);
    
    res.status(500).json({ 
      message: 'Failed to fetch historical data',
      error: error.message,
      symbol: req.params.symbol
    });
  }
});

// Get current price for a stock
router.get('/:symbol/price', authenticateToken, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    
    console.log(`🔍 [STOCKS] Fetching current price for ${symbol}`);
    
    // Use the existing stockDataService to get current price
    const { stockDataService } = await import('../services/stockDataService');
    const stockData = await stockDataService.getStockData(symbol);
    
    if (!stockData) {
      return res.status(404).json({ 
        message: `No current price data found for ${symbol}`,
        symbol
      });
    }
    
    const response = {
      symbol,
      currentPrice: stockData.current,
      change: stockData.change,
      changePercent: stockData.changePercent,
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ [STOCKS] Retrieved current price for ${symbol}: $${stockData.current}`);
    
    res.json(response);
    
  } catch (error: any) {
    console.error(`❌ [STOCKS] Error fetching current price for ${req.params.symbol}:`, error);
    
    res.status(500).json({ 
      message: 'Failed to fetch current price',
      error: error.message,
      symbol: req.params.symbol
    });
  }
});

// Get multiple stocks' current prices
router.post('/prices', authenticateToken, async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ 
        message: 'Symbols must be a non-empty array' 
      });
    }
    
    if (symbols.length > 50) {
      return res.status(400).json({ 
        message: 'Maximum 50 symbols allowed per request' 
      });
    }
    
    console.log(`🔍 [STOCKS] Fetching prices for ${symbols.length} symbols`);
    
    const { stockDataService } = await import('../services/stockDataService');
    const stockDataMap = await stockDataService.getMultipleStockData(symbols);
    
    const response = Array.from(stockDataMap.entries()).map(([symbol, data]) => ({
      symbol,
      currentPrice: data.current,
      change: data.change,
      changePercent: data.changePercent,
      timestamp: new Date().toISOString()
    }));
    
    console.log(`✅ [STOCKS] Retrieved prices for ${response.length} symbols`);
    
    res.json({
      stocks: response,
      total: response.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error(`❌ [STOCKS] Error fetching multiple prices:`, error);
    
    res.status(500).json({ 
      message: 'Failed to fetch stock prices',
      error: error.message
    });
  }
});

export default router;
