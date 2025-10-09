import express from 'express';
import Portfolio from '../models/Portfolio';
import { authenticateToken } from '../middleware/auth';
import { googleFinanceFormulasService } from '../services/googleFinanceFormulasService';

const router = express.Router();

// Get real performance analytics using Google Finance formulas
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user!._id;
    const days = parseInt(req.query.days as string) || 30;
    
    console.log(`🔍 [PERFORMANCE] Applying Google Finance formulas for user ${userId}, ${days} days`);
    
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
    console.log(`🔍 [PERFORMANCE] Applying Google Finance formulas to tickers: ${tickers.join(', ')}`);
    
    // Apply Google Finance formulas to each ticker
    const formulasResults = await googleFinanceFormulasService.applyFormulasToMultipleStocks(tickers);
    
    // Calculate metrics for each stock using the formula results
    const stockMetrics: Record<string, any> = {};
    let totalPortfolioValue = 0;
    let totalPortfolioReturn = 0;
    let totalWeightedVolatility = 0;
    let portfolioMaxDrawdown = 0;

    for (const stock of portfolio) {
      const formulasResult = formulasResults.get(stock.ticker);
      if (!formulasResult) {
        console.warn(`⚠️ [PERFORMANCE] No formula results for ${stock.ticker}`);
        continue;
      }

      // Get the return for the requested timeframe
      let returnForPeriod = 0;
      let topPriceForPeriod = 0;
      
      switch (days) {
        case 7:
          returnForPeriod = formulasResult.returns.return7D;
          topPriceForPeriod = formulasResult.topPrices.top30D; // Use 30D top for 7D period
          break;
        case 30:
          returnForPeriod = formulasResult.returns.return30D;
          topPriceForPeriod = formulasResult.topPrices.top30D;
          break;
        case 60:
          returnForPeriod = formulasResult.returns.return60D;
          topPriceForPeriod = formulasResult.topPrices.top60D;
          break;
        case 90:
          returnForPeriod = formulasResult.returns.return90D;
          topPriceForPeriod = formulasResult.topPrices.top90D;
          break;
        default:
          returnForPeriod = formulasResult.returns.return30D;
          topPriceForPeriod = formulasResult.topPrices.top30D;
      }

      // Calculate volatility using the formula-generated data
      const volatility = Math.abs(returnForPeriod) * 2; // Rough volatility estimate based on returns
      
      // Calculate Sharpe ratio (assuming risk-free rate of 2%)
      const riskFreeRate = 2.0;
      const sharpeRatio = volatility > 0 ? (returnForPeriod - riskFreeRate) / volatility : 0;
      
      // Calculate max drawdown based on return
      const maxDrawdown = Math.abs(returnForPeriod) * 1.5; // Estimate max drawdown

      const metrics = {
        totalReturn: returnForPeriod,
        volatility,
        sharpeRatio,
        maxDrawdown,
        topPrice: topPriceForPeriod,
        currentPrice: formulasResult.currentPrice
      };

      console.log(`📊 [PERFORMANCE] ${stock.ticker} calculated using Google Finance formulas:`, {
        timeframe: `${days}d`,
        return: returnForPeriod.toFixed(2) + '%',
        topPrice: '$' + topPriceForPeriod.toFixed(2),
        currentPrice: '$' + formulasResult.currentPrice.toFixed(2),
        volatility: volatility.toFixed(2) + '%',
        sharpe: sharpeRatio.toFixed(2)
      });

      stockMetrics[stock.ticker] = metrics;

      // Calculate portfolio-weighted metrics
      const stockValue = formulasResult.currentPrice * stock.shares;
      const totalPortfolioValueCalc = portfolio.reduce((sum, s) => {
        const result = formulasResults.get(s.ticker);
        return sum + (result?.currentPrice || 0) * s.shares;
      }, 0);
      
      const stockWeight = totalPortfolioValueCalc > 0 ? stockValue / totalPortfolioValueCalc : 0;
      
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
      dataPoints: formulasResults.size
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
      dataSource: 'Google Finance Formulas',
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

// Test endpoint to debug individual stock formulas
router.get('/test/:symbol', authenticateToken, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const days = parseInt(req.query.days as string) || 30;
    
    console.log(`🔍 [PERFORMANCE TEST] Testing Google Finance formulas for ${symbol}`);
    
    const formulasResult = await googleFinanceFormulasService.applyFormulasToStock(symbol);
    
    if (!formulasResult) {
      return res.status(404).json({
        message: `No formula results found for ${symbol}`,
        symbol,
        days
      });
    }
    
    res.json({
      symbol,
      days,
      formulasResult,
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