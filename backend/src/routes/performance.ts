import express from 'express';
import Portfolio from '../models/Portfolio';
import { authenticateToken } from '../middleware/auth';
import { googleFinanceSheetService } from '../services/googleFinanceSheetService';

const router = express.Router();

// Get real performance analytics using Google Finance formulas
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user!._id;
    const days = parseInt(req.query.days as string) || 30;
    
    console.log(`🔍 [PERFORMANCE] Creating Google Finance sheets for user ${userId}, ${days} days`);
    
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
    console.log(`🔍 [PERFORMANCE] Creating Google Finance sheets for tickers: ${tickers.join(', ')}`);
    
    // Create Google Finance sheets for each ticker using your formulas
    const stockSheets = await googleFinanceSheetService.createMultipleStockSheets(tickers);
    
    // Calculate metrics for each stock using the sheet data
    const stockMetrics: Record<string, any> = {};
    let totalPortfolioValue = 0;
    let totalPortfolioReturn = 0;
    let totalWeightedVolatility = 0;
    let portfolioMaxDrawdown = 0;

    for (const stock of portfolio) {
      const stockSheet = stockSheets.get(stock.ticker);
      if (!stockSheet) {
        console.warn(`⚠️ [PERFORMANCE] No sheet data available for ${stock.ticker}`);
        continue;
      }

      // Get the return for the requested timeframe
      let returnForPeriod = 0;
      let topPriceForPeriod = 0;
      
      switch (days) {
        case 7:
          returnForPeriod = stockSheet.returns.return7D;
          topPriceForPeriod = stockSheet.topPrices.top30D; // Use 30D top for 7D period
          break;
        case 30:
          returnForPeriod = stockSheet.returns.return30D;
          topPriceForPeriod = stockSheet.topPrices.top30D;
          break;
        case 60:
          returnForPeriod = stockSheet.returns.return60D;
          topPriceForPeriod = stockSheet.topPrices.top60D;
          break;
        case 90:
          returnForPeriod = stockSheet.returns.return90D;
          topPriceForPeriod = stockSheet.topPrices.top90D;
          break;
        default:
          returnForPeriod = stockSheet.returns.return30D;
          topPriceForPeriod = stockSheet.topPrices.top30D;
      }

      // Calculate volatility using historical data
      const historicalData = stockSheet.historicalData90D;
      const relevantData = historicalData.slice(0, days);
      
      // Calculate daily returns for volatility
      const dailyReturns = [];
      for (let i = 1; i < relevantData.length; i++) {
        const dailyReturn = (relevantData[i - 1] - relevantData[i]) / relevantData[i];
        dailyReturns.push(dailyReturn * 100);
      }
      
      const avgReturn = dailyReturns.length > 0 ? 
        dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length : 0;
      const variance = dailyReturns.length > 0 ?
        dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / dailyReturns.length : 0;
      const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
      
      // Calculate Sharpe ratio (assuming risk-free rate of 2%)
      const riskFreeRate = 2.0;
      const sharpeRatio = volatility > 0 ? (avgReturn - riskFreeRate) / volatility : 0;
      
      // Calculate max drawdown
      let maxDrawdown = 0;
      let peak = relevantData[0];
      for (const price of relevantData) {
        if (price > peak) peak = price;
        const drawdown = ((peak - price) / peak) * 100;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }

      const metrics = {
        totalReturn: returnForPeriod,
        volatility,
        sharpeRatio,
        maxDrawdown,
        topPrice: topPriceForPeriod,
        currentPrice: stockSheet.currentPrice
      };

      console.log(`📊 [PERFORMANCE] ${stock.ticker} calculated using Google Finance formulas:`, {
        timeframe: `${days}d`,
        return: returnForPeriod.toFixed(2) + '%',
        topPrice: '$' + topPriceForPeriod.toFixed(2),
        currentPrice: '$' + stockSheet.currentPrice.toFixed(2),
        volatility: volatility.toFixed(2) + '%',
        sharpe: sharpeRatio.toFixed(2)
      });

      stockMetrics[stock.ticker] = metrics;

      // Calculate portfolio-weighted metrics
      const stockValue = stockSheet.currentPrice * stock.shares;
      const stockWeight = stockValue / portfolio.reduce((sum, s) => sum + (stockSheets.get(s.ticker)?.currentPrice || 0) * s.shares, 0);
      
      totalPortfolioValue += stockValue;
      totalPortfolioReturn += returnForPeriod * stockWeight;
      totalWeightedVolatility += volatility * stockWeight;
      portfolioMaxDrawdown = Math.max(portfolioMaxDrawdown, maxDrawdown);
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
      dataPoints: stockSheets.size
    };

    console.log(`✅ [PERFORMANCE] Portfolio metrics calculated using Google Finance formulas:`, {
      totalReturn: totalPortfolioReturn.toFixed(2) + '%',
      volatility: totalWeightedVolatility.toFixed(2) + '%',
      sharpeRatio: portfolioSharpe.toFixed(2),
      maxDrawdown: portfolioMaxDrawdown.toFixed(2) + '%',
      currentValue: '$' + totalPortfolioValue.toFixed(2)
    });
    
    res.json({
      portfolioMetrics,
      stockMetrics,
      timeframe: `${days}d`,
      dataSource: 'Google Finance Formulas (Alpha Vantage)',
      timestamp: new Date().toISOString(),
      formulasUsed: [
        '=GOOGLEFINANCE(A2, "price")',
        '=TRANSPOSE(QUERY(GOOGLEFINANCE(A2,"price",TODAY()-90,TODAY(),"DAILY"),"select Col2 offset 1",0))',
        '=(INDEX(G2:BJ2,30) - INDEX(G2:BJ2,1)) / INDEX(G2:BJ2,1)',
        '=MAX(G2:BG2)'
      ]
    });

  } catch (error: any) {
    console.error('❌ [PERFORMANCE] Error calculating performance metrics:', error);
    
    res.status(500).json({
      message: 'Failed to calculate performance metrics',
      error: error.message
    });
  }
});

// Test endpoint to debug individual stock sheet
router.get('/test/:symbol', authenticateToken, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const days = parseInt(req.query.days as string) || 30;
    
    console.log(`🔍 [PERFORMANCE TEST] Testing Google Finance sheet for ${symbol}`);
    
    const stockSheet = await googleFinanceSheetService.createStockSheet(symbol);
    
    if (!stockSheet) {
      return res.status(404).json({
        message: `No sheet data found for ${symbol}`,
        symbol,
        days
      });
    }
    
    res.json({
      symbol,
      days,
      stockSheet,
      timestamp: new Date().toISOString(),
      formulasUsed: [
        '=GOOGLEFINANCE(A2, "price")',
        '=TRANSPOSE(QUERY(GOOGLEFINANCE(A2,"price",TODAY()-90,TODAY(),"DAILY"),"select Col2 offset 1",0))',
        '=(INDEX(G2:BJ2,30) - INDEX(G2:BJ2,1)) / INDEX(G2:BJ2,1)',
        '=MAX(G2:BG2)'
      ]
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