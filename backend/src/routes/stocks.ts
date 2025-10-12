import express from 'express';
import { googleFinanceFormulasService } from '../services/googleFinanceFormulasService';
import { decisionEngine } from '../services/decisionEngine';
import { loggerService } from '../services/loggerService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 🚨 CRITICAL TEST ENDPOINT: Test NVDA price fetching
router.get('/test-nvda', async (req, res) => {
  try {
    const { googleFinanceFormulasService } = await import('../services/googleFinanceFormulasService');
    
    console.log('🔍 [TEST] Fetching NVDA price...');
    const nvdaMetrics = await googleFinanceFormulasService.getStockMetrics('NVDA');
    
    res.json({
      success: true,
      symbol: 'NVDA',
      current: nvdaMetrics.current,
      timestamp: nvdaMetrics.timestamp,
      dataSource: nvdaMetrics.dataSource,
      message: `NVDA current price: $${nvdaMetrics.current}`
    });
  } catch (error: unknown) {
    console.error('❌ [TEST] Error fetching NVDA:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🚨 EMERGENCY: Clear stock cache
 * POST /api/stocks/clear-cache
 */
router.post('/clear-cache', async (req, res) => {
  try {
    const { googleFinanceFormulasService } = await import('../services/googleFinanceFormulasService');
    
    console.log('🚨 [EMERGENCY] Clearing all stock cache...');
    
    // Clear the cache
    googleFinanceFormulasService.clearCache();
    
    res.json({
      success: true,
      message: 'Stock cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [EMERGENCY] Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get current stock price
 * GET /api/stocks/price/:symbol
 */
router.get('/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const metrics = await googleFinanceFormulasService.getStockMetrics(symbol);
    
    if (metrics) {
      res.json({
        success: true,
        symbol: metrics.symbol,
        price: metrics.current,
        dataSource: metrics.dataSource,
        timestamp: new Date(metrics.timestamp).toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        message: `No price found for ${symbol}`
      });
    }
  } catch (error) {
    loggerService.error(`❌ [STOCKS] Error fetching price`, { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🧪 TEST ENDPOINT: Get stock metrics
 * GET /api/stocks/test-metrics/:symbol
 * 
 * Example: GET /api/stocks/test-metrics/QS
 * 
 * Returns the same metrics as your Google Sheet:
 * - Current price
 * - TOP 30D (highest price in last 30 days)
 * - TOP 60D (highest price in last 60 days)
 * - % This Month
 * - % Last Month
 */
router.get('/test-metrics/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    loggerService.info(`🧪 [TEST] Fetching metrics for ${symbol}`);
    
    const metrics = await googleFinanceFormulasService.getStockMetrics(symbol);
    
    if (metrics) {
      res.json({
        success: true,
        symbol: metrics.symbol,
        metrics: {
          current: metrics.current,
          top30D: metrics.top30D,
          top60D: metrics.top60D,
          thisMonthPercent: metrics.thisMonthPercent.toFixed(2) + '%',
          lastMonthPercent: metrics.lastMonthPercent.toFixed(2) + '%',
          volatility: (metrics.volatility * 100).toFixed(2) + '%',
          marketCap: `$${(metrics.marketCap / 1_000_000_000).toFixed(2)}B`
        },
        dataSource: metrics.dataSource,
        timestamp: new Date(metrics.timestamp).toISOString(),
        cacheAge: `${Math.floor((Date.now() - metrics.timestamp) / 1000)}s`
      });
    } else {
      res.status(404).json({
        success: false,
        message: `No metrics found for ${symbol} - API failed to fetch data`
      });
    }
    
  } catch (error) {
    loggerService.error(`❌ [TEST] Error fetching metrics`, { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🧪 TEST ENDPOINT: Test decision engine
 * POST /api/stocks/test-decision
 * 
 * Body: {
 *   "ticker": "QS",
 *   "entryPrice": 18.50,
 *   "currentPrice": 16.22,
 *   "stopLoss": 15.00,
 *   "takeProfit": 25.00
 * }
 * 
 * Returns BUY/SELL/HOLD decision with score and reasoning
 */
router.post('/test-decision', async (req, res) => {
  try {
    const { ticker, entryPrice, currentPrice, stopLoss, takeProfit } = req.body;
    
    if (!ticker || !entryPrice || !currentPrice) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: ticker, entryPrice, currentPrice'
      });
    }
    
    loggerService.info(`🧪 [TEST] Testing decision for ${ticker}`);
    
    const decision = await decisionEngine.decideActionEnhanced({
      ticker,
      entryPrice,
      currentPrice,
      stopLoss,
      takeProfit
    });
    
    res.json({
      success: true,
      ticker,
      decision: {
        action: decision.action,
        reason: decision.reason,
        color: decision.color,
        score: decision.score
      },
      input: {
        entryPrice,
        currentPrice,
        stopLoss,
        takeProfit,
        priceChange: ((currentPrice - entryPrice) / entryPrice * 100).toFixed(2) + '%'
      },
      error: decision.error
    });
    
  } catch (error) {
    loggerService.error(`❌ [TEST] Error testing decision`, { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🧪 TEST ENDPOINT: Test multiple stocks
 * POST /api/stocks/test-batch
 * 
 * Body: {
 *   "symbols": ["QS", "UEC", "HIMX", "ONCY", "AQST", "AEG", "HST"]
 * }
 * 
 * Returns metrics for all stocks
 */
router.post('/test-batch', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid symbols array'
      });
    }
    
    loggerService.info(`🧪 [TEST] Fetching metrics for ${symbols.length} stocks`);
    
    const metricsMap = await googleFinanceFormulasService.getMultipleStockMetrics(symbols);
    
    const results = Array.from(metricsMap.entries()).map(([symbol, metrics]) => ({
      symbol: metrics.symbol,
      current: metrics.current,
      top30D: metrics.top30D,
      top60D: metrics.top60D,
      thisMonthPercent: metrics.thisMonthPercent.toFixed(2) + '%',
      lastMonthPercent: metrics.lastMonthPercent.toFixed(2) + '%',
      dataSource: metrics.dataSource
    }));
    
    res.json({
      success: true,
      count: results.length,
      results,
      cacheStats: googleFinanceFormulasService.getCacheStats()
    });
    
  } catch (error) {
    loggerService.error(`❌ [TEST] Error testing batch`, { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 📊 GET Cache Statistics
 * GET /api/stocks/cache-stats
 */
router.get('/cache-stats', (req, res) => {
  const stats = googleFinanceFormulasService.getCacheStats();
  res.json({
    success: true,
    cache: {
      size: stats.size,
      max: stats.max,
      ttl: `${stats.ttl / 1000 / 60} minutes`,
      utilization: `${((stats.size / stats.max) * 100).toFixed(1)}%`
    }
  });
});

/**
 * 🧹 Clear Cache (for testing)
 * POST /api/stocks/clear-cache
 */
router.post('/clear-cache', (req, res) => {
  googleFinanceFormulasService.clearCache();
  res.json({
    success: true,
    message: 'Cache cleared successfully'
  });
});

/**
 * Get batch stock prices for real-time updates
 * POST /api/stocks/batch-prices
 * Body: { tickers: string[] }
 */
router.post('/batch-prices', authenticateToken, async (req, res) => {
  try {
    const { tickers } = req.body;
    
    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tickers array is required'
      });
    }

    if (tickers.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 20 tickers allowed per request'
      });
    }

    loggerService.info(`📊 [BATCH PRICES] Fetching prices for ${tickers.length} tickers`, { tickers });

    const pricePromises = tickers.map(async (ticker: string) => {
      try {
        const metrics = await googleFinanceFormulasService.getStockMetrics(ticker);
        
        if (metrics) {
          // Calculate change and changePercent from current and previous day data
          const change = 0; // Will be calculated if we have previous day data
          const changePercent = 0; // Will be calculated if we have previous day data
          
          return {
            ticker: ticker.toUpperCase(),
            currentPrice: metrics.current,
            change: change,
            changePercent: changePercent,
            dataSource: metrics.dataSource,
            timestamp: new Date(metrics.timestamp).toISOString()
          };
        } else {
          return {
            ticker: ticker.toUpperCase(),
            currentPrice: 0,
            change: 0,
            changePercent: 0,
            dataSource: 'none',
            timestamp: new Date().toISOString(),
            error: 'No data available'
          };
        }
      } catch (error) {
        loggerService.warn(`⚠️ [BATCH PRICES] Failed to fetch ${ticker}`, { error });
        return {
          ticker: ticker.toUpperCase(),
          currentPrice: 0,
          change: 0,
          changePercent: 0,
          dataSource: 'error',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const prices = await Promise.all(pricePromises);
    
    loggerService.info(`✅ [BATCH PRICES] Successfully fetched ${prices.length} prices`);

    res.json({
      success: true,
      prices,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    loggerService.error(`❌ [BATCH PRICES] Error fetching batch prices`, { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
