import express from 'express';
import Portfolio from '../models/Portfolio';
import { authenticateToken } from '../middleware/auth';
import { googleFinanceFormulasService } from '../services/googleFinanceFormulasService';
import { volatilityService } from '../services/volatilityService';
import { loggerService } from '../services/loggerService';

const router = express.Router();

// Get real performance analytics using Google Finance 90-day data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user!._id;
    const days = parseInt(req.query.days as string) || 30;
    
    loggerService.info(`🔍 [PERFORMANCE] Calculating performance for user ${userId}, ${days} days`);
    
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
    loggerService.info(`🔍 [PERFORMANCE] Analyzing ${tickers.length} stocks: ${tickers.join(', ')}`);
    
    // Fetch 90-day data for all stocks using our Google Finance service
    const stockMetricsMap = await googleFinanceFormulasService.getMultipleStockMetrics(tickers);
    
    // Calculate metrics for each stock using the 90-day data
    const stockMetrics: Record<string, any> = {};
    let totalPortfolioValue = 0;
    let totalPortfolioReturn = 0;
    let totalWeightedVolatility = 0;
    let portfolioMaxDrawdown = 0;

    for (const stock of portfolio) {
      const stockData = stockMetricsMap.get(stock.ticker);
      if (!stockData) {
        loggerService.warn(`⚠️ [PERFORMANCE] No 90-day data for ${stock.ticker}`);
        continue;
      }

      // Calculate performance for the requested timeframe from 90-day data
      const timeframeReturn = calculateTimeframeReturn(stockData, days);
      
      // Get detailed volatility metrics from our volatility service
      const volatilityMetrics = await volatilityService.calculateStockVolatility(stock.ticker);
      const volatility = volatilityMetrics ? volatilityMetrics.volatility : stockData.volatility * 100;
      
      // Calculate Sharpe ratio (assuming risk-free rate of 2%)
      const riskFreeRate = 2.0;
      const sharpeRatio = volatility > 0 ? (timeframeReturn - riskFreeRate) / volatility : 0;
      
      // Calculate max drawdown for the timeframe
      const maxDrawdown = calculateMaxDrawdown(stockData, days);

      const metrics = {
        totalReturn: timeframeReturn,
        volatility,
        volatilityMetrics, // Include detailed volatility data
        sharpeRatio,
        maxDrawdown,
        topPrice: stockData.top60D, // Use TOP60D from our service
        currentPrice: stockData.current
      };

      loggerService.info(`📊 [PERFORMANCE] ${stock.ticker} calculated from 90-day data:`, {
        timeframe: `${days}d`,
        return: timeframeReturn.toFixed(2) + '%',
        topPrice: '$' + stockData.top60D.toFixed(2),
        currentPrice: '$' + stockData.current.toFixed(2),
        volatility: volatility.toFixed(2) + '%',
        sharpe: sharpeRatio.toFixed(2),
        dataSource: stockData.dataSource
      });

      stockMetrics[stock.ticker] = metrics;

      // Calculate portfolio-weighted metrics
      const stockValue = stockData.current * stock.shares;
      const totalPortfolioValueCalc = portfolio.reduce((sum, s) => {
        const data = stockMetricsMap.get(s.ticker);
        return sum + (data?.current || 0) * s.shares;
      }, 0);
      
      const stockWeight = totalPortfolioValueCalc > 0 ? stockValue / totalPortfolioValueCalc : 0;
      
      totalPortfolioValue += stockValue;
      totalPortfolioReturn += timeframeReturn * stockWeight;
      totalWeightedVolatility += volatility * stockWeight;
      portfolioMaxDrawdown = Math.max(portfolioMaxDrawdown, maxDrawdown);
    }

    // Calculate portfolio Sharpe ratio
    const riskFreeRate = 2.0;
    const portfolioSharpe = totalWeightedVolatility > 0 ? 
      (totalPortfolioReturn - riskFreeRate) / totalWeightedVolatility : 0;

    // Calculate portfolio-level volatility metrics
    const portfolioVolatilityMetrics = await volatilityService.calculatePortfolioVolatility(tickers);

    const portfolioMetrics = {
      totalReturn: totalPortfolioReturn,
      volatility: totalWeightedVolatility,
      volatilityMetrics: portfolioVolatilityMetrics, // Include detailed portfolio volatility
      sharpeRatio: portfolioSharpe,
      maxDrawdown: portfolioMaxDrawdown,
      currentValue: totalPortfolioValue,
      totalStocks: portfolio.length,
      dataPoints: stockMetricsMap.size
    };

    loggerService.info(`✅ [PERFORMANCE] Portfolio metrics calculated from 90-day data:`, {
      totalReturn: totalPortfolioReturn.toFixed(2) + '%',
      volatility: totalWeightedVolatility.toFixed(2) + '%',
      sharpeRatio: portfolioSharpe.toFixed(2),
      maxDrawdown: portfolioMaxDrawdown.toFixed(2) + '%',
      currentValue: '$' + totalPortfolioValue.toFixed(2),
      stocksAnalyzed: stockMetricsMap.size
    });
    
    res.json({
      portfolioMetrics,
      stockMetrics,
      timeframe: `${days}d`,
      dataSource: 'Google Finance 90-Day Data',
      timestamp: new Date().toISOString(),
      dataPoints: Array.from(stockMetricsMap.keys()),
      cacheStats: googleFinanceFormulasService.getCacheStats()
    });

  } catch (error: any) {
    loggerService.error('❌ [PERFORMANCE] Error calculating performance metrics:', error);
    
    res.status(500).json({
      message: 'Failed to calculate performance metrics',
      error: error.message
    });
  }
});

