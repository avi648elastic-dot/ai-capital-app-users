import { Router, Request, Response } from 'express';
import { authenticateToken, requireSubscription } from '../middleware/auth';
import { riskManagementService } from '../services/riskManagementService';

const router = Router();

// Get risk analysis for a specific portfolio
router.get('/portfolio/:portfolioId', authenticateToken, requireSubscription, async (req: Request, res: Response) => {
  try {
    const { portfolioId } = req.params;
    const userId = req.user!._id;

    const portfolioRisk = await riskManagementService.analyzePortfolioRisk(userId, portfolioId);
    
    res.json({
      success: true,
      data: portfolioRisk
    });
  } catch (error) {
    console.error('❌ [RISK MANAGEMENT] Error getting portfolio risk:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get all risk alerts for the authenticated user
router.get('/alerts', authenticateToken, requireSubscription, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;

    const alerts = await riskManagementService.getUserRiskAlerts(userId);
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('❌ [RISK MANAGEMENT] Error getting user alerts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Update portfolio decisions based on risk analysis
router.post('/update-decisions', authenticateToken, requireSubscription, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;

    await riskManagementService.updatePortfolioDecisions(userId);
    
    res.json({
      success: true,
      message: 'Portfolio decisions updated based on risk analysis'
    });
  } catch (error) {
    console.error('❌ [RISK MANAGEMENT] Error updating decisions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get risk summary for all user portfolios
router.get('/summary', authenticateToken, requireSubscription, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;

    // Get all unique portfolio IDs for the user
    const Portfolio = (await import('../models/Portfolio')).default;
    const portfolios = await Portfolio.distinct('portfolioId', { userId });
    
    const portfolioRisks = [];
    
    for (const portfolioId of portfolios) {
      const portfolioRisk = await riskManagementService.analyzePortfolioRisk(userId, portfolioId);
      portfolioRisks.push(portfolioRisk);
    }

    // Calculate overall risk summary
    const totalValue = portfolioRisks.reduce((sum, p) => sum + p.totalValue, 0);
    const weightedRisk = portfolioRisks.reduce((sum, p) => 
      sum + (p.totalRisk * (p.totalValue / totalValue)), 0
    );
    
    const criticalAlerts = portfolioRisks.flatMap(p => 
      [...p.positionRisks.flatMap(pr => pr.alerts), ...p.portfolioAlerts]
    ).filter(alert => alert.severity === 'CRITICAL');

    const highAlerts = portfolioRisks.flatMap(p => 
      [...p.positionRisks.flatMap(pr => pr.alerts), ...p.portfolioAlerts]
    ).filter(alert => alert.severity === 'HIGH');

    // Determine overall risk level
    let overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (criticalAlerts.length > 0 || weightedRisk > 80) {
      overallRiskLevel = 'CRITICAL';
    } else if (highAlerts.length > 0 || weightedRisk > 60) {
      overallRiskLevel = 'HIGH';
    } else if (weightedRisk > 40) {
      overallRiskLevel = 'MEDIUM';
    }
    
    res.json({
      success: true,
      data: {
        overallRiskLevel,
        totalValue,
        weightedRisk: weightedRisk.toFixed(1),
        portfolioCount: portfolios.length,
        criticalAlerts: criticalAlerts.length,
        highAlerts: highAlerts.length,
        portfolios: portfolioRisks.map(p => ({
          portfolioId: p.portfolioId,
          totalValue: p.totalValue,
          totalRisk: p.totalRisk.toFixed(1),
          riskLevel: p.riskLevel,
          alertCount: p.positionRisks.reduce((sum, pr) => sum + pr.alerts.length, 0) + p.portfolioAlerts.length
        }))
      }
    });
  } catch (error) {
    console.error('❌ [RISK MANAGEMENT] Error getting risk summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

export default router;
