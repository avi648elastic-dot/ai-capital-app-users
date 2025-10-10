import express from 'express';
import { googleFinanceFormulasService } from '../services/googleFinanceFormulasService';
import { decisionEngine } from '../services/decisionEngine';
import { loggerService } from '../services/loggerService';

const router = express.Router();

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

export default router;
