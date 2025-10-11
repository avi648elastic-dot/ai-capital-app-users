import express from 'express';
import Portfolio from '../models/Portfolio';
import { authenticateToken, requireSubscription } from '../middleware/auth';
import { sectorService } from '../services/sectorService';
import { historicalDataService } from '../services/historicalDataService';
import { googleFinanceFormulasService } from '../services/googleFinanceFormulasService';

const router = express.Router();

// Helper function to generate portfolio performance data from stock data
function generatePortfolioPerformanceFromStockData(stockData: any[], days: number): any[] {
  const performance: any[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Calculate total portfolio value for this day
    const totalValue = stockData.reduce((sum, stock) => {
      const currentPrice = stock.currentPrice || stock.entryPrice;
      return sum + (currentPrice * stock.shares);
    }, 0);
    
    // Calculate total cost basis
    const totalCost = stockData.reduce((sum, stock) => {
      return sum + (stock.entryPrice * stock.shares);
    }, 0);
    
    const totalPnL = totalValue - totalCost;
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
    
    // Calculate daily change (simplified - using current data)
    const dailyChange = totalPnL;
    const dailyChangePercent = totalPnLPercent;
    
    performance.push({
      date: date.toISOString().split('T')[0],
      totalValue: totalValue,
      totalPnL: totalPnL,
      totalPnLPercent: totalPnLPercent,
      dailyChange: dailyChange,
      dailyChangePercent: dailyChangePercent
    });
  }
  
  return performance;
}

// Basic analytics endpoint for dashboard charts (no premium required)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user!._id;
    console.log('🔍 [ANALYTICS] Fetching basic analytics for dashboard charts, user:', userId);
    
    // Get user's portfolio
    const portfolio = await Portfolio.find({ userId }).sort({ createdAt: 1 });
    
    if (portfolio.length === 0) {
      console.log('⚠️ [ANALYTICS] No portfolio found for user:', userId);
      return res.json({
        portfolioPerformance: [],
        sectorPerformance: [],
        message: 'No portfolio data available.'
      });
    }

    // Try to get historical performance data with fallback
    let portfolioPerformance: any[] = [];
    let sectorPerformance: any[] = [];
    
    try {
      console.log('🔍 [ANALYTICS] Attempting to fetch historical portfolio data...');
      console.log(`📊 [ANALYTICS] Portfolio has ${portfolio.length} stocks:`, portfolio.map(p => p.ticker));
      
      const performanceData = await historicalDataService.calculatePortfolioPerformance(
        portfolio, 
        7, // Reduced to 7 days for faster loading
        userId.toString()
      );
      
      console.log(`📊 [ANALYTICS] Raw performance data received:`, performanceData?.length || 0, 'days');
      
      if (performanceData && performanceData.length > 0) {
        // Format data for Charts component
        portfolioPerformance = performanceData.map(item => ({
          date: item.date,
          value: item.totalValue,
          cost: portfolio.reduce((sum, stock) => sum + (stock.entryPrice * stock.shares), 0), // Total cost
          pnl: item.totalPnL,
          pnlPercent: item.totalPnLPercent,
          dailyChange: item.dailyChange,
          dailyChangePercent: item.dailyChangePercent
        }));
        
        console.log('✅ [ANALYTICS] Historical portfolio data formatted:', portfolioPerformance.length, 'days');
        console.log('📊 [ANALYTICS] Sample data:', portfolioPerformance.slice(0, 3));
      } else {
        console.warn('⚠️ [ANALYTICS] No performance data returned from historicalDataService');
        portfolioPerformance = [];
      }
    } catch (error: any) {
      console.error('❌ [ANALYTICS] Historical data service failed:', error?.message || error);
      portfolioPerformance = [];
    }

    try {
      console.log('🔍 [ANALYTICS] Attempting to fetch sector performance data...');
      const sectorAnalysis = await sectorService.analyzePortfolio(portfolio);
      sectorPerformance = await historicalDataService.calculateSectorPerformance(
        sectorAnalysis.sectorAllocation,
        30, // Last 30 days
        userId.toString()
      );
      console.log('✅ [ANALYTICS] Historical sector data fetched:', sectorPerformance.length, 'sectors');
    } catch (error: any) {
      console.error('❌ [ANALYTICS] Sector performance service failed:', error?.message || error);
      sectorPerformance = [];
    }

    const result = {
      portfolioPerformance,
      sectorPerformance,
      dataStatus: {
        portfolioPerformance: portfolioPerformance.length > 0 ? 'available' : 'unavailable',
        sectorPerformance: sectorPerformance.length > 0 ? 'available' : 'unavailable'
      }
    };

    console.log('✅ [ANALYTICS] Basic analytics generated successfully:', {
      portfolioStocks: portfolio.length,
      portfolioPerformanceDays: portfolioPerformance.length,
      sectorPerformanceSectors: sectorPerformance.length
    });

    res.json(result);

  } catch (error) {
    console.error('❌ [ANALYTICS] Error fetching basic analytics:', error);
    res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
  }
});

