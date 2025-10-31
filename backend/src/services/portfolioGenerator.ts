import { decisionEngine } from './decisionEngine';
import { stockDataService } from './stockDataService';
import { volatilityService } from './volatilityService';
import { googleFinanceFormulasService } from './googleFinanceFormulasService';
import User from '../models/User';
import Portfolio from '../models/Portfolio';
import { loggerService } from './loggerService';

interface StockData {
  symbol: string;
  current: number;
  top30D: number;
  top60D: number;
  thisMonthPercent: number;
  lastMonthPercent: number;
  volatility: number;
  marketCap: number;
}

interface GeneratedStock {
  ticker: string;
  shares: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  allocation: number; // percentage of total capital
  riskScore: number;
  action?: string;
  reason?: string;
  color?: string;
}

export class PortfolioGenerator {
  private stockDatabase: StockData[] = [];

  constructor() {
    // Initialize with empty database, will be populated when first used
    this.stockDatabase = [];
  }

  private async initializeStockDatabase() {
    try {
      console.log('⚡ [PORTFOLIO GENERATOR] SKIPPING massive database fetch - will fetch data only for selected stocks');
      // Load mock data as backup only
      this.loadMockData();
    } catch (error) {
      console.error('❌ [PORTFOLIO GENERATOR] Error:', error);
      this.loadMockData();
    }
  }

  private loadMockData() {
    // Mock stock database with real-world data
    this.stockDatabase = [
      // Solid stocks (low volatility, stable growth)
      { symbol: 'AAPL', current: 150, top30D: 160, top60D: 155, thisMonthPercent: 5.2, lastMonthPercent: 3.1, volatility: 0.15, marketCap: 2500000000000 },
      { symbol: 'MSFT', current: 420, top30D: 440, top60D: 430, thisMonthPercent: 8.5, lastMonthPercent: 4.2, volatility: 0.18, marketCap: 3100000000000 },
      { symbol: 'GOOGL', current: 2800, top30D: 2900, top60D: 2850, thisMonthPercent: 2.1, lastMonthPercent: -1.2, volatility: 0.22, marketCap: 1800000000000 },
      { symbol: 'JNJ', current: 160, top30D: 165, top60D: 162, thisMonthPercent: 1.5, lastMonthPercent: 2.1, volatility: 0.12, marketCap: 420000000000 },
      { symbol: 'PG', current: 155, top30D: 158, top60D: 156, thisMonthPercent: 0.8, lastMonthPercent: 1.5, volatility: 0.10, marketCap: 380000000000 },
      { symbol: 'KO', current: 60, top30D: 62, top60D: 61, thisMonthPercent: 1.2, lastMonthPercent: 0.8, volatility: 0.08, marketCap: 260000000000 },

      // Risky stocks (high volatility, growth potential)
      { symbol: 'TSLA', current: 250, top30D: 280, top60D: 260, thisMonthPercent: -5.2, lastMonthPercent: 12.3, volatility: 0.45, marketCap: 800000000000 },
      { symbol: 'NVDA', current: 450, top30D: 480, top60D: 460, thisMonthPercent: 15.2, lastMonthPercent: 8.7, volatility: 0.38, marketCap: 1100000000000 },
      { symbol: 'AMD', current: 120, top30D: 135, top60D: 125, thisMonthPercent: 8.9, lastMonthPercent: -2.1, volatility: 0.42, marketCap: 190000000000 },
      { symbol: 'PLTR', current: 15, top30D: 18, top60D: 16, thisMonthPercent: 12.5, lastMonthPercent: -8.2, volatility: 0.55, marketCap: 30000000000 },
      { symbol: 'ARKK', current: 45, top30D: 50, top60D: 47, thisMonthPercent: 6.8, lastMonthPercent: 15.2, volatility: 0.48, marketCap: 8000000000 },
      { symbol: 'GME', current: 20, top30D: 25, top60D: 22, thisMonthPercent: -10.5, lastMonthPercent: 25.8, volatility: 0.65, marketCap: 6000000000 },
    ];
  }

