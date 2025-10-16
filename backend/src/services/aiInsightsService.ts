import { IPortfolio } from '../models/Portfolio';
import { IUser } from '../models/User';
import { stockDataService } from './stockDataService';
import { loggerService } from './loggerService';

interface AIInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'optimization' | 'trend' | 'risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  ticker?: string;
  confidence: number;
  potentialImpact: {
    value: number;
    percentage: number;
  };
  actionItems: string[];
  relatedMetrics: {
    [key: string]: number;
  };
  timestamp: Date;
}

interface PortfolioAnalysis {
  overallScore: number;
  diversificationScore: number;
  riskScore: number;
  performanceScore: number;
  insights: AIInsight[];
  recommendations: string[];
  predictedPerformance: {
    nextWeek: number;
    nextMonth: number;
    nextQuarter: number;
  };
}

class AIInsightsService {
  /**
   * Generate AI-powered insights for a user's portfolio
   */
  async generatePortfolioInsights(
    userId: string,
    portfolio: IPortfolio[]
  ): Promise<PortfolioAnalysis> {
    try {
      loggerService.info(`🤖 [AI INSIGHTS] Generating insights for user ${userId}`);

      const insights: AIInsight[] = [];

      // 1. Concentration Risk Analysis
      const concentrationInsights = await this.analyzeConcentrationRisk(portfolio);
      insights.push(...concentrationInsights);

      // 2. Sector Diversification Analysis
      const diversificationInsights = await this.analyzeDiversification(portfolio);
      insights.push(...diversificationInsights);

      // 3. Performance Trend Analysis
      const performanceInsights = await this.analyzePerformanceTrends(portfolio);
      insights.push(...performanceInsights);

      // 4. Risk-Reward Analysis
      const riskInsights = await this.analyzeRiskReward(portfolio);
      insights.push(...riskInsights);

      // 5. Stop Loss & Take Profit Optimization
      const stopLossInsights = await this.analyzeStopLossTakeProfit(portfolio);
      insights.push(...stopLossInsights);

      // 6. Market Correlation Analysis
      const correlationInsights = await this.analyzeCorrelations(portfolio);
      insights.push(...correlationInsights);

      // Calculate scores
      const overallScore = this.calculateOverallScore(portfolio, insights);
      const diversificationScore = this.calculateDiversificationScore(portfolio);
      const riskScore = this.calculateRiskScore(portfolio, insights);
      const performanceScore = this.calculatePerformanceScore(portfolio);

      // Generate recommendations
      const recommendations = this.generateRecommendations(insights);

      // Predict future performance
      const predictedPerformance = await this.predictPerformance(portfolio);

      loggerService.info(`🤖 [AI INSIGHTS] Generated ${insights.length} insights for user ${userId}`);

      return {
        overallScore,
        diversificationScore,
        riskScore,
        performanceScore,
        insights: insights.sort((a, b) => b.confidence - a.confidence),
        recommendations,
        predictedPerformance,
      };
    } catch (error: any) {
      loggerService.error(`🤖 [AI INSIGHTS] Error generating insights: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze concentration risk
   */
  private async analyzeConcentrationRisk(portfolio: IPortfolio[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Calculate total portfolio value
    const totalValue = portfolio.reduce(
      (sum, item) => sum + item.shares * item.currentPrice,
      0
    );

    // Check for over-concentration in single stocks
    for (const item of portfolio) {
      const itemValue = item.shares * item.currentPrice;
      const concentration = (itemValue / totalValue) * 100;

      if (concentration > 25) {
        insights.push({
          id: `concentration-${item.ticker}`,
          type: 'warning',
          severity: concentration > 40 ? 'critical' : 'high',
          title: `High Concentration in ${item.ticker}`,
          description: `${item.ticker} represents ${concentration.toFixed(1)}% of your portfolio, which is above the recommended 25% threshold.`,
          recommendation: `Consider reducing your position in ${item.ticker} and diversifying into other assets to minimize single-stock risk.`,
          ticker: item.ticker,
          confidence: 0.92,
          potentialImpact: {
            value: itemValue * 0.1,
            percentage: 10,
          },
          actionItems: [
            `Sell 20-30% of ${item.ticker} position`,
            'Diversify into 2-3 different sectors',
            'Set up trailing stop loss to protect gains',
          ],
          relatedMetrics: {
            currentConcentration: concentration,
            recommendedMax: 25,
            excessExposure: concentration - 25,
          },
          timestamp: new Date(),
        });
      }
    }

    return insights;
  }

  /**
   * Analyze sector diversification
   */
  private async analyzeDiversification(portfolio: IPortfolio[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Get sector allocation
    const sectorAllocation: { [sector: string]: number } = {};
    const totalValue = portfolio.reduce(
      (sum, item) => sum + item.shares * item.currentPrice,
      0
    );

    for (const item of portfolio) {
      // In a real implementation, you would fetch sector data from an API
      // For now, we'll use a simplified approach
      const sector = 'Technology'; // Placeholder
      const value = item.shares * item.currentPrice;

      if (!sectorAllocation[sector]) {
        sectorAllocation[sector] = 0;
      }
      sectorAllocation[sector] += value;
    }

    // Check for sector concentration
    for (const [sector, value] of Object.entries(sectorAllocation)) {
      const percentage = (value / totalValue) * 100;

      if (percentage > 40) {
        insights.push({
          id: `sector-concentration-${sector}`,
          type: 'warning',
          severity: 'medium',
          title: `High Sector Concentration in ${sector}`,
          description: `${sector} sector represents ${percentage.toFixed(1)}% of your portfolio.`,
          recommendation: `Diversify into other sectors like Healthcare, Finance, or Consumer Goods to reduce sector-specific risk.`,
          confidence: 0.88,
          potentialImpact: {
            value: value * 0.15,
            percentage: 15,
          },
          actionItems: [
            'Research opportunities in underrepresented sectors',
            'Consider ETFs for broad sector exposure',
            'Rebalance quarterly to maintain diversification',
          ],
          relatedMetrics: {
            sectorPercentage: percentage,
            recommendedMax: 40,
            sectorsInPortfolio: Object.keys(sectorAllocation).length,
            recommendedMinSectors: 5,
          },
          timestamp: new Date(),
        });
      }
    }

    // Check for insufficient diversification
    if (Object.keys(sectorAllocation).length < 3) {
      insights.push({
        id: 'insufficient-diversification',
        type: 'optimization',
        severity: 'medium',
        title: 'Limited Portfolio Diversification',
        description: `Your portfolio is spread across only ${Object.keys(sectorAllocation).length} sector(s).`,
        recommendation: 'Aim for exposure to at least 5 different sectors to reduce overall portfolio risk.',
        confidence: 0.90,
        potentialImpact: {
          value: totalValue * 0.1,
          percentage: 10,
        },
        actionItems: [
          'Add positions in Healthcare and Energy sectors',
          'Consider international exposure',
          'Use sector rotation strategy',
        ],
        relatedMetrics: {
          currentSectors: Object.keys(sectorAllocation).length,
          recommendedMinSectors: 5,
        },
        timestamp: new Date(),
      });
    }

    return insights;
  }

  /**
   * Analyze performance trends
   */
  private async analyzePerformanceTrends(portfolio: IPortfolio[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    for (const item of portfolio) {
      const pnl = item.shares * (item.currentPrice - item.entryPrice);
      const pnlPercent = ((item.currentPrice - item.entryPrice) / item.entryPrice) * 100;

      // Detect strong performers
      if (pnlPercent > 20) {
        insights.push({
          id: `strong-performer-${item.ticker}`,
          type: 'opportunity',
          severity: 'low',
          title: `${item.ticker} Strong Performance`,
          description: `${item.ticker} has gained ${pnlPercent.toFixed(1)}% since purchase.`,
          recommendation: 'Consider taking partial profits or setting a trailing stop loss to protect gains.',
          ticker: item.ticker,
          confidence: 0.85,
          potentialImpact: {
            value: pnl * 0.3,
            percentage: pnlPercent * 0.3,
          },
          actionItems: [
            'Set trailing stop loss at 15% below current price',
            'Take 25-30% profit to lock in gains',
            'Reassess position size based on current valuation',
          ],
          relatedMetrics: {
            currentGain: pnlPercent,
            unrealizedProfit: pnl,
            suggestedProfitTaking: pnl * 0.3,
          },
          timestamp: new Date(),
        });
      }

      // Detect underperformers
      if (pnlPercent < -15) {
        insights.push({
          id: `underperformer-${item.ticker}`,
          type: 'warning',
          severity: pnlPercent < -25 ? 'high' : 'medium',
          title: `${item.ticker} Underperforming`,
          description: `${item.ticker} is down ${Math.abs(pnlPercent).toFixed(1)}% from your entry price.`,
          recommendation: 'Review the investment thesis. Consider cutting losses if fundamentals have deteriorated.',
          ticker: item.ticker,
          confidence: 0.78,
          potentialImpact: {
            value: Math.abs(pnl),
            percentage: Math.abs(pnlPercent),
          },
          actionItems: [
            'Reassess company fundamentals',
            'Check if stop loss should be tightened',
            'Consider tax-loss harvesting opportunity',
          ],
          relatedMetrics: {
            currentLoss: pnlPercent,
            unrealizedLoss: Math.abs(pnl),
          },
          timestamp: new Date(),
        });
      }
    }

    return insights;
  }

  /**
   * Analyze risk-reward ratios
   */
  private async analyzeRiskReward(portfolio: IPortfolio[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    for (const item of portfolio) {
      if (!item.stopLoss || !item.takeProfit) {
        insights.push({
          id: `missing-risk-management-${item.ticker}`,
          type: 'risk',
          severity: 'medium',
          title: `Missing Risk Management for ${item.ticker}`,
          description: `${item.ticker} does not have ${!item.stopLoss ? 'stop loss' : 'take profit'} set.`,
          recommendation: 'Set stop loss and take profit levels to manage risk effectively.',
          ticker: item.ticker,
          confidence: 0.95,
          potentialImpact: {
            value: item.shares * item.currentPrice * 0.2,
            percentage: 20,
          },
          actionItems: [
            `Set stop loss at ${(item.currentPrice * 0.85).toFixed(2)} (15% below current price)`,
            `Set take profit at ${(item.currentPrice * 1.25).toFixed(2)} (25% above current price)`,
            'Review and adjust levels weekly',
          ],
          relatedMetrics: {
            currentPrice: item.currentPrice,
            suggestedStopLoss: item.currentPrice * 0.85,
            suggestedTakeProfit: item.currentPrice * 1.25,
          },
          timestamp: new Date(),
        });
      } else {
        // Calculate risk-reward ratio
        const potentialLoss = item.currentPrice - item.stopLoss;
        const potentialGain = item.takeProfit - item.currentPrice;
        const riskRewardRatio = potentialGain / potentialLoss;

        if (riskRewardRatio < 1.5) {
          insights.push({
            id: `poor-risk-reward-${item.ticker}`,
            type: 'optimization',
            severity: 'low',
            title: `Suboptimal Risk-Reward for ${item.ticker}`,
            description: `${item.ticker} has a risk-reward ratio of ${riskRewardRatio.toFixed(2)}:1, which is below the recommended 2:1.`,
            recommendation: 'Adjust your take profit level higher or stop loss tighter to improve risk-reward ratio.',
            ticker: item.ticker,
            confidence: 0.82,
            potentialImpact: {
              value: item.shares * potentialGain,
              percentage: (potentialGain / item.currentPrice) * 100,
            },
            actionItems: [
              `Increase take profit to ${(item.currentPrice + potentialLoss * 2).toFixed(2)}`,
              'Consider exiting if fundamentals don\'t support higher targets',
            ],
            relatedMetrics: {
              currentRiskReward: riskRewardRatio,
              recommendedMinRiskReward: 2,
              potentialLoss,
              potentialGain,
            },
            timestamp: new Date(),
          });
        }
      }
    }

    return insights;
  }

  /**
   * Analyze stop loss and take profit levels
   */
  private async analyzeStopLossTakeProfit(portfolio: IPortfolio[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    for (const item of portfolio) {
      if (item.stopLoss) {
        const stopLossDistance = ((item.currentPrice - item.stopLoss) / item.currentPrice) * 100;

        // Stop loss too close
        if (stopLossDistance < 5) {
          insights.push({
            id: `tight-stop-loss-${item.ticker}`,
            type: 'warning',
            severity: 'low',
            title: `Tight Stop Loss on ${item.ticker}`,
            description: `Stop loss is only ${stopLossDistance.toFixed(1)}% below current price, which may trigger prematurely.`,
            recommendation: 'Consider widening stop loss to allow for normal price volatility.',
            ticker: item.ticker,
            confidence: 0.75,
            potentialImpact: {
              value: item.shares * item.currentPrice * 0.05,
              percentage: 5,
            },
            actionItems: [
              `Widen stop loss to ${(item.currentPrice * 0.9).toFixed(2)} (10% below)`,
              'Monitor volatility before adjusting',
            ],
            relatedMetrics: {
              currentStopLoss: item.stopLoss,
              stopLossDistance,
              recommendedMinDistance: 10,
            },
            timestamp: new Date(),
          });
        }

        // Stop loss too far
        if (stopLossDistance > 25) {
          insights.push({
            id: `wide-stop-loss-${item.ticker}`,
            type: 'risk',
            severity: 'medium',
            title: `Wide Stop Loss on ${item.ticker}`,
            description: `Stop loss is ${stopLossDistance.toFixed(1)}% below current price, exposing you to significant downside risk.`,
            recommendation: 'Tighten stop loss to protect your capital more effectively.',
            ticker: item.ticker,
            confidence: 0.80,
            potentialImpact: {
              value: item.shares * (item.currentPrice - item.stopLoss),
              percentage: stopLossDistance,
            },
            actionItems: [
              `Tighten stop loss to ${(item.currentPrice * 0.85).toFixed(2)} (15% below)`,
              'Use trailing stop loss instead',
            ],
            relatedMetrics: {
              currentStopLoss: item.stopLoss,
              stopLossDistance,
              recommendedMaxDistance: 20,
            },
            timestamp: new Date(),
          });
        }
      }
    }

    return insights;
  }

  /**
   * Analyze correlations between portfolio positions
   */
  private async analyzeCorrelations(portfolio: IPortfolio[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Simplified correlation analysis
    // In a real implementation, you would calculate actual correlation coefficients
    if (portfolio.length > 10) {
      insights.push({
        id: 'high-position-count',
        type: 'optimization',
        severity: 'low',
        title: 'High Number of Positions',
        description: `You have ${portfolio.length} positions, which may be difficult to monitor effectively.`,
        recommendation: 'Consider consolidating into 8-12 high-conviction positions for better focus and management.',
        confidence: 0.70,
        potentialImpact: {
          value: 0,
          percentage: 0,
        },
        actionItems: [
          'Identify and exit low-conviction positions',
          'Focus on top performers and best opportunities',
          'Simplify portfolio for easier management',
        ],
        relatedMetrics: {
          currentPositions: portfolio.length,
          recommendedMaxPositions: 12,
        },
        timestamp: new Date(),
      });
    }

    return insights;
  }

  /**
   * Calculate overall portfolio score
   */
  private calculateOverallScore(portfolio: IPortfolio[], insights: AIInsight[]): number {
    // Base score starts at 100
    let score = 100;

    // Deduct points for critical and high severity issues
    const criticalIssues = insights.filter(i => i.severity === 'critical').length;
    const highIssues = insights.filter(i => i.severity === 'high').length;
    const mediumIssues = insights.filter(i => i.severity === 'medium').length;

    score -= criticalIssues * 15;
    score -= highIssues * 10;
    score -= mediumIssues * 5;

    // Add points for opportunities
    const opportunities = insights.filter(i => i.type === 'opportunity').length;
    score += opportunities * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate diversification score
   */
  private calculateDiversificationScore(portfolio: IPortfolio[]): number {
    const totalValue = portfolio.reduce(
      (sum, item) => sum + item.shares * item.currentPrice,
      0
    );

    // Check concentration
    const maxConcentration = Math.max(
      ...portfolio.map(item => (item.shares * item.currentPrice) / totalValue * 100)
    );

    let score = 100;

    if (maxConcentration > 40) score -= 30;
    else if (maxConcentration > 25) score -= 15;

    if (portfolio.length < 5) score -= 20;
    else if (portfolio.length > 15) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(portfolio: IPortfolio[], insights: AIInsight[]): number {
    let score = 100;

    const riskInsights = insights.filter(i => i.type === 'risk' || i.type === 'warning');
    score -= riskInsights.length * 8;

    // Check for missing stop losses
    const missingStopLoss = portfolio.filter(item => !item.stopLoss).length;
    score -= missingStopLoss * 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(portfolio: IPortfolio[]): number {
    const totalValue = portfolio.reduce(
      (sum, item) => sum + item.shares * item.currentPrice,
      0
    );
    const totalCost = portfolio.reduce(
      (sum, item) => sum + item.shares * item.entryPrice,
      0
    );

    const overallReturn = ((totalValue - totalCost) / totalCost) * 100;

    // Score based on return
    if (overallReturn > 20) return 100;
    if (overallReturn > 10) return 80;
    if (overallReturn > 0) return 60;
    if (overallReturn > -10) return 40;
    return 20;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(insights: AIInsight[]): string[] {
    const recommendations: string[] = [];

    // Get top 5 most important insights
    const topInsights = insights
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 5);

    for (const insight of topInsights) {
      recommendations.push(insight.recommendation);
    }

    return recommendations;
  }

  /**
   * Predict future performance using simple ML
   */
  private async predictPerformance(portfolio: IPortfolio[]): Promise<{
    nextWeek: number;
    nextMonth: number;
    nextQuarter: number;
  }> {
    // Simplified prediction based on current trends
    const totalValue = portfolio.reduce(
      (sum, item) => sum + item.shares * item.currentPrice,
      0
    );
    const totalCost = portfolio.reduce(
      (sum, item) => sum + item.shares * item.entryPrice,
      0
    );

    const currentReturn = ((totalValue - totalCost) / totalCost) * 100;

    // Simple linear extrapolation (in reality, you'd use ML models)
    return {
      nextWeek: currentReturn * 1.02,
      nextMonth: currentReturn * 1.08,
      nextQuarter: currentReturn * 1.2,
    };
  }
}

export const aiInsightsService = new AIInsightsService();
export { AIInsight, PortfolioAnalysis };
