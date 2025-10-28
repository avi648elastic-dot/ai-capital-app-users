import Portfolio from '../models/Portfolio';
import { stockDataService } from './stockDataService';
import { decisionEngine } from './decisionEngine';

export interface RiskAlert {
  type: 'STOP_LOSS' | 'TAKE_PROFIT' | 'POSITION_SIZE' | 'PORTFOLIO_RISK' | 'MARKET_CONDITION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  ticker?: string;
  currentPrice?: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  portfolioId?: string;
  action: 'SELL' | 'HOLD' | 'REDUCE' | 'MONITOR';
  timestamp: Date;
}

export interface PositionRisk {
  ticker: string;
  currentPrice: number;
  entryPrice: number;
  shares: number;
  stopLoss?: number;
  takeProfit?: number;
  portfolioValue: number;
  portfolioPercentage: number;
  riskScore: number;
  alerts: RiskAlert[];
}

export interface PortfolioRisk {
  portfolioId: string;
  totalValue: number;
  totalRisk: number;
  positionRisks: PositionRisk[];
  portfolioAlerts: RiskAlert[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class RiskManagementService {
  
  /**
   * Enhanced decision logic based on your old code
   * Analyzes position strength and provides actionable recommendations
   */
  decideActionEnhanced(current: number, stop: number | undefined, target: string | undefined, entry: number, performanceData?: any): { action: string; color: string; reason: string; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' } {
    // Hard rules - immediate action required
    if (!current || !stop) {
      return { action: "HOLD", color: "#fdd46e", reason: "Missing stop or current price data", riskLevel: 'MEDIUM' };
    }

    const stopVal = parseFloat(stop.toString());
    
    // Critical: Stop loss hit - immediate sell
    if (current <= stopVal) {
      return { action: "SELL", color: "#ff6b6b", reason: `CRITICAL: Stop loss hit at $${stopVal}`, riskLevel: 'CRITICAL' };
    }

    // Take profit awareness
    if (target) {
      const tp1 = Math.round(parseFloat(String(target).split(/[' ,/]+/)[0]) * 100) / 100; // Round to 2 decimal places
      if (tp1 && current >= tp1 * 0.95) {
        return { action: "SELL", color: "#ff6b6b", reason: `Take profit zone reached (${tp1.toFixed(2)})`, riskLevel: 'HIGH' };
      }
      if (tp1 && current >= tp1 * 0.90) {
        return { action: "MONITOR", color: "#58d68d", reason: `Approaching take profit (${tp1.toFixed(2)})`, riskLevel: 'MEDIUM' };
      }
    }

    // Risk scoring system (based on your old logic)
    let score = 0;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

    // 30% weight: Performance vs historical highs
    if (performanceData?.top60) {
      if (current >= performanceData.top60 * 0.90) score += 1;   // Near the top → strength
      if (current <= performanceData.top60 * 0.70) score -= 1;   // Far below → weakness
    }

    // 20% weight: Recent performance (this month)
    if (performanceData) {
      if (performanceData.thisMonth >= 10) score += 1;
      if (performanceData.thisMonth <= -10) score -= 1;

      if (performanceData.lastMonth >= 10) score += 1;
      if (performanceData.lastMonth <= -10) score -= 1;
    }

    // 30% weight: Price vs entry
    if (entry) {
      if (current > entry) score += 1;
      if (current < entry * 0.90) score -= 1;
    }

    // 20% weight: Distance from stop loss
    const stopDistance = ((current - stopVal) / current) * 100;
    if (stopDistance < 5) {
      score -= 2; // Too close to stop loss
      riskLevel = 'HIGH';
    } else if (stopDistance < 10) {
      score -= 1; // Getting close to stop loss
      riskLevel = 'MEDIUM';
    }

    // Determine action and risk level
    if (score >= 2) {
      return { action: "BUY", color: "#58d68d", reason: `Strong position (Score: ${score})`, riskLevel: 'LOW' };
    } else if (score <= -2) {
      return { action: "SELL", color: "#ff6b6b", reason: `Weak position (Score: ${score})`, riskLevel: 'HIGH' };
    } else if (score <= -1) {
      riskLevel = 'MEDIUM';
    }

    return { action: "HOLD", color: "#fdd46e", reason: `Neutral position (Score: ${score})`, riskLevel };
  }

  /**
   * Analyze individual position risk
   */
  async analyzePositionRisk(stock: any, portfolioValue: number, performanceData?: any): Promise<PositionRisk> {
    const currentPrice = stock.currentPrice;
    const entryPrice = stock.entryPrice;
    const shares = stock.shares;
    const positionValue = currentPrice * shares;
    const portfolioPercentage = (positionValue / portfolioValue) * 100;

    const { action, riskLevel, reason } = this.decideActionEnhanced(
      currentPrice,
      stock.stopLoss,
      stock.takeProfit?.toString(),
      entryPrice,
      performanceData
    );

    const alerts: RiskAlert[] = [];
    
    // Generate risk alerts
    if (action === 'SELL' && reason.includes('Stop loss')) {
      alerts.push({
        type: 'STOP_LOSS',
        severity: 'CRITICAL',
        message: `CRITICAL: ${stock.ticker} hit stop loss at $${stock.stopLoss}`,
        ticker: stock.ticker,
        currentPrice,
        entryPrice,
        stopLoss: stock.stopLoss,
        action: 'SELL',
        timestamp: new Date()
      });
    }

    if (action === 'SELL' && reason.includes('Take profit')) {
      alerts.push({
        type: 'TAKE_PROFIT',
        severity: 'HIGH',
        message: `${stock.ticker} reached take profit zone`,
        ticker: stock.ticker,
        currentPrice,
        entryPrice,
        takeProfit: stock.takeProfit,
        action: 'SELL',
        timestamp: new Date()
      });
    }

    // Position size alerts
    if (portfolioPercentage > 20) {
      alerts.push({
        type: 'POSITION_SIZE',
        severity: 'HIGH',
        message: `${stock.ticker} represents ${portfolioPercentage.toFixed(1)}% of portfolio - consider reducing`,
        ticker: stock.ticker,
        currentPrice,
        action: 'REDUCE',
        timestamp: new Date()
      });
    } else if (portfolioPercentage > 15) {
      alerts.push({
        type: 'POSITION_SIZE',
        severity: 'MEDIUM',
        message: `${stock.ticker} is ${portfolioPercentage.toFixed(1)}% of portfolio - monitor closely`,
        ticker: stock.ticker,
        currentPrice,
        action: 'MONITOR',
        timestamp: new Date()
      });
    }

    // Risk score calculation
    let riskScore = 0;
    if (riskLevel === 'CRITICAL') riskScore = 90;
    else if (riskLevel === 'HIGH') riskScore = 70;
    else if (riskLevel === 'MEDIUM') riskScore = 40;
    else riskScore = 20;

    // Adjust for position size
    if (portfolioPercentage > 20) riskScore += 20;
    else if (portfolioPercentage > 15) riskScore += 10;

    return {
      ticker: stock.ticker,
      currentPrice,
      entryPrice,
      shares,
      stopLoss: stock.stopLoss,
      takeProfit: stock.takeProfit,
      portfolioValue: positionValue,
      portfolioPercentage,
      riskScore: Math.min(riskScore, 100),
      alerts
    };
  }

  /**
   * Analyze entire portfolio risk
   */
  async analyzePortfolioRisk(userId: string, portfolioId: string): Promise<PortfolioRisk> {
    try {
      // Get all stocks in the portfolio
      const stocks = await Portfolio.find({ userId, portfolioId });
      
      if (stocks.length === 0) {
        return {
          portfolioId,
          totalValue: 0,
          totalRisk: 0,
          positionRisks: [],
          portfolioAlerts: [],
          riskLevel: 'LOW'
        };
      }

      // Get current prices and performance data
      const tickers = stocks.map(stock => stock.ticker);
      const stockData = await stockDataService.getMultipleStockData(tickers);
      
      let totalValue = 0;
      const positionRisks: PositionRisk[] = [];

      // Calculate total portfolio value
      for (const stock of stocks) {
        const currentData = stockData.get(stock.ticker);
        if (currentData) {
          const positionValue = currentData.current * stock.shares;
          totalValue += positionValue;
        }
      }

      // Analyze each position
      for (const stock of stocks) {
        const currentData = stockData.get(stock.ticker);
        if (currentData) {
          const performanceData = {
            current: currentData.current,
            top30D: currentData.top30D,
            top60D: currentData.top60D,
            thisMonth: currentData.thisMonthPercent,
            lastMonth: currentData.lastMonthPercent
          };

          const positionRisk = await this.analyzePositionRisk(
            { ...stock, currentPrice: currentData.current },
            totalValue,
            performanceData
          );
          
          positionRisks.push(positionRisk);
        }
      }

      // Calculate portfolio-level risk
      const totalRisk = positionRisks.reduce((sum, pos) => sum + pos.riskScore * (pos.portfolioPercentage / 100), 0);
      const portfolioAlerts: RiskAlert[] = [];

      // Portfolio-level alerts
      if (totalRisk > 80) {
        portfolioAlerts.push({
          type: 'PORTFOLIO_RISK',
          severity: 'CRITICAL',
          message: `Portfolio risk level is CRITICAL (${totalRisk.toFixed(1)}%) - immediate action required`,
          portfolioId,
          action: 'REDUCE',
          timestamp: new Date()
        });
      } else if (totalRisk > 60) {
        portfolioAlerts.push({
          type: 'PORTFOLIO_RISK',
          severity: 'HIGH',
          message: `Portfolio risk level is HIGH (${totalRisk.toFixed(1)}%) - consider reducing positions`,
          portfolioId,
          action: 'MONITOR',
          timestamp: new Date()
        });
      } else if (totalRisk > 40) {
        portfolioAlerts.push({
          type: 'PORTFOLIO_RISK',
          severity: 'MEDIUM',
          message: `Portfolio risk level is MEDIUM (${totalRisk.toFixed(1)}%) - monitor closely`,
          portfolioId,
          action: 'MONITOR',
          timestamp: new Date()
        });
      }

      // Concentration risk
      const maxPosition = Math.max(...positionRisks.map(p => p.portfolioPercentage));
      if (maxPosition > 30) {
        portfolioAlerts.push({
          type: 'POSITION_SIZE',
          severity: 'HIGH',
          message: `Portfolio has ${maxPosition.toFixed(1)}% concentration in single position`,
          portfolioId,
          action: 'REDUCE',
          timestamp: new Date()
        });
      }

      // Determine overall portfolio risk level
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (totalRisk > 80 || portfolioAlerts.some(a => a.severity === 'CRITICAL')) {
        riskLevel = 'CRITICAL';
      } else if (totalRisk > 60 || portfolioAlerts.some(a => a.severity === 'HIGH')) {
        riskLevel = 'HIGH';
      } else if (totalRisk > 40 || portfolioAlerts.some(a => a.severity === 'MEDIUM')) {
        riskLevel = 'MEDIUM';
      }

      return {
        portfolioId,
        totalValue,
        totalRisk,
        positionRisks,
        portfolioAlerts,
        riskLevel
      };

    } catch (error) {
      console.error('❌ [RISK MANAGEMENT] Error analyzing portfolio risk:', error);
      throw error;
    }
  }

  /**
   * Get all risk alerts for a user across all portfolios
   */
  async getUserRiskAlerts(userId: string): Promise<RiskAlert[]> {
    try {
      // Get all unique portfolio IDs for the user
      const portfolios = await Portfolio.distinct('portfolioId', { userId });
      
      const allAlerts: RiskAlert[] = [];
      
      for (const portfolioId of portfolios) {
        const portfolioRisk = await this.analyzePortfolioRisk(userId, portfolioId);
        
        // Add position alerts
        for (const positionRisk of portfolioRisk.positionRisks) {
          allAlerts.push(...positionRisk.alerts);
        }
        
        // Add portfolio alerts
        allAlerts.push(...portfolioRisk.portfolioAlerts);
      }

      // Sort by severity and timestamp
      return allAlerts.sort((a, b) => {
        const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

    } catch (error) {
      console.error('❌ [RISK MANAGEMENT] Error getting user risk alerts:', error);
      return [];
    }
  }

  /**
   * Update portfolio decisions based on risk analysis
   */
  async updatePortfolioDecisions(userId: string): Promise<void> {
    try {
      console.log(`🔄 [RISK MANAGEMENT] Updating portfolio decisions for user ${userId}`);
      
      // Get all portfolios for the user
      const portfolios = await Portfolio.distinct('portfolioId', { userId });
      
      for (const portfolioId of portfolios) {
        const portfolioRisk = await this.analyzePortfolioRisk(userId, portfolioId);
        
        // Update each stock's decision based on risk analysis
        for (const positionRisk of portfolioRisk.positionRisks) {
          const stock = await Portfolio.findOne({
            userId,
            portfolioId,
            ticker: positionRisk.ticker
          });
          
          if (stock) {
            // Update decision based on risk analysis
            const { action, reason } = this.decideActionEnhanced(
              positionRisk.currentPrice,
              positionRisk.stopLoss,
              positionRisk.takeProfit?.toString(),
              positionRisk.entryPrice,
              {
                current: positionRisk.currentPrice,
                thisMonth: 0, // We'll get this from stock data service
                lastMonth: 0
              }
            );
            
            // Update the portfolio item with new decision
            stock.action = action as 'BUY' | 'HOLD' | 'SELL';
            stock.reason = reason;
            stock.color = action === 'SELL' ? '#ff6b6b' : action === 'BUY' ? '#58d68d' : '#fdd46e';
            
            await stock.save();
          }
        }
      }
      
      console.log(`✅ [RISK MANAGEMENT] Updated portfolio decisions for user ${userId}`);
      
    } catch (error) {
      console.error('❌ [RISK MANAGEMENT] Error updating portfolio decisions:', error);
    }
  }
}

export const riskManagementService = new RiskManagementService();