  /**
   * 🎯 יצירת תיק השקעות לפי סוג (סולידי / מסוכן)
   */
  async generateAndSavePortfolio(
    userId: string,
    portfolioType: 'solid' | 'risky',
    totalCapital: number,
    riskTolerance: number = 7
  ): Promise<GeneratedStock[]> {
    const generatedPortfolio = await this.generatePortfolio(portfolioType, totalCapital, riskTolerance);
    const enhanced = await this.validateAndEnhancePortfolio(generatedPortfolio);

    // מחיקת תיק ישן ושמירת חדש
    await Portfolio.deleteMany({ userId });
    const portfolioDocs = enhanced.map((item) => ({
      userId,
      ticker: item.ticker,
      shares: item.shares,
      entryPrice: item.entryPrice,
      currentPrice: item.currentPrice,
      stopLoss: item.stopLoss,
      takeProfit: item.takeProfit,
      action: item.action,
      reason: item.reason,
      color: item.color,
    }));
    await Portfolio.insertMany(portfolioDocs);

    // ✅ סימון השלמת Onboarding
    await User.findByIdAndUpdate(userId, {
      onboardingCompleted: true,
      portfolioType,
      portfolioSource: 'ai-generated',
    });

    return enhanced;
  }

  /**
   * 🎯 Enhanced stock selection using real-time volatility data
   */
  private async selectStocksWithVolatility(portfolioType: 'solid' | 'risky'): Promise<StockData[]> {
    loggerService.info(`🔍 [PORTFOLIO GENERATOR] Selecting ${portfolioType} stocks with real-time volatility data`);
    
    let candidateStocks: string[] = [];
    
    if (portfolioType === 'solid') {
      // For solid portfolio, use predefined solid stocks
      candidateStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'JNJ', 'PG', 'KO', 'PFE', 'WMT', 'JPM', 'V', 'MA', 'UNH', 'HD', 'DIS', 'NFLX', 'ADBE', 'CRM', 'ORCL', 'IBM', 'CSCO', 'INTC', 'T', 'VZ', 'XOM', 'CVX', 'BAC', 'WFC', 'GS', 'AXP'];
    } else {
      // For risky portfolio, use predefined risky stocks
      candidateStocks = ['TSLA', 'NVDA', 'AMD', 'PLTR', 'ARKK', 'GME', 'AMC', 'BB', 'NOK', 'SPCE', 'RKT', 'CLOV', 'WISH', 'SOFI', 'HOOD', 'COIN', 'RBLX', 'SNOW', 'DDOG', 'ZM', 'PTON', 'ROKU', 'SQ', 'PYPL', 'SHOP', 'MELI', 'SE', 'BABA', 'JD'];
    }
    
    // SMART PRE-SELECTION: Only fetch data for 12 stocks (we'll pick 6 from them)
    // Shuffle candidates and pick 12 randomly to reduce API calls
    const shuffledCandidates = candidateStocks.sort(() => Math.random() - 0.5);
    const stocksToFetch = shuffledCandidates.slice(0, 12);
    
    loggerService.info(`⚡ [PORTFOLIO GENERATOR] Fetching real data for ${stocksToFetch.length} pre-selected stocks (out of ${candidateStocks.length} candidates)`);
    
    const volatilityMap = await volatilityService.calculateMultipleStockVolatilities(stocksToFetch);
    const stockMetricsMap = await googleFinanceFormulasService.getMultipleStockMetrics(stocksToFetch);
    
    // Filter stocks based on volatility and risk level
    const filteredStocks: Array<{symbol: string, volatility: number, riskLevel: string, metrics: any}> = [];
    
    for (const symbol of stocksToFetch) {
      const volatilityMetrics = volatilityMap.get(symbol);
      const stockMetrics = stockMetricsMap.get(symbol);
      
      if (volatilityMetrics && stockMetrics) {
        const isSolidCandidate = portfolioType === 'solid' && 
          (volatilityMetrics.riskLevel === 'Low' || volatilityMetrics.riskLevel === 'Medium');
        const isRiskyCandidate = portfolioType === 'risky' && 
          (volatilityMetrics.riskLevel === 'High' || volatilityMetrics.riskLevel === 'Extreme');
          
        if (isSolidCandidate || isRiskyCandidate) {
          filteredStocks.push({
            symbol,
            volatility: volatilityMetrics.volatility,
            riskLevel: volatilityMetrics.riskLevel,
            metrics: stockMetrics
          });
        }
      }
    }
    
    loggerService.info(`📊 [PORTFOLIO GENERATOR] Got ${filteredStocks.length} valid ${portfolioType} stocks with real data`);
    
    if (filteredStocks.length === 0) {
      loggerService.warn(`⚠️ [PORTFOLIO GENERATOR] No valid ${portfolioType} stocks found after filtering - volatility/metrics services may have failed`);
      return [];
    }
    
    // Sort by performance (thisMonthPercent) and select top performers
    loggerService.info(`📊 [PORTFOLIO GENERATOR] Sorting ${filteredStocks.length} stocks by this month's performance...`);
    const sortedStocks = filteredStocks
      .sort((a, b) => b.metrics.thisMonthPercent - a.metrics.thisMonthPercent);
    
    loggerService.info(`📊 [PORTFOLIO GENERATOR] Top performers: ${sortedStocks.slice(0, 3).map(s => `${s.symbol} (${s.metrics.thisMonthPercent.toFixed(2)}%)`).join(', ')}`);
    
    // Take top 8 to ensure we have enough, then randomly select 6
    const topCount = Math.min(8, sortedStocks.length);
    const topStocks = sortedStocks.slice(0, topCount);
    loggerService.info(`📊 [PORTFOLIO GENERATOR] Taking top ${topCount} performers, shuffling for variety...`);
    const shuffled = topStocks.sort(() => Math.random() - 0.5);
    
    // Convert to StockData format
    const selectedCount = Math.min(6, shuffled.length);
    const selectedStocks: StockData[] = shuffled.slice(0, selectedCount).map(stock => ({
      symbol: stock.symbol,
      current: stock.metrics.current,
      top30D: stock.metrics.top30D,
      top60D: stock.metrics.top60D,
      thisMonthPercent: stock.metrics.thisMonthPercent,
      lastMonthPercent: stock.metrics.lastMonthPercent,
      volatility: stock.volatility / 100, // Convert percentage to decimal
      marketCap: stock.metrics.marketCap
    }));
    
    loggerService.info(`✅ [PORTFOLIO GENERATOR] Final selection: ${selectedCount} ${portfolioType} stocks:`, 
      selectedStocks.map(s => `${s.symbol} (vol: ${(s.volatility * 100).toFixed(1)}%, perf: ${s.thisMonthPercent.toFixed(2)}%)`));
    