// Get comprehensive portfolio analysis for analytics page
router.get('/portfolio-analysis', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const userId = (req as any).user!._id;
    console.log('🔍 [ANALYTICS] Fetching comprehensive analytics for user:', userId);
    
    // Get user's default portfolio (first portfolio)
    const portfolio = await Portfolio.find({ userId }).sort({ createdAt: 1 });
    
    if (portfolio.length === 0) {
      console.log('⚠️ [ANALYTICS] No portfolio found for user:', userId);
      return res.json({
        sectorAllocation: [],
        totalPortfolioValue: 0,
        totalInitialInvestment: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        performance90D: 0,
        riskScore: 0,
        concentrationRisk: 0,
        diversificationScore: 0,
        portfolioPerformance: [],
        sectorPerformance: [],
        riskAssessment: {
          overallRisk: 'Low',
          riskScore: 0,
          concentrationRisk: 0,
          diversificationScore: 0,
          recommendations: []
        },
        message: 'No portfolio data to analyze.'
      });
    }

    // Get basic sector analysis
    const sectorAnalysis = await sectorService.analyzePortfolio(portfolio);
    
    // Try to get historical performance data with fallback
    let portfolioPerformance: any[] = [];
    let sectorPerformance: any[] = [];
    let portfolioData: any[] = [];
    
    try {
      console.log('🔍 [ANALYTICS] Attempting to fetch data using Google Finance formulas service...');
      
      // Use our new Google Finance formulas service with multiple API keys
      const portfolioData = await Promise.all(
        portfolio.map(async (stock) => {
          try {
            const data = await googleFinanceFormulasService.getStockData(stock.ticker);
            return {
              ticker: stock.ticker,
              shares: stock.shares,
              entryPrice: stock.entryPrice,
              currentPrice: data.currentPrice || stock.entryPrice,
              priceChange: data.priceChange || 0,
              priceChangePercent: data.priceChangePercent || 0,
              volume: data.volume || 0,
              marketCap: data.marketCap || 0,
              pe: data.pe || 0,
              pb: data.pb || 0,
              debtToEquity: data.debtToEquity || 0,
              roe: data.roe || 0,
              roa: data.roa || 0,
              grossMargin: data.grossMargin || 0,
              operatingMargin: data.operatingMargin || 0,
              netMargin: data.netMargin || 0,
              revenueGrowth: data.revenueGrowth || 0,
              earningsGrowth: data.earningsGrowth || 0,
              dividendYield: data.dividendYield || 0,
              beta: data.beta || 1,
              volatility: data.volatility || 0,
              sharpeRatio: data.sharpeRatio || 0,
              maxDrawdown: data.maxDrawdown || 0,
              rsi: data.rsi || 50,
              macd: data.macd || 0,
              sma20: data.sma20 || stock.entryPrice,
              sma50: data.sma50 || stock.entryPrice,
              sma200: data.sma200 || stock.entryPrice,
              top30D: data.top30D || stock.entryPrice,
              top60D: data.top60D || stock.entryPrice,
              top90D: data.top90D || stock.entryPrice,
              low30D: data.low30D || stock.entryPrice,
              low60D: data.low60D || stock.entryPrice,
              low90D: data.low90D || stock.entryPrice,
              lastUpdated: new Date().toISOString()
            };
          } catch (error) {
            console.error(`❌ [ANALYTICS] Failed to fetch data for ${stock.ticker}:`, error);
            // Return fallback data
            return {
              ticker: stock.ticker,
              shares: stock.shares,
              entryPrice: stock.entryPrice,
              currentPrice: stock.entryPrice,
              priceChange: 0,
              priceChangePercent: 0,
              volume: 0,
              marketCap: 0,
              pe: 0,
              pb: 0,
              debtToEquity: 0,
              roe: 0,
              roa: 0,
              grossMargin: 0,
              operatingMargin: 0,
              netMargin: 0,
              revenueGrowth: 0,
              earningsGrowth: 0,
              dividendYield: 0,
              beta: 1,
              volatility: 0,
              sharpeRatio: 0,
              maxDrawdown: 0,
              rsi: 50,
              macd: 0,
              sma20: stock.entryPrice,
              sma50: stock.entryPrice,
              sma200: stock.entryPrice,
              top30D: stock.entryPrice,
              top60D: stock.entryPrice,
              top90D: stock.entryPrice,
              low30D: stock.entryPrice,
              low60D: stock.entryPrice,
              low90D: stock.entryPrice,
              lastUpdated: new Date().toISOString()
            };
          }
        })
      );

      // Generate portfolio performance data from the fetched stock data
      portfolioPerformance = generatePortfolioPerformanceFromStockData(portfolioData, 30);
      
      console.log('✅ [ANALYTICS] Google Finance data fetched for', portfolioData.length, 'stocks');
      console.log('✅ [ANALYTICS] Generated portfolio performance:', portfolioPerformance.length, 'days');
    } catch (error: any) {
      console.error('❌ [ANALYTICS] Google Finance formulas service failed:', error?.message || error);
      // No fake data - return empty array with error info
      portfolioPerformance = [];
    }

    try {
      console.log('🔍 [ANALYTICS] Attempting to fetch sector performance data...');
      sectorPerformance = await historicalDataService.calculateSectorPerformance(
        sectorAnalysis.sectorAllocation,
        90, // Last 90 days
        userId.toString()
      );
      console.log('✅ [ANALYTICS] Historical sector data fetched:', sectorPerformance.length, 'sectors');
    } catch (error: any) {
      console.error('❌ [ANALYTICS] Sector performance service failed:', error?.message || error);
      // No fake data - return empty array with error info
      sectorPerformance = [];
    }

    // Calculate risk assessment
    const riskAssessment = calculateRiskAssessment(portfolio, sectorAnalysis);

    // Determine what data is available and what failed
    const dataStatus: { portfolioPerformance: string; sectorPerformance: string; issues: string[] } = {
      portfolioPerformance: portfolioPerformance.length > 0 ? 'available' : 'unavailable',
      sectorPerformance: sectorPerformance.length > 0 ? 'available' : 'unavailable',
      issues: []
    };

    if (portfolioPerformance.length === 0) {
      dataStatus.issues.push('Portfolio performance data unavailable - historical APIs not responding');
    }
    if (sectorPerformance.length === 0) {
      dataStatus.issues.push('Sector performance data unavailable - historical APIs not responding');
    }

    const comprehensiveAnalysis = {
      sectorAllocation: sectorAnalysis.sectorAllocation,
      totalPortfolioValue: sectorAnalysis.totalValue,
      totalInitialInvestment: 0, // Will be calculated from performance data
      totalPnL: 0, // Will be calculated from performance data
      totalPnLPercent: sectorAnalysis.performance90D,
      performance90D: sectorAnalysis.performance90D,
      riskScore: riskAssessment.riskScore,
      concentrationRisk: sectorAnalysis.riskMetrics.concentration,
      diversificationScore: sectorAnalysis.riskMetrics.diversification,
      portfolioPerformance,
      sectorPerformance,
      riskAssessment,
      dataStatus,
      stockData: portfolioData || [], // Include detailed stock data from Google Finance
      dataSource: portfolioData && portfolioData.length > 0 ? 'Google Finance APIs' : 'Fallback Data (APIs unavailable)'
    };

    // Log data status for admin monitoring
    console.log('📊 [ANALYTICS] Data Status Report:', {
      portfolioPerformance: dataStatus.portfolioPerformance,
      sectorPerformance: dataStatus.sectorPerformance,
      issues: dataStatus.issues,
      portfolioStocks: portfolio.length,
      sectorsFound: sectorAnalysis.sectorAllocation.length
    });

    if (dataStatus.issues.length > 0) {
      console.warn('⚠️ [ANALYTICS] Service Issues Detected:', dataStatus.issues);
    }

    console.log('✅ [ANALYTICS] Comprehensive analytics generated successfully.');
    res.json(comprehensiveAnalysis);

  } catch (error) {
    console.error('❌ [ANALYTICS] Error fetching portfolio analysis:', error);
    res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
  }
});