// Helper function to calculate return for specific timeframe from 90-day data
function calculateTimeframeReturn(stockData: any, days: number): number {
  // Use the monthly percentages from our Google Finance service
  if (days <= 7) {
    // For 7 days, estimate from this month percentage
    return stockData.thisMonthPercent * (7 / 30); // Approximate 7-day from monthly
  } else if (days <= 30) {
    // Use this month percentage directly
    return stockData.thisMonthPercent;
  } else if (days <= 60) {
    // Combine this month and last month
    return (stockData.thisMonthPercent + stockData.lastMonthPercent) * 0.8; // Weighted average
  } else {
    // For 90 days, use both months plus some extrapolation
    return (stockData.thisMonthPercent + stockData.lastMonthPercent) * 1.2;
  }
}

// Helper function to calculate max drawdown for timeframe
function calculateMaxDrawdown(stockData: any, days: number): number {
  // Estimate max drawdown based on volatility and timeframe
  const baseVolatility = Math.abs(stockData.thisMonthPercent);
  const timeMultiplier = Math.sqrt(days / 30); // Square root of time scaling
  return baseVolatility * timeMultiplier * 1.5; // Conservative estimate
}

// Test endpoint to debug individual stock 90-day data
router.get('/test/:symbol', authenticateToken, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const days = parseInt(req.query.days as string) || 30;
    
    loggerService.info(`🔍 [PERFORMANCE TEST] Testing 90-day data for ${symbol}`);
    
    const stockData = await googleFinanceFormulasService.getStockMetrics(symbol);
    
    if (!stockData) {
      return res.status(404).json({
        message: `No 90-day data found for ${symbol}`,
        symbol,
        days
      });
    }
    
    // Calculate metrics for the test
    const timeframeReturn = calculateTimeframeReturn(stockData, days);
    const maxDrawdown = calculateMaxDrawdown(stockData, days);
    
    res.json({
      symbol,
      days,
      stockData,
      calculatedMetrics: {
        timeframeReturn,
        maxDrawdown,
        volatility: stockData.volatility * 100
      },
      timestamp: new Date().toISOString(),
      dataSource: stockData.dataSource,
      cacheStats: googleFinanceFormulasService.getCacheStats()
    });
    
  } catch (error: any) {
    loggerService.error(`❌ [PERFORMANCE TEST] Error testing ${req.params.symbol}:`, error);
    
    res.status(500).json({
      message: 'Test failed',
      error: error.message,
      symbol: req.params.symbol
    });
  }
});

