import express from 'express';
import Portfolio from '../models/Portfolio';
import { authenticateToken } from '../middleware/auth';
import { googleSheetsSimulator } from '../services/googleSheetsSimulator';

const router = express.Router();

// Get real performance analytics using Google Sheets formulas
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user!._id;
    const days = parseInt(req.query.days as string) || 30;
    
    console.log(`🔍 [PERFORMANCE] Creating Google Sheets for user ${userId}, ${days} days`);
    
    // Get user's portfolio
    const portfolio = await Portfolio.find({ userId }).sort({ createdAt: 1 });
    
    if (portfolio.length === 0) {
      return res.json({
        portfolioMetrics: null,
        stockMetrics: {},
        message: 'No portfolio data available.'
      });
    }

    // Get unique tickers (A2, B2, C2, etc.)
    const tickers = [...new Set(portfolio.map(item => item.ticker))];
    console.log(`🔍 [PERFORMANCE] Creating Google Sheets: A2=${tickers[0]}, B2=${tickers[1]}, etc.`);
    
    // Create Google Sheets for each ticker with real formulas
    const sheetsMap = await googleSheetsSimulator.createSheetsForPortfolio(tickers);
    
    // Calculate metrics for each stock using the Google Sheets data
    const stockMetrics: Record<string, any> = {};
    let totalPortfolioValue = 0;
    let totalPortfolioReturn = 0;
    let totalWeightedVolatility = 0;
    let portfolioMaxDrawdown = 0;

    for (const stock of portfolio) {
      const sheetData = sheetsMap.get(stock.ticker);
      if (!sheetData) {
        console.warn(`⚠️ [PERFORMANCE] No sheet data for ${stock.ticker}`);
        continue;
      }

      // Get values for the requested timeframe from Google Sheets
      const { returnValue, topPrice } = googleSheetsSimulator.getValuesForTimeframe(sheetData, days);

      // Calculate volatility from the price columns (G2:BG2)
      const priceColumns = sheetData.priceColumns;
      const relevantPrices = priceColumns.slice(-days);
      const dailyReturns = [];
      
      for (let i = 1; i < relevantPrices.length; i++) {
        const dailyReturn = (relevantPrices[i] - relevantPrices[i - 1]) / relevantPrices[i - 1];
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
      
      // Calculate max drawdown from price columns
      let maxDrawdown = 0;
      let peak = relevantPrices[0];
      for (const price of relevantPrices) {
        if (price > peak) peak = price;
        const drawdown = ((peak - price) / peak) * 100;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }

      const metrics = {
        totalReturn: returnValue,
        volatility,
        sharpeRatio,
        maxDrawdown,
        topPrice: topPrice,
        currentPrice: sheetData.currentPrice
      };

      console.log(`📊 [PERFORMANCE] ${stock.ticker} calculated using Google Sheets formulas:`, {
        timeframe: `${days}d`,
        formula: `=(INDEX(G2:BG2,${90 - days + 1}) - INDEX(G2:BG2,1)) / INDEX(G2:BG2,1)`,
        return: returnValue.toFixed(2) + '%',
        topPrice: '$' + topPrice.toFixed(2),
        currentPrice: '$' + sheetData.currentPrice.toFixed(2),
        volatility: volatility.toFixed(2) + '%',
        sharpe: sharpeRatio.toFixed(2)
      });

      stockMetrics[stock.ticker] = metrics;

      // Calculate portfolio-weighted metrics
      const stockValue = sheetData.currentPrice * stock.shares;
      const totalPortfolioValueCalc = portfolio.reduce((sum, s) => {
        const sheet = sheetsMap.get(s.ticker);
        return sum + (sheet?.currentPrice || 0) * s.shares;
      }, 0);
      
      const stockWeight = totalPortfolioValueCalc > 0 ? stockValue / totalPortfolioValueCalc : 0;
      
      totalPortfolioValue += stockValue;
      totalPortfolioReturn += returnValue * stockWeight;
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
      dataPoints: sheetsMap.size
    };

    console.log(`✅ [PERFORMANCE] Portfolio metrics calculated using Google Sheets:`, {
      totalReturn: totalPortfolioReturn.toFixed(2) + '%',
      volatility: totalWeightedVolatility.toFixed(2) + '%',
      sharpeRatio: portfolioSharpe.toFixed(2),
      maxDrawdown: portfolioMaxDrawdown.toFixed(2) + '%',
      currentValue: '$' + totalPortfolioValue.toFixed(2),
      sheetsCreated: sheetsMap.size
    });
    
    res.json({
      portfolioMetrics,
      stockMetrics,
      timeframe: `${days}d`,
      dataSource: 'Google Sheets Formulas',
      timestamp: new Date().toISOString(),
      formulasUsed: [
        '=GOOGLEFINANCE(A2, "price")',
        '=TRANSPOSE(QUERY(GOOGLEFINANCE(A2,"price",TODAY()-90,TODAY(),"DAILY"),"select Col2 offset 1",0))',
        '=(INDEX(G2:BJ2,30) - INDEX(G2:BJ2,1)) / INDEX(G2:BJ2,1)',
        '=MAX(G2:BG2)'
      ],
      sheetsCreated: Array.from(sheetsMap.keys()).map((ticker, index) => 
        `${String.fromCharCode(65 + index)}2 = ${ticker}`
      )
    });

  } catch (error: any) {
    console.error('❌ [PERFORMANCE] Error calculating performance metrics:', error);
    
    res.status(500).json({
      message: 'Failed to calculate performance metrics',
      error: error.message
    });
  }
});

// Test endpoint to debug individual stock Google Sheets
router.get('/test/:symbol', authenticateToken, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const days = parseInt(req.query.days as string) || 30;
    
    console.log(`🔍 [PERFORMANCE TEST] Creating Google Sheet for ${symbol} (A2 = ${symbol})`);
    
    const sheetData = await googleSheetsSimulator.createSheetForTicker(symbol);
    
    if (!sheetData) {
      return res.status(404).json({
        message: `No sheet data found for ${symbol}`,
        symbol,
        days
      });
    }
    
    res.json({
      symbol,
      days,
      sheetData,
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