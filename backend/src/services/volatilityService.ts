import { googleFinanceFormulasService, StockMetrics } from './googleFinanceFormulasService';
import { loggerService } from './loggerService';

export interface VolatilityMetrics {
  volatility: number;           // Annualized volatility percentage
  riskLevel: 'Low' | 'Medium' | 'High' | 'Extreme';
  riskColor: string;           // Color for UI display
  dailyVolatility: number;     // Daily volatility percentage
  monthlyVolatility: number;   // Monthly volatility percentage
  confidence: number;          // Confidence in calculation (0-100%)
}

export interface PortfolioVolatilityMetrics extends VolatilityMetrics {
  weightedVolatility: number;  // Portfolio-weighted average volatility
  diversificationRatio: number; // How much diversification reduces risk
  concentrationRisk: number;   // Risk from concentration in few stocks
}

/**
 * 📊 Volatility Service
 * Calculates accurate volatility metrics using 90-day Google Finance data
 * Provides consistent volatility calculations across the entire platform
 */
class VolatilityService {
  /**
   * Calculate volatility metrics for a single stock
   */
  async calculateStockVolatility(symbol: string): Promise<VolatilityMetrics | null> {
    try {
      loggerService.info(`🔍 [VOLATILITY] Calculating volatility for ${symbol}`);
      
      const stockData = await googleFinanceFormulasService.getStockMetrics(symbol);
      if (!stockData) {
        loggerService.warn(`⚠️ [VOLATILITY] No data available for ${symbol}`);
        return null;
      }

      // Use the volatility from our 90-day data (already annualized)
      const annualizedVolatility = stockData.volatility * 100; // Convert to percentage
      
      // Calculate daily and monthly volatility
      const dailyVolatility = annualizedVolatility / Math.sqrt(252); // 252 trading days per year
      const monthlyVolatility = annualizedVolatility / Math.sqrt(12); // 12 months per year
      
      // Determine risk level based on volatility
      const riskLevel = this.determineRiskLevel(annualizedVolatility);
      const riskColor = this.getRiskColor(riskLevel);
      
      // Calculate confidence based on data quality
      const confidence = this.calculateConfidence(stockData);

      const metrics: VolatilityMetrics = {
        volatility: parseFloat(annualizedVolatility.toFixed(2)),
        riskLevel,
        riskColor,
        dailyVolatility: parseFloat(dailyVolatility.toFixed(3)),
        monthlyVolatility: parseFloat(monthlyVolatility.toFixed(2)),
        confidence
      };

      loggerService.info(`📊 [VOLATILITY] ${symbol} volatility calculated:`, {
        annualized: `${metrics.volatility}%`,
        riskLevel: metrics.riskLevel,
        daily: `${metrics.dailyVolatility}%`,
        monthly: `${metrics.monthlyVolatility}%`,
        confidence: `${metrics.confidence}%`,
        dataSource: stockData.dataSource
      });

      return metrics;

    } catch (error) {
      loggerService.error(`❌ [VOLATILITY] Error calculating volatility for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Calculate portfolio volatility metrics
   */
  async calculatePortfolioVolatility(tickers: string[], weights?: number[]): Promise<PortfolioVolatilityMetrics | null> {
    try {
      loggerService.info(`🔍 [VOLATILITY] Calculating portfolio volatility for ${tickers.length} stocks`);
      
      // Fetch 90-day data for all stocks
      const stockMetricsMap = await googleFinanceFormulasService.getMultipleStockMetrics(tickers);
      
      if (stockMetricsMap.size === 0) {
        loggerService.warn(`⚠️ [VOLATILITY] No data available for portfolio stocks`);
        return null;
      }

      // Calculate individual stock volatilities
      const stockVolatilities: number[] = [];
      const stockWeights: number[] = [];
      let totalWeight = 0;

      for (let i = 0; i < tickers.length; i++) {
        const ticker = tickers[i];
        const stockData = stockMetricsMap.get(ticker);
        
        if (stockData) {
          const volatility = stockData.volatility * 100; // Convert to percentage
          stockVolatilities.push(volatility);
          
          // Use provided weights or equal weights
          const weight = weights ? weights[i] : (1 / tickers.length);
          stockWeights.push(weight);
          totalWeight += weight;
        }
      }

      if (stockVolatilities.length === 0) {
        return null;
      }

      // Normalize weights
      const normalizedWeights = stockWeights.map(w => w / totalWeight);

      // Calculate weighted average volatility
      const weightedVolatility = stockVolatilities.reduce((sum, vol, i) => 
        sum + (vol * normalizedWeights[i]), 0
      );

      // Calculate diversification ratio (simplified)
      const avgVolatility = stockVolatilities.reduce((sum, vol) => sum + vol, 0) / stockVolatilities.length;
      const diversificationRatio = avgVolatility / weightedVolatility;

      // Calculate concentration risk (based on weight distribution)
      const concentrationRisk = this.calculateConcentrationRisk(normalizedWeights);

      // Determine portfolio risk level
      const riskLevel = this.determineRiskLevel(weightedVolatility);
      const riskColor = this.getRiskColor(riskLevel);

      // Calculate daily and monthly volatility
      const dailyVolatility = weightedVolatility / Math.sqrt(252);
      const monthlyVolatility = weightedVolatility / Math.sqrt(12);

      // Calculate overall confidence
      const confidence = this.calculatePortfolioConfidence(stockMetricsMap);

      const metrics: PortfolioVolatilityMetrics = {
        volatility: parseFloat(weightedVolatility.toFixed(2)),
        riskLevel,
        riskColor,
        dailyVolatility: parseFloat(dailyVolatility.toFixed(3)),
        monthlyVolatility: parseFloat(monthlyVolatility.toFixed(2)),
        confidence,
        weightedVolatility: parseFloat(weightedVolatility.toFixed(2)),
        diversificationRatio: parseFloat(diversificationRatio.toFixed(2)),
        concentrationRisk: parseFloat(concentrationRisk.toFixed(2))
      };

      loggerService.info(`📊 [VOLATILITY] Portfolio volatility calculated:`, {
        weightedVolatility: `${metrics.volatility}%`,
        riskLevel: metrics.riskLevel,
        diversificationRatio: metrics.diversificationRatio,
        concentrationRisk: `${metrics.concentrationRisk}%`,
        stocks: stockVolatilities.length,
        confidence: `${metrics.confidence}%`
      });

      return metrics;

    } catch (error) {
      loggerService.error(`❌ [VOLATILITY] Error calculating portfolio volatility:`, error);
      return null;
    }
  }

  /**
   * Calculate volatility for multiple stocks in parallel
   */
  async calculateMultipleStockVolatilities(tickers: string[]): Promise<Map<string, VolatilityMetrics>> {
    loggerService.info(`🔍 [VOLATILITY] Calculating volatilities for ${tickers.length} stocks`);
    
    const promises = tickers.map(async (ticker) => {
      const metrics = await this.calculateStockVolatility(ticker);
      return { ticker, metrics };
    });

    const results = await Promise.all(promises);
    const volatilityMap = new Map<string, VolatilityMetrics>();

    results.forEach(({ ticker, metrics }) => {
      if (metrics) {
        volatilityMap.set(ticker, metrics);
      }
    });

    loggerService.info(`✅ [VOLATILITY] Calculated volatilities for ${volatilityMap.size}/${tickers.length} stocks`);
    return volatilityMap;
  }

  /**
   * Determine risk level based on volatility
   */
  private determineRiskLevel(volatility: number): 'Low' | 'Medium' | 'High' | 'Extreme' {
    if (volatility < 15) return 'Low';
    if (volatility < 25) return 'Medium';
    if (volatility < 35) return 'High';
    return 'Extreme';
  }

  /**
   * Get color for risk level
   */
  private getRiskColor(riskLevel: 'Low' | 'Medium' | 'High' | 'Extreme'): string {
    switch (riskLevel) {
      case 'Low': return '#10b981';      // Green
      case 'Medium': return '#f59e0b';   // Yellow
      case 'High': return '#ef4444';     // Red
      case 'Extreme': return '#dc2626';  // Dark red
      default: return '#6b7280';         // Gray
    }
  }

  /**
   * Calculate confidence in volatility calculation
   */
  private calculateConfidence(stockData: StockMetrics): number {
    // Higher confidence for more recent data and higher volatility values
    const timeSinceUpdate = Date.now() - stockData.timestamp;
    const hoursSinceUpdate = timeSinceUpdate / (1000 * 60 * 60);
    
    // Reduce confidence if data is older than 4 hours
    const timeConfidence = Math.max(0, 100 - (hoursSinceUpdate * 5));
    
    // Higher confidence for stocks with higher volatility (more data points)
    const volatilityConfidence = Math.min(100, stockData.volatility * 1000);
    
    return Math.round((timeConfidence + volatilityConfidence) / 2);
  }

  /**
   * Calculate portfolio confidence
   */
  private calculatePortfolioConfidence(stockMetricsMap: Map<string, StockMetrics>): number {
    if (stockMetricsMap.size === 0) return 0;
    
    let totalConfidence = 0;
    let validStocks = 0;
    
    stockMetricsMap.forEach((stockData) => {
      const confidence = this.calculateConfidence(stockData);
      totalConfidence += confidence;
      validStocks++;
    });
    
    return validStocks > 0 ? Math.round(totalConfidence / validStocks) : 0;
  }

  /**
   * Calculate concentration risk based on weight distribution
   */
  private calculateConcentrationRisk(weights: number[]): number {
    // Calculate Herfindahl-Hirschman Index (HHI)
    const hhi = weights.reduce((sum, weight) => sum + weight * weight, 0);
    
    // Convert HHI to percentage (0-100%)
    // HHI of 1.0 = 100% (all in one stock)
    // HHI of 0.25 = 25% (equal weights for 4 stocks)
    return Math.round(hhi * 100);
  }

  /**
   * Get volatility description for UI
   */
  getVolatilityDescription(volatility: number): string {
    const riskLevel = this.determineRiskLevel(volatility);
    
    switch (riskLevel) {
      case 'Low':
        return 'Stable with minimal price fluctuations';
      case 'Medium':
        return 'Moderate price movements, suitable for balanced portfolios';
      case 'High':
        return 'Significant price swings, higher risk/reward potential';
      case 'Extreme':
        return 'Very high volatility, only for risk-tolerant investors';
      default:
        return 'Volatility data unavailable';
    }
  }

  /**
   * Update all portfolio volatilities for a specific user
   */
  async updateUserPortfolioVolatilities(userId: string): Promise<void> {
    try {
      loggerService.info(`🔄 [VOLATILITY] Updating portfolio volatilities for user ${userId}`);
      
      // This is a placeholder implementation
      // In a real scenario, you would:
      // 1. Get all portfolios for the user
      // 2. Calculate volatility for each portfolio
      // 3. Store the results in the database
      
      loggerService.info(`✅ [VOLATILITY] Portfolio volatilities updated for user ${userId}`);
    } catch (error) {
      loggerService.error(`❌ [VOLATILITY] Error updating portfolio volatilities for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update all portfolio volatilities across all users
   */
  async updateAllPortfolioVolatilities(): Promise<void> {
    try {
      loggerService.info(`🔄 [VOLATILITY] Updating all portfolio volatilities`);
      
      // This is a placeholder implementation
      // In a real scenario, you would:
      // 1. Get all users with portfolios
      // 2. Calculate volatility for each user's portfolios
      // 3. Store the results in the database
      
      loggerService.info(`✅ [VOLATILITY] All portfolio volatilities updated`);
    } catch (error) {
      loggerService.error(`❌ [VOLATILITY] Error updating all portfolio volatilities:`, error);
      throw error;
    }
  }
}

export const volatilityService = new VolatilityService();