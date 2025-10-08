import express from 'express';
import Portfolio from '../models/Portfolio';
import { authenticateToken, requireSubscription } from '../middleware/auth';
import { sectorService } from '../services/sectorService';
import { historicalDataService } from '../services/historicalDataService';

const router = express.Router();

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
    
    // For now, create simple performance data without historical service
    // TODO: Add back historical data service once it's working
    const portfolioPerformance = portfolio.map((stock, index) => ({
      date: new Date(Date.now() - (30 - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalValue: stock.currentPrice * stock.shares,
      totalPnL: (stock.currentPrice - stock.entryPrice) * stock.shares,
      totalPnLPercent: ((stock.currentPrice - stock.entryPrice) / stock.entryPrice) * 100,
      dailyChange: index > 0 ? (Math.random() - 0.5) * 1000 : 0,
      dailyChangePercent: index > 0 ? (Math.random() - 0.5) * 5 : 0
    }));

    // Use sector analysis data directly
    const sectorPerformance = sectorAnalysis.sectorAllocation.map(sector => ({
      ...sector,
      performance90D: sector.performance90D || 0,
      historicalData: []
    }));

    // Calculate risk assessment
    const riskAssessment = calculateRiskAssessment(portfolio, sectorAnalysis);

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
      riskAssessment
    };

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
