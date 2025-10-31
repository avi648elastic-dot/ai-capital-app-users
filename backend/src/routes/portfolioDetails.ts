import express from 'express';
import { authenticateToken } from '../middleware/auth';
import Portfolio from '../models/Portfolio';
import { getMetrics } from '../utils/metrics.engine';
import { googleFinanceFormulasService } from '../services/googleFinanceFormulasService';
import { decisionEngine } from '../services/decisionEngine';
import { loggerService } from '../services/loggerService';
import { redisService } from '../services/redisService';

const router = express.Router();

/**
 * GET /api/portfolio-details/summary
 * Get aggregated portfolio summary for dashboard Portfolio Details section
 */
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user!._id;
    
    // Check cache first
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `portfolio-details:${userId}:${today}`;
    
    try {
      const cached = await redisService.get(cacheKey);
      if (cached) {
        loggerService.info(`✅ [PORTFOLIO DETAILS] Cache hit for user ${userId}`);
        return res.json(JSON.parse(cached));
      }
    } catch (cacheError) {
      loggerService.warn('⚠️ [PORTFOLIO DETAILS] Cache check failed, continuing...');
    }
    
    loggerService.info(`🔍 [PORTFOLIO DETAILS] Fetching portfolio summary for user ${userId}`);
    
    // Get user's portfolio
    const portfolio = await Portfolio.find({ 
      userId,
      action: 'BUY',
      isTraining: { $ne: true }
    }).sort({ createdAt: 1 });
    
    if (portfolio.length === 0) {
      return res.json({
        summary: 'Your portfolio is empty. Start by adding stocks to track your investments.',
        bestLongTerm: [],
        bestShortTerm: [],
        insights: {
          performance30D: 0,
          volatility: 0,
          winningStocks: 0,
          riskLevel: 'LOW'
        }
      });
    }
    
    // Get unique tickers
    const tickers = [...new Set(portfolio.map(item => item.ticker))];
    
    // 1. Calculate performance metrics (from Performance Analysis)
    let performance30D = 0;
    let portfolioVolatility = 0;
    let avgSharpeRatio = 0;
    
    try {
      const metricsPromises = tickers.map(async (ticker) => {
        try {
          const metricsData = await getMetrics(ticker);
          return metricsData.metrics["30d"];
        } catch (error) {
          loggerService.warn(`⚠️ [PORTFOLIO DETAILS] Could not get metrics for ${ticker}`);
          return null;
        }
      });
      
      const metricsResults = await Promise.all(metricsPromises);
      const validMetrics = metricsResults.filter(m => m !== null);
      
      if (validMetrics.length > 0) {
        // Calculate weighted averages
        let totalWeight = 0;
        let weightedReturn = 0;
        let weightedVol = 0;
        let totalSharpe = 0;
        
        portfolio.forEach(stock => {
          const metrics = validMetrics.find((m, i) => tickers[i] === stock.ticker);
          if (metrics) {
            const stockValue = stock.currentPrice * stock.shares;
            const totalValue = portfolio.reduce((sum, s) => sum + (s.currentPrice * s.shares), 0);
            const weight = totalValue > 0 ? stockValue / totalValue : 0;
            
            weightedReturn += (metrics.returnPct || 0) * weight;
            weightedVol += (metrics.volatilityAnnual || 0) * weight;
            totalSharpe += (metrics.sharpe || 0);
            totalWeight += weight;
          }
        });
        
        if (totalWeight > 0) {
          performance30D = weightedReturn / totalWeight;
          portfolioVolatility = weightedVol / totalWeight;
          avgSharpeRatio = totalSharpe / validMetrics.length;
        }
      }
    } catch (error) {
      loggerService.error('❌ [PORTFOLIO DETAILS] Error calculating performance:', error);
    }
    
    // 2. Get decision engine insights
    let buySignals = 0;
    let sellSignals = 0;
    let holdSignals = 0;
    
    try {
      const portfolioItems = portfolio.map(item => ({
        ticker: item.ticker,
        entryPrice: item.entryPrice,
        currentPrice: item.currentPrice,
        stopLoss: item.stopLoss,
        takeProfit: item.takeProfit
      }));
      
      const decisions = await decisionEngine.updatePortfolioDecisions(portfolioItems);
      buySignals = decisions.filter(d => d.action === 'BUY').length;
      sellSignals = decisions.filter(d => d.action === 'SELL').length;
      holdSignals = decisions.filter(d => d.action === 'HOLD').length;
    } catch (error) {
      loggerService.warn('⚠️ [PORTFOLIO DETAILS] Could not fetch decision engine data');
    }
    
    // 3. Calculate portfolio statistics
    const totalValue = portfolio.reduce((sum, s) => sum + (s.currentPrice * s.shares), 0);
    const totalCost = portfolio.reduce((sum, s) => sum + (s.entryPrice * s.shares), 0);
    const totalPnL = totalValue - totalCost;
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
    const winningStocks = portfolio.filter(s => s.currentPrice > s.entryPrice).length;
    const losingStocks = portfolio.filter(s => s.currentPrice < s.entryPrice).length;
    
    // 4. Determine risk level based on volatility
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (portfolioVolatility > 40) {
      riskLevel = 'HIGH';
    } else if (portfolioVolatility > 25) {
      riskLevel = 'MEDIUM';
    }
    
    // 5. Find best stocks for long-term (solid) and short-term (risky)
    const bestLongTerm: Array<{ticker: string; reason: string; metrics: any}> = [];
    const bestShortTerm: Array<{ticker: string; reason: string; metrics: any}> = [];
    
    try {
      // Get metrics for all stocks
      const stockMetricsMap = await Promise.all(
        tickers.map(async (ticker) => {
          try {
            const metrics = await getMetrics(ticker);
            const stock = portfolio.find(s => s.ticker === ticker);
            if (!stock) return null;
            
            return {
              ticker,
              stock,
              metrics: metrics.metrics["90d"], // Use 90d for long-term
              metrics30d: metrics.metrics["30d"], // Use 30d for short-term
            };
          } catch (error) {
            return null;
          }
        })
      );
      
      const validStocks = stockMetricsMap.filter(s => s !== null);
      
      // Best long-term stocks (solid): Low volatility, positive 90d return, good Sharpe ratio
      const longTermCandidates = validStocks
        .filter(s => {
          const vol = s!.metrics?.volatilityAnnual || 100;
          const return90d = s!.metrics?.returnPct || -100;
          const sharpe = s!.metrics?.sharpe || -10;
          return vol < 30 && return90d > 0 && sharpe > 0.5;
        })
        .sort((a, b) => {
          // Sort by Sharpe ratio, then by 90d return
          const sharpeA = a!.metrics?.sharpe || -10;
          const sharpeB = b!.metrics?.sharpe || -10;
          if (Math.abs(sharpeA - sharpeB) > 0.5) {
            return sharpeB - sharpeA;
          }
          return (b!.metrics?.returnPct || -100) - (a!.metrics?.returnPct || -100);
        })
        .slice(0, 3);
      
      longTermCandidates.forEach(stock => {
        if (stock) {
          const metrics = stock.metrics;
          bestLongTerm.push({
            ticker: stock.ticker,
            reason: `Low volatility (${(metrics?.volatilityAnnual || 0).toFixed(1)}%), strong 90-day return (+${(metrics?.returnPct || 0).toFixed(1)}%), and favorable risk-adjusted returns (Sharpe: ${(metrics?.sharpe || 0).toFixed(2)}) make this ideal for long-term growth.`,
            metrics: metrics
          });
        }
      });
      
      // Best short-term stocks (risky): Higher volatility, strong 30d momentum, potential for quick gains
      const shortTermCandidates = validStocks
        .filter(s => {
          const vol30d = s!.metrics30d?.volatilityAnnual || 0;
          const return30d = s!.metrics30d?.returnPct || -100;
          return vol30d > 30 && return30d > 5; // Higher volatility, positive momentum
        })
        .sort((a, b) => {
          // Sort by 30d return (momentum)
          return (b!.metrics30d?.returnPct || -100) - (a!.metrics30d?.returnPct || -100);
        })
        .slice(0, 3);
      
      shortTermCandidates.forEach(stock => {
        if (stock) {
          const metrics = stock.metrics30d;
          bestShortTerm.push({
            ticker: stock.ticker,
            reason: `Strong 30-day momentum (+${(metrics?.returnPct || 0).toFixed(1)}%) with elevated volatility (${(metrics?.volatilityAnnual || 0).toFixed(1)}%) indicates potential for short-term gains, suitable for active trading strategies.`,
            metrics: metrics
          });
        }
      });
    } catch (error) {
      loggerService.error('❌ [PORTFOLIO DETAILS] Error finding best stocks:', error);
    }
    
    // 6. Generate 3-sentence summary
    const sentence1 = totalPnLPercent > 0
      ? `Your portfolio shows a strong ${totalPnLPercent.toFixed(2)}% return, with ${winningStocks} winning positions outperforming ${losingStocks} underperformers.`
      : `Your portfolio is currently down ${Math.abs(totalPnLPercent).toFixed(2)}%, with ${winningStocks} positions in profit and ${losingStocks} positions requiring attention.`;
    
    const sentence2 = performance30D > 0
      ? `Over the past 30 days, your portfolio has gained ${performance30D.toFixed(2)}% with a ${portfolioVolatility.toFixed(1)}% volatility level, indicating ${riskLevel.toLowerCase()} risk exposure.`
      : `Recent 30-day performance shows ${Math.abs(performance30D).toFixed(2)}% ${performance30D < 0 ? 'decline' : 'growth'} with ${portfolioVolatility.toFixed(1)}% volatility, suggesting ${riskLevel.toLowerCase()} risk levels.`;
    
    const decisionSummary = buySignals > 0
      ? `${buySignals} positions show BUY signals, indicating strong potential for growth.`
      : sellSignals > 0
      ? `${sellSignals} positions have SELL signals, suggesting it may be time to take profits or reduce exposure.`
      : `Most positions are on HOLD, indicating stable portfolio conditions.`;
    
    const sentence3 = `${decisionSummary} Portfolio diversification and risk-adjusted metrics suggest ${avgSharpeRatio > 1 ? 'excellent' : avgSharpeRatio > 0.5 ? 'good' : 'moderate'} risk-adjusted returns.`;
    
    const summary = `${sentence1} ${sentence2} ${sentence3}`;
    
    const result = {
      summary,
      bestLongTerm,
      bestShortTerm,
      insights: {
        performance30D,
        volatility: portfolioVolatility,
        winningStocks,
        totalStocks: portfolio.length,
        riskLevel,
        totalValue,
        totalPnLPercent
      }
    };
    
    // Cache for 6 hours
    try {
      await redisService.set(cacheKey, JSON.stringify(result), 6 * 60 * 60 * 1000);
      loggerService.info(`💾 [PORTFOLIO DETAILS] Cached summary for user ${userId}`);
    } catch (cacheError) {
      loggerService.warn('⚠️ [PORTFOLIO DETAILS] Failed to cache (non-critical)');
    }
    
    res.json(result);
  } catch (error) {
    loggerService.error('❌ [PORTFOLIO DETAILS] Error fetching portfolio summary:', error);
    res.status(500).json({
      message: 'Failed to fetch portfolio details',
      error: (error as Error).message
    });
  }
});

export default router;

