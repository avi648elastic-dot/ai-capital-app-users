import express from 'express';
import Portfolio from '../models/Portfolio';
import { authenticateToken } from '../middleware/auth';
import { googleFinanceService } from '../services/googleFinanceService';

const router = express.Router();

// Get real performance analytics using Google Finance data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user!._id;
    const days = parseInt(req.query.days as string) || 30;
    
    console.log(`🔍 [PERFORMANCE] Fetching real performance data for user ${userId}, ${days} days`);
    
    // Get user's portfolio
    const portfolio = await Portfolio.find({ userId }).sort({ createdAt: 1 });
    
    if (portfolio.length === 0) {
      return res.json({
        portfolioMetrics: null,
        stockMetrics: {},
        message: 'No portfolio data available.'
      });
    }

    // Get unique tickers
    const tickers = [...new Set(portfolio.map(item => item.ticker))];
    console.log(`🔍 [PERFORMANCE] Fetching Google Finance data for tickers: ${tickers.join(', ')}`);
    
    // Fetch real Google Finance data
    console.log(`🔍 [PERFORMANCE] Fetching Google Finance data for ${tickers.length} tickers:`, tickers);
    const stockDataMap = await googleFinanceService.getMultipleStockData(tickers, 90);
    console.log(`📊 [PERFORMANCE] Retrieved data for ${stockDataMap.size} stocks:`, Array.from(stockDataMap.keys()));
    
    // Calculate metrics for each stock
    const stockMetrics: Record<string, any> = {};
    let totalPortfolioValue = 0;
    let totalPortfolioReturn = 0;
    let totalWeightedVolatility = 0;
    let portfolioMaxDrawdown = 0;

    for (const stock of portfolio) {
      const stockData = stockDataMap.get(stock.ticker);
      if (!stockData) {
        console.warn(`⚠️ [PERFORMANCE] No data available for ${stock.ticker}`);
        continue;
      }

      // Calculate performance metrics using Google Finance formulas
      console.log(`🔍 [PERFORMANCE] Calculating metrics for ${stock.ticker}, ${days} days`);
      console.log(`📊 [PERFORMANCE] ${stock.ticker} data points:`, stockData.historicalPrices.length);
      console.log(`📊 [PERFORMANCE] ${stock.ticker} price range: $${Math.min(...stockData.historicalPrices.map(p => p.price)).toFixed(2)} - $${Math.max(...stockData.historicalPrices.map(p => p.price)).toFixed(2)}`);
      
      const metrics = googleFinanceService.calculatePerformanceMetrics(stockData, days);
      console.log(`📊 [PERFORMANCE] ${stock.ticker} calculated metrics:`, metrics);
      stockMetrics[stock.ticker] = metrics;

      // Calculate portfolio-weighted metrics
      const stockValue = stock.currentPrice * stock.shares;
      const stockWeight = stockValue / portfolio.reduce((sum, s) => sum + (s.currentPrice * s.shares), 0);
      
      totalPortfolioValue += stockValue;
      totalPortfolioReturn += metrics.totalReturn * stockWeight;
      totalWeightedVolatility += metrics.volatility * stockWeight;
      portfolioMaxDrawdown = Math.max(portfolioMaxDrawdown, metrics.maxDrawdown);
    }

    // Calculate portfolio Sharpe ratio (assuming risk-free rate of 2%)
    const riskFreeRate = 2.0;
    const portfolioSharpe = totalWeightedVolatility > 0 ? 
      (totalPortfolioReturn - riskFreeRate) / totalWeightedVolatility : 0;

    const portfolioMetrics = {
      totalReturn: totalPortfolioReturn,
      volatility: totalWeightedVolatility,
      sharpeRatio: portfolioSharpe,
      maxDrawdown: portfolioMaxDrawdown,
      currentValue: totalPortfolioValue,
      totalStocks: portfolio.length,
      dataPoints: stockDataMap.size
    };

    console.log(`✅ [PERFORMANCE] Calculated metrics for ${Object.keys(stockMetrics).length} stocks`);
    
    res.json({
      portfolioMetrics,
      stockMetrics,
      timeframe: `${days}d`,
      dataSource: 'Google Finance API',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [PERFORMANCE] Error calculating performance metrics:', error);
    
    res.status(500).json({
      message: 'Failed to calculate performance metrics',
      error: error.message
    });
  }
});

// Test endpoint to debug data fetching
router.get('/test/:symbol', authenticateToken, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const days = parseInt(req.query.days as string) || 7;
    
    console.log(`🔍 [PERFORMANCE TEST] Testing ${symbol} for ${days} days`);
    
    const stockData = await googleFinanceService.getStockHistory(symbol, days);
    
    if (!stockData) {
      return res.status(404).json({
        message: `No data found for ${symbol}`,
        symbol,
        days
      });
    }
    
    const metrics = googleFinanceService.calculatePerformanceMetrics(stockData, days);
    
    res.json({
      symbol,
      days,
      stockData: {
        currentPrice: stockData.currentPrice,
        dataPoints: stockData.historicalPrices.length,
        firstPrice: stockData.historicalPrices[0]?.price,
        lastPrice: stockData.historicalPrices[stockData.historicalPrices.length - 1]?.price,
        priceRange: {
          min: Math.min(...stockData.historicalPrices.map(p => p.price)),
          max: Math.max(...stockData.historicalPrices.map(p => p.price))
        },
        sampleDates: stockData.historicalPrices.slice(0, 3).map(p => p.date)
      },
      metrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error(`❌ [PERFORMANCE TEST] Error testing ${req.params.symbol}:`, error);
    
    res.status(500).json({
      message: 'Test failed',
      error: error.message,
      symbol: req.params.symbol
    });
  }
});

export default router;
