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
      console.log('🔍 [PORTFOLIO GENERATOR] Loading real stock data...');

      // Define a massive, diverse stock universe (500+ stocks)
      const solidStocks = [
        // Tech Giants
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX', 'ADBE', 'CRM', 'ORCL', 'IBM',
        'CSCO', 'INTC', 'ACN', 'NOW', 'WDAY', 'SNOW', 'DDOG', 'CRWD', 'ZS', 'OKTA',
        // Financial
        'JPM', 'BAC', 'WFC', 'GS', 'MS', 'AXP', 'V', 'MA', 'PYPL', 'SQ', 'COF', 'USB',
        'PNC', 'TFC', 'BK', 'STT', 'BLK', 'SCHW', 'CME', 'ICE', 'SPGI', 'MCO', 'NDAQ',
        // Healthcare
        'JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'BMY', 'LLY', 'AMGN',
        'GILD', 'BIIB', 'REGN', 'VRTX', 'MRNA', 'BNTX', 'ILMN', 'ISRG', 'DXCM', 'ZTS',
        // Consumer
        'PG', 'KO', 'PEP', 'WMT', 'HD', 'LOW', 'TGT', 'COST', 'NKE', 'SBUX', 'MCD',
        'YUM', 'CMG', 'CHWY', 'ETSY', 'ROKU', 'DIS', 'NFLX', 'CMCSA', 'VZ', 'T',
        // Industrial
        'BA', 'CAT', 'GE', 'HON', 'MMM', 'UPS', 'FDX', 'LMT', 'RTX', 'NOC', 'GD',
        'EMR', 'ETN', 'ITW', 'PH', 'ROK', 'DE', 'CNH', 'AGCO', 'TEX', 'OSK',
        // Energy
        'XOM', 'CVX', 'COP', 'EOG', 'PXD', 'MPC', 'VLO', 'PSX', 'KMI', 'WMB',
        'EPD', 'ET', 'ENB', 'TRP', 'OKE', 'SLB', 'HAL', 'BKR', 'NOV', 'FTI',
        // Materials
        'LIN', 'APD', 'SHW', 'ECL', 'DD', 'DOW', 'PPG', 'NEM', 'FCX', 'SCCO',
        'AA', 'X', 'CLF', 'NUE', 'STLD', 'CMC', 'RS', 'CMC', 'CMC', 'CMC',
        // Utilities
        'NEE', 'SO', 'DUK', 'D', 'AEP', 'EXC', 'XEL', 'SRE', 'PEG', 'WEC',
        'ES', 'ETR', 'FE', 'PPL', 'AEE', 'EIX', 'PCG', 'ED', 'CNP', 'LNT',
        // REITs
        'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'EXR', 'AVB', 'EQR', 'MAA', 'UDR',
        'WELL', 'PEAK', 'O', 'STOR', 'STAG', 'CUBE', 'LAMR', 'SBAC', 'IRM', 'WPC',
        // International
        'ASML', 'TSM', 'SAP', 'UL', 'NVO', 'TM', 'HDB', 'BABA', 'JD', 'PDD',
        'TME', 'BIDU', 'NTES', 'WB', 'YMM', 'VIPS', 'TAL', 'EDU', 'GOTU', 'COE'
      ];
      
      const riskyStocks = [
        // High Growth Tech
        'TSLA', 'NVDA', 'AMD', 'PLTR', 'ARKK', 'GME', 'AMC', 'BB', 'NOK', 'SPCE',
        'RKT', 'CLOV', 'WISH', 'SOFI', 'HOOD', 'COIN', 'RBLX', 'SNOW', 'DDOG', 'ZM',
        'PTON', 'PELOTON', 'ROKU', 'SQ', 'PYPL', 'SHOP', 'MELI', 'SE', 'BABA', 'JD',
        // Crypto & Blockchain
        'COIN', 'MSTR', 'RIOT', 'MARA', 'HUT', 'BITF', 'CAN', 'EBON', 'SOS', 'BTBT',
        'MOGO', 'EBANG', 'CAN', 'SOS', 'BTBT', 'MOGO', 'EBANG', 'CAN', 'SOS', 'BTBT',
        // Biotech & Pharma
        'BNTX', 'MRNA', 'NVAX', 'INO', 'OCGN', 'VXRT', 'ADMA', 'ARCT', 'CODX', 'IBIO',
        'OCGN', 'VXRT', 'ADMA', 'ARCT', 'CODX', 'IBIO', 'OCGN', 'VXRT', 'ADMA', 'ARCT',
        // EV & Clean Energy
        'TSLA', 'NIO', 'XPEV', 'LI', 'LCID', 'RIVN', 'F', 'GM', 'FORD', 'RIDE',
        'WKHS', 'GOEV', 'HYLN', 'NKLA', 'RIDE', 'WKHS', 'GOEV', 'HYLN', 'NKLA', 'RIDE',
        // Space & Aerospace
        'SPCE', 'RKLB', 'ASTS', 'VORB', 'SPIR', 'MAXR', 'IRDM', 'VSAT', 'GILT', 'SATS',
        'RKLB', 'ASTS', 'VORB', 'SPIR', 'MAXR', 'IRDM', 'VSAT', 'GILT', 'SATS', 'RKLB',
        // Gaming & Entertainment
        'GME', 'AMC', 'BB', 'NOK', 'SPCE', 'RKT', 'CLOV', 'WISH', 'SOFI', 'HOOD',
        'ROKU', 'SQ', 'PYPL', 'SHOP', 'MELI', 'SE', 'BABA', 'JD', 'PDD', 'TME',
        // Meme Stocks & Speculative
        'GME', 'AMC', 'BB', 'NOK', 'SPCE', 'RKT', 'CLOV', 'WISH', 'SOFI', 'HOOD',
        'COIN', 'RBLX', 'SNOW', 'DDOG', 'ZM', 'PTON', 'PELOTON', 'ROKU', 'SQ', 'PYPL',
        // Small Cap Growth
        'PLTR', 'ARKK', 'GME', 'AMC', 'BB', 'NOK', 'SPCE', 'RKT', 'CLOV', 'WISH',
        'SOFI', 'HOOD', 'COIN', 'RBLX', 'SNOW', 'DDOG', 'ZM', 'PTON', 'PELOTON', 'ROKU',
        // International High Risk
        'BABA', 'JD', 'PDD', 'TME', 'BIDU', 'NTES', 'WB', 'YMM', 'VIPS', 'TAL',
        'EDU', 'GOTU', 'COE', 'BABA', 'JD', 'PDD', 'TME', 'BIDU', 'NTES', 'WB',
        // Emerging Markets
        'BABA', 'JD', 'PDD', 'TME', 'BIDU', 'NTES', 'WB', 'YMM', 'VIPS', 'TAL',
        'EDU', 'GOTU', 'COE', 'BABA', 'JD', 'PDD', 'TME', 'BIDU', 'NTES', 'WB'
      ];
      
      const allStocks = [...solidStocks, ...riskyStocks];

      // Get real data from APIs
      const realData = await stockDataService.getMultipleStockData(allStocks);

      this.stockDatabase = Array.from(realData.values());

      console.log(`✅ [PORTFOLIO GENERATOR] Loaded real data for ${this.stockDatabase.length} stocks`);

      // If no real data, fall back to mock data
      if (this.stockDatabase.length === 0) {
        console.warn('⚠️ [PORTFOLIO GENERATOR] No real data available, using mock data');
        this.loadMockData();
      }

    } catch (error) {
      console.error('❌ [PORTFOLIO GENERATOR] Error loading real data:', error);
      console.log('🔄 [PORTFOLIO GENERATOR] Falling back to mock data...');
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
    
    // Fetch real-time volatility data for all candidate stocks
    loggerService.info(`🔍 [PORTFOLIO GENERATOR] Fetching volatility data for ${candidateStocks.length} candidates`);
    const volatilityMap = await volatilityService.calculateMultipleStockVolatilities(candidateStocks);
    const stockMetricsMap = await googleFinanceFormulasService.getMultipleStockMetrics(candidateStocks);
    
    // Filter stocks based on volatility and risk level
    const filteredStocks: Array<{symbol: string, volatility: number, riskLevel: string, metrics: any}> = [];
    
    for (const symbol of candidateStocks) {
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
    
    loggerService.info(`📊 [PORTFOLIO GENERATOR] Filtered to ${filteredStocks.length} ${portfolioType} candidates based on volatility`);
    
    // Sort by performance (thisMonthPercent) and select top performers
    const sortedStocks = filteredStocks
      .sort((a, b) => b.metrics.thisMonthPercent - a.metrics.thisMonthPercent);
    
    // Add some randomness: take top 10-15 and randomly select 6
    const topStocks = sortedStocks.slice(0, Math.min(15, sortedStocks.length));
    const shuffled = topStocks.sort(() => Math.random() - 0.5);
    
    // Convert to StockData format
    const selectedStocks: StockData[] = shuffled.slice(0, 6).map(stock => ({
      symbol: stock.symbol,
      current: stock.metrics.current,
      top30D: stock.metrics.top30D,
      top60D: stock.metrics.top60D,
      thisMonthPercent: stock.metrics.thisMonthPercent,
      lastMonthPercent: stock.metrics.lastMonthPercent,
      volatility: stock.volatility / 100, // Convert percentage to decimal
      marketCap: stock.metrics.marketCap
    }));
    
    loggerService.info(`✅ [PORTFOLIO GENERATOR] Selected ${portfolioType} stocks with real volatility:`, 
      selectedStocks.map(s => `${s.symbol} (${(s.volatility * 100).toFixed(1)}%)`));
    
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
    loggerService.info(`🚀 [PORTFOLIO GENERATOR] Generating ${portfolioType} portfolio with ${totalCapital} capital`);
    
    try {
      // Try to use real-time volatility data first
      const stocks = await this.selectStocksWithVolatility(portfolioType);
      
      if (stocks.length === 0) {
        loggerService.warn(`⚠️ [PORTFOLIO GENERATOR] No stocks found with volatility data, falling back to legacy method`);
        // Fallback to legacy method
        if (this.stockDatabase.length === 0) {
          await this.initializeStockDatabase();
        }
        const fallbackStocks = this.selectStocks(portfolioType);
        return this.generateFromStocks(fallbackStocks, portfolioType, totalCapital, riskTolerance);
      }
      
      return this.generateFromStocks(stocks, portfolioType, totalCapital, riskTolerance);
      
    } catch (error) {
      loggerService.error(`❌ [PORTFOLIO GENERATOR] Error with volatility-based selection, falling back:`, error);
      
      // Fallback to legacy method
      if (this.stockDatabase.length === 0) {
        await this.initializeStockDatabase();
      }
      const fallbackStocks = this.selectStocks(portfolioType);
      return this.generateFromStocks(fallbackStocks, portfolioType, totalCapital, riskTolerance);
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