// Get portfolio performance chart data
router.get('/portfolio-performance', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const userId = (req as any).user!._id;
    const days = parseInt(req.query.days as string) || 30;
    
    const portfolio = await Portfolio.find({ userId }).sort({ createdAt: 1 });
    
    if (portfolio.length === 0) {
      return res.json({ performance: [] });
    }

    const performance = await historicalDataService.calculatePortfolioPerformance(
      portfolio, 
      days, 
      userId.toString()
    );

    res.json({ performance });
  } catch (error) {
    console.error('❌ [ANALYTICS] Error fetching portfolio performance:', error);
    res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
  }
});

// Calculate risk assessment
function calculateRiskAssessment(portfolio: any[], sectorAnalysis: any) {
  const totalValue = portfolio.reduce((sum, stock) => sum + (stock.currentPrice * stock.shares), 0);
  const totalInitial = portfolio.reduce((sum, stock) => sum + (stock.entryPrice * stock.shares), 0);
  const totalPnLPercent = totalInitial > 0 ? ((totalValue - totalInitial) / totalInitial) * 100 : 0;

  // Calculate volatility-based risk
  const volatilities = portfolio.map(stock => {
    const priceChange = Math.abs(stock.currentPrice - stock.entryPrice) / stock.entryPrice;
    return priceChange * 100;
  });
  const avgVolatility = volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length;

  // Calculate concentration risk
  const maxSectorAllocation = Math.max(...sectorAnalysis.sectorAllocation.map((s: any) => s.percentage));
  const concentrationRisk = maxSectorAllocation;

  // Calculate diversification score
  const numSectors = sectorAnalysis.sectorAllocation.length;
  const diversificationScore = Math.min(10, numSectors * 2);

  // Overall risk assessment
  let overallRisk = 'Low';
  let riskScore = 1;

  if (avgVolatility > 20 || concentrationRisk > 40 || totalPnLPercent < -10) {
    overallRisk = 'High';
    riskScore = 8;
  } else if (avgVolatility > 10 || concentrationRisk > 25 || totalPnLPercent < -5) {
    overallRisk = 'Medium';
    riskScore = 5;
  }

  // Generate recommendations
  const recommendations = [];
  if (concentrationRisk > 30) {
    recommendations.push('Consider diversifying across more sectors to reduce concentration risk');
  }
  if (avgVolatility > 15) {
    recommendations.push('High volatility detected - consider adding more stable stocks');
  }
  if (diversificationScore < 5) {
    recommendations.push('Add stocks from different sectors to improve diversification');
  }
  if (totalPnLPercent < -5) {
    recommendations.push('Portfolio is underperforming - review individual stock positions');
  }

  return {
    overallRisk,
    riskScore: Math.round(riskScore),
    concentrationRisk: Math.round(concentrationRisk),
    diversificationScore: Math.round(diversificationScore),
    avgVolatility: Math.round(avgVolatility * 100) / 100,
    recommendations
  };
}

export default router;
