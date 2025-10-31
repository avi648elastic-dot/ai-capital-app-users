import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { aiInsightsService } from '../services/aiInsightsService';
import Portfolio from '../models/Portfolio';
import { loggerService } from '../services/loggerService';
import { redisService } from '../services/redisService';

const router = express.Router();

/**
 * GET /api/ai-insights
 * Get AI-powered insights for user's portfolio
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    // Check cache first
    const cacheKey = `ai-insights:${userId}`;
    const cachedInsights = await redisService.get(cacheKey);
    
    if (cachedInsights) {
      loggerService.info(`🤖 [AI INSIGHTS] Returning cached insights for user ${userId}`);
      return res.json({
        success: true,
        ...JSON.parse(cachedInsights),
        cached: true
      });
    }

    // Fetch user's portfolio
    const portfolio = await Portfolio.find({ userId });

    if (portfolio.length === 0) {
      return res.json({
        success: true,
        overallScore: 0,
        diversificationScore: 0,
        riskScore: 0,
        performanceScore: 0,
        insights: [],
        recommendations: ['Add your first stock to get started with AI insights!'],
        predictedPerformance: {
          nextWeek: 0,
          nextMonth: 0,
          nextQuarter: 0
        }
      });
    }

    // Generate AI insights
    const analysis = await aiInsightsService.generatePortfolioInsights(userId, portfolio);

    // Cache the results for 1 hour (convert seconds to milliseconds)
    await redisService.set(cacheKey, JSON.stringify(analysis), 3600 * 1000);

    res.json({
      success: true,
      ...analysis,
      cached: false
    });
  } catch (error: any) {
    loggerService.error(`🤖 [AI INSIGHTS] Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI insights',
      error: error.message
    });
  }
});

/**
 * GET /api/ai-insights/ticker/:ticker
 * Get AI insights for a specific ticker
 */
router.get('/ticker/:ticker', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { ticker } = req.params;

    // Fetch user's portfolio for this ticker
    const portfolioItem = await Portfolio.findOne({ userId, ticker: ticker.toUpperCase() });

    if (!portfolioItem) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found in portfolio'
      });
    }

    // Generate insights for this specific stock
    const analysis = await aiInsightsService.generatePortfolioInsights(userId, [portfolioItem]);

    // Filter insights related to this ticker
    const tickerInsights = analysis.insights.filter(
      insight => insight.ticker === ticker.toUpperCase()
    );

    res.json({
      success: true,
      ticker: ticker.toUpperCase(),
      insights: tickerInsights,
      score: analysis.overallScore
    });
  } catch (error: any) {
    loggerService.error(`🤖 [AI INSIGHTS] Error for ticker ${req.params.ticker}: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to generate ticker insights',
      error: error.message
    });
  }
});

/**
 * POST /api/ai-insights/refresh
 * Force refresh AI insights (clear cache)
 */
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const cacheKey = `ai-insights:${userId}`;

    // Clear cache
    await redisService.del(cacheKey);

    // Fetch user's portfolio
    const portfolio = await Portfolio.find({ userId });

    if (portfolio.length === 0) {
      return res.json({
        success: true,
        message: 'No portfolio to analyze'
      });
    }

    // Generate fresh insights
    const analysis = await aiInsightsService.generatePortfolioInsights(userId, portfolio);

    // Cache the results (convert seconds to milliseconds)
    await redisService.set(cacheKey, JSON.stringify(analysis), 3600 * 1000);

    res.json({
      success: true,
      ...analysis,
      message: 'Insights refreshed successfully'
    });
  } catch (error: any) {
    loggerService.error(`🤖 [AI INSIGHTS] Refresh error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh insights',
      error: error.message
    });
  }
});

export default router;