    return selectedStocks;
  }

  /**
   * 🧠 Legacy stock selection (fallback method)
   */
  private selectStocks(portfolioType: 'solid' | 'risky'): StockData[] {
    let filteredStocks: StockData[];
    
    if (portfolioType === 'solid') {
      // For solid portfolio, use predefined solid stocks or filter by criteria
      const solidStockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'JNJ', 'PG', 'KO', 'PFE', 'WMT', 'JPM', 'V', 'MA', 'UNH', 'HD', 'DIS', 'NFLX', 'ADBE', 'CRM', 'ORCL', 'IBM', 'CSCO', 'INTC', 'T', 'VZ', 'XOM', 'CVX', 'BAC', 'WFC', 'GS', 'AXP'];
      
      filteredStocks = this.stockDatabase.filter((s) => 
        solidStockSymbols.includes(s.symbol) && 
        s.marketCap > 100000000000 // At least 100B market cap
      );
      
      // If no predefined stocks found, fall back to volatility filter
      if (filteredStocks.length === 0) {
        filteredStocks = this.stockDatabase.filter((s) => s.volatility < 0.25 && s.marketCap > 100000000000);
      }
    } else {
      // For risky portfolio, use predefined risky stocks or filter by criteria
      const riskyStockSymbols = ['TSLA', 'NVDA', 'AMD', 'PLTR', 'ARKK', 'GME', 'AMC', 'BB', 'NOK', 'SPCE', 'RKT', 'CLOV', 'WISH', 'SOFI', 'HOOD', 'COIN', 'RBLX', 'SNOW', 'DDOG', 'ZM', 'PTON', 'PELOTON', 'ROKU', 'SQ', 'PYPL', 'SHOP', 'MELI', 'SE', 'BABA', 'JD'];
      
      filteredStocks = this.stockDatabase.filter((s) => 
        riskyStockSymbols.includes(s.symbol)
      );
      
      // If no predefined stocks found, fall back to volatility filter
      if (filteredStocks.length === 0) {
        filteredStocks = this.stockDatabase.filter((s) => s.volatility > 0.30);
      }
    }

    // Sort by performance and add some randomness
    const sortedStocks = filteredStocks
      .sort((a, b) => b.thisMonthPercent - a.thisMonthPercent);

    // Add randomness: take top 10-15 stocks and randomly select 6
    const topStocks = sortedStocks.slice(0, Math.min(15, sortedStocks.length));
    
    // Shuffle and take 6
    const shuffled = topStocks.sort(() => Math.random() - 0.5);
    
    console.log(`🔍 [PORTFOLIO GENERATOR] Selected ${portfolioType} stocks:`, shuffled.slice(0, 6).map(s => s.symbol));
    
    return shuffled.slice(0, 6);
  }

  /**
   * 💰 חישוב תיק לפי הקצאות
   */
  private calculateAllocations(stocks: StockData[], portfolioType: 'solid' | 'risky'): number[] {
    const numStocks = stocks.length;
    const baseAllocation = 100 / numStocks;

    if (portfolioType === 'solid') {
      return stocks.map(() => baseAllocation);
    } else {
      const totalVolatility = stocks.reduce((sum, s) => sum + s.volatility, 0);
      return stocks.map((s) => (s.volatility / totalVolatility) * 100);
    }
  }

  /**
   * 📈 Enhanced portfolio generation with real-time volatility data
   */
  async generatePortfolio(portfolioType: 'solid' | 'risky', totalCapital: number, riskTolerance: number = 7): Promise<GeneratedStock[]> {
    loggerService.info(`🚀 [PORTFOLIO GENERATOR] Starting portfolio generation for ${portfolioType} portfolio with $${totalCapital} capital`);
    loggerService.info(`📊 [PORTFOLIO GENERATOR] Risk tolerance: ${riskTolerance}`);
    
    try {
      // Try to use real-time volatility data first
      loggerService.info(`🔍 [PORTFOLIO GENERATOR] Step 1: Selecting stocks with real-time volatility data...`);
      const stocks = await this.selectStocksWithVolatility(portfolioType);
      loggerService.info(`✅ [PORTFOLIO GENERATOR] Selected ${stocks.length} stocks with volatility data`);
      
      if (stocks.length === 0) {
        loggerService.warn(`⚠️ [PORTFOLIO GENERATOR] No stocks found with volatility data, falling back to legacy method`);
        // Fallback to legacy method
        if (this.stockDatabase.length === 0) {
          await this.initializeStockDatabase();
        }
        const fallbackStocks = this.selectStocks(portfolioType);
        loggerService.info(`📊 [PORTFOLIO GENERATOR] Fallback: Using ${fallbackStocks.length} stocks from legacy method`);
        const result = await this.generateFromStocks(fallbackStocks, portfolioType, totalCapital, riskTolerance);
        loggerService.info(`✅ [PORTFOLIO GENERATOR] Generated ${result.length} portfolio items using fallback method`);
        return result;
      }
      
      loggerService.info(`📊 [PORTFOLIO GENERATOR] Step 2: Generating portfolio from ${stocks.length} selected stocks...`);
      const result = await this.generateFromStocks(stocks, portfolioType, totalCapital, riskTolerance);
      loggerService.info(`✅ [PORTFOLIO GENERATOR] Successfully generated ${result.length} portfolio items`);
      loggerService.info(`📊 [PORTFOLIO GENERATOR] Generated stocks: ${result.map(s => s.ticker).join(', ')}`);
      return result;
      
    } catch (error) {
      loggerService.error(`❌ [PORTFOLIO GENERATOR] Error with volatility-based selection:`, error);
      loggerService.error(`⚠️ [PORTFOLIO GENERATOR] Error details:`, { message: (error as Error).message, stack: (error as Error).stack });
      
      // Fallback to legacy method
      try {
        loggerService.info(`🔄 [PORTFOLIO GENERATOR] Attempting fallback to legacy method...`);
        if (this.stockDatabase.length === 0) {
          await this.initializeStockDatabase();
        }
        const fallbackStocks = this.selectStocks(portfolioType);
        loggerService.info(`📊 [PORTFOLIO GENERATOR] Fallback: Using ${fallbackStocks.length} stocks from legacy method`);
        const result = await this.generateFromStocks(fallbackStocks, portfolioType, totalCapital, riskTolerance);
        loggerService.info(`✅ [PORTFOLIO GENERATOR] Fallback successful: Generated ${result.length} portfolio items`);
        return result;
      } catch (fallbackError) {
        loggerService.error(`❌ [PORTFOLIO GENERATOR] Fallback also failed:`, fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * 📈 Generate portfolio from selected stocks
   */
  private generateFromStocks(stocks: StockData[], portfolioType: 'solid' | 'risky', totalCapital: number, riskTolerance: number): GeneratedStock[] {
    const allocations = this.calculateAllocations(stocks, portfolioType);

    // Calculate portfolio-level volatility
    const portfolioVolatility = this.calculatePortfolioVolatility(stocks, allocations);
    
    loggerService.info(`📊 [PORTFOLIO GENERATOR] ${portfolioType} portfolio volatility: ${(portfolioVolatility * 100).toFixed(2)}%`);

    return stocks.map((stock, i) => {
      const allocation = allocations[i];
      const capitalAllocation = (totalCapital * allocation) / 100;
      const shares = Math.floor(capitalAllocation / stock.current);
      const entryPrice = stock.current;

      const stopLoss = entryPrice * (1 - riskTolerance / 100);
      const takeProfit = entryPrice * (1 + (riskTolerance * 1.5) / 100);

      return {
        ticker: stock.symbol,
        shares,
        entryPrice,
        currentPrice: stock.current,
        stopLoss,
        takeProfit,
        allocation,
        riskScore: stock.volatility,
        portfolioVolatility, // Include portfolio-level volatility
      };
    });
  }

  /**
   * 📊 Calculate portfolio-level volatility
   */
  private calculatePortfolioVolatility(stocks: StockData[], allocations: number[]): number {
    const weightedVolatility = stocks.reduce((sum, stock, i) => {
      const weight = allocations[i] / 100;
      return sum + (stock.volatility * weight);
    }, 0);
    
    return weightedVolatility;
  }

  calculateStopLossAndTakeProfit(entryPrice: number, riskTolerance: number) {
    const stopLoss = entryPrice * (1 - riskTolerance / 100);
    const takeProfit = entryPrice * (1 + (riskTolerance * 1.5) / 100);
    return { stopLoss, takeProfit };
  }

  /**
   * 🤖 חיבור למנוע החלטות - קבלת החלטות BUY / HOLD / SELL
   */
  async validateAndEnhancePortfolio(portfolio: any[]): Promise<any[]> {
    // Note: Decision engine now fetches data dynamically with 10-minute cache
    // No need to pre-load stock data anymore

    return Promise.all(portfolio.map(async (item) => {
      const decision = await decisionEngine.decideActionEnhanced({
        ticker: item.ticker,
        entryPrice: item.entryPrice,
        currentPrice: item.currentPrice,
        stopLoss: item.stopLoss,
        takeProfit: item.takeProfit,
      });

      return {
        ...item,
        action: decision.action,
        reason: decision.reason,
        color: decision.color,
      };
    }));
  }
}

export const portfolioGenerator = new PortfolioGenerator();