// Get volatility metrics for portfolio or individual stocks
router.get('/volatility', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user!._id;
    const { portfolioId, tickers } = req.query;
    
    loggerService.info(`🔍 [VOLATILITY API] Calculating volatility for user ${userId}`);
    
    if (tickers) {
      // Calculate volatility for specific tickers
      const tickerArray = Array.isArray(tickers) ? tickers : [tickers];
      const volatilityMap = await volatilityService.calculateMultipleStockVolatilities(tickerArray as string[]);
      
      const result: Record<string, any> = {};
      volatilityMap.forEach((metrics, ticker) => {
        result[ticker] = metrics;
      });
      
      res.json({
        volatilities: result,
        timestamp: new Date().toISOString(),
        dataSource: 'Google Finance 90-Day Data'
      });
      
    } else if (portfolioId) {
      // Calculate volatility for specific portfolio
      const portfolio = await Portfolio.find({ userId, portfolioId }).sort({ createdAt: 1 });
      
      if (portfolio.length === 0) {
        return res.json({
          volatilityMetrics: null,
          message: 'No portfolio data available for this portfolio ID.'
        });
      }
      
      const tickers = [...new Set(portfolio.map(item => item.ticker))];
      const weights = portfolio.map(item => {
        const totalValue = portfolio.reduce((sum, p) => sum + (p.currentPrice * p.shares), 0);
        return totalValue > 0 ? (item.currentPrice * item.shares) / totalValue : 0;
      });
      
      const portfolioVolatility = await volatilityService.calculatePortfolioVolatility(tickers, weights);
      
      res.json({
        portfolioId,
        volatilityMetrics: portfolioVolatility,
        stockCount: portfolio.length,
        timestamp: new Date().toISOString(),
        dataSource: 'Google Finance 90-Day Data'
      });
      
    } else {
      // Calculate volatility for all user portfolios
      const portfolio = await Portfolio.find({ userId }).sort({ createdAt: 1 });
      
      if (portfolio.length === 0) {
        return res.json({
          portfolioVolatilities: {},
          message: 'No portfolio data available.'
        });
      }
      
      // Group by portfolio ID
      const portfolioGroups: Record<string, any[]> = {};
      portfolio.forEach(item => {
        if (!portfolioGroups[item.portfolioId]) {
          portfolioGroups[item.portfolioId] = [];
        }
        portfolioGroups[item.portfolioId].push(item);
      });
      
      const portfolioVolatilities: Record<string, any> = {};
      
      for (const [portfolioId, portfolioItems] of Object.entries(portfolioGroups)) {
        const tickers = [...new Set(portfolioItems.map(item => item.ticker))];
        const weights = portfolioItems.map(item => {
          const totalValue = portfolioItems.reduce((sum, p) => sum + (p.currentPrice * p.shares), 0);
          return totalValue > 0 ? (item.currentPrice * item.shares) / totalValue : 0;
        });
        
        const portfolioVolatility = await volatilityService.calculatePortfolioVolatility(tickers, weights);
        if (portfolioVolatility) {
          portfolioVolatilities[portfolioId] = portfolioVolatility;
        }
      }
      
      res.json({
        portfolioVolatilities,
        totalPortfolios: Object.keys(portfolioVolatilities).length,
        timestamp: new Date().toISOString(),
        dataSource: 'Google Finance 90-Day Data'
      });
    }

  } catch (error: any) {
    loggerService.error('❌ [VOLATILITY API] Error calculating volatility:', error);
    
    res.status(500).json({
      message: 'Failed to calculate volatility metrics',
      error: error.message
    });
  }
});

export default router;