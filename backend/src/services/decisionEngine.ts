import { stockDataService } from './stockDataService';

interface StockData {
  symbol: string;
  current: number;
  top30D: number;
  top60D: number;
  thisMonthPercent: number;
  lastMonthPercent: number;
  volatility?: number;
  marketCap?: number;
}

interface PortfolioItem {
  ticker: string;
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
}

interface DecisionResult {
  action: 'BUY' | 'HOLD' | 'SELL';
  reason: string;
  color: string;
  score?: number;
}

export class DecisionEngine {
  private stockData: Map<string, StockData> = new Map();

  async loadStockData(): Promise<void> {
    try {
      console.log('🔍 [DECISION ENGINE] Loading real stock data...');
      
      // List of stocks we track (including user portfolio stocks)
      const symbols = [
        // Tech Giants
        'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'JNJ', 'PG', 'KO', 'AMD', 'PLTR', 'ARKK', 'GME',
        // User Portfolio Stocks
        'QS', 'UEC', 'HIMX', 'ONCY', 'AQST', 'AEG', 'HST'
      ];
      
      // Get real data from Alpha Vantage
      const realData = await stockDataService.getMultipleStockData(symbols);
      
      this.stockData.clear();
      realData.forEach((stock, symbol) => {
        this.stockData.set(symbol, stock);
      });
      
      console.log(`✅ [DECISION ENGINE] Loaded real data for ${realData.size} stocks`);
      
      // If no real data available, fall back to mock data
      if (realData.size === 0) {
        console.warn('⚠️ [DECISION ENGINE] No real data available, using mock data');
        await this.loadMockData();
      }
      
    } catch (error) {
      console.error('❌ [DECISION ENGINE] Error loading real stock data:', error);
      console.log('🔄 [DECISION ENGINE] Falling back to mock data...');
      await this.loadMockData();
    }
  }

  private async loadMockData(): Promise<void> {
    const mockData: StockData[] = [
      // Tech Giants
      { symbol: 'AAPL', current: 150, top30D: 160, top60D: 155, thisMonthPercent: 5.2, lastMonthPercent: 3.1, volatility: 0.15, marketCap: 2500000000000 },
      { symbol: 'GOOGL', current: 2800, top30D: 2900, top60D: 2850, thisMonthPercent: 2.1, lastMonthPercent: -1.2, volatility: 0.22, marketCap: 1800000000000 },
      { symbol: 'MSFT', current: 420, top30D: 440, top60D: 430, thisMonthPercent: 8.5, lastMonthPercent: 4.2, volatility: 0.18, marketCap: 3100000000000 },
      { symbol: 'TSLA', current: 250, top30D: 280, top60D: 260, thisMonthPercent: -5.2, lastMonthPercent: 12.3, volatility: 0.45, marketCap: 800000000000 },
      { symbol: 'AMZN', current: 3200, top30D: 3300, top60D: 3250, thisMonthPercent: 1.8, lastMonthPercent: -2.1, volatility: 0.25, marketCap: 1700000000000 },
      
      // User Portfolio Stocks (with realistic data)
      { symbol: 'QS', current: 16.22, top30D: 18.50, top60D: 17.20, thisMonthPercent: -12.3, lastMonthPercent: 8.5, volatility: 0.65, marketCap: 7000000000 },
      { symbol: 'UEC', current: 14.96, top30D: 16.20, top60D: 15.40, thisMonthPercent: -7.6, lastMonthPercent: 15.2, volatility: 0.45, marketCap: 3500000000 },
      { symbol: 'HIMX', current: 8.90, top30D: 9.50, top60D: 9.20, thisMonthPercent: -6.3, lastMonthPercent: 12.8, volatility: 0.35, marketCap: 1500000000 },
      { symbol: 'ONCY', current: 1.29, top30D: 1.45, top60D: 1.35, thisMonthPercent: -7.2, lastMonthPercent: 5.8, volatility: 0.55, marketCap: 180000000 },
      { symbol: 'AQST', current: 6.46, top30D: 7.20, top60D: 6.80, thisMonthPercent: -10.3, lastMonthPercent: 18.5, volatility: 0.48, marketCap: 480000000 },
      { symbol: 'AEG', current: 7.77, top30D: 8.20, top60D: 7.95, thisMonthPercent: -5.2, lastMonthPercent: 22.1, volatility: 0.42, marketCap: 1600000000 },
      { symbol: 'HST', current: 16.15, top30D: 17.80, top60D: 16.90, thisMonthPercent: -9.3, lastMonthPercent: 25.6, volatility: 0.38, marketCap: 11000000000 },
    ];

    this.stockData.clear();
    mockData.forEach(stock => {
      this.stockData.set(stock.symbol, stock);
    });
  }

  decideActionEnhanced(item: PortfolioItem): DecisionResult {
    const { ticker, entryPrice, currentPrice, stopLoss, takeProfit } = item;
    const stockData = this.stockData.get(ticker);

    // Rule 1: Stop Loss / Take Profit (absolute rules)
    if (stopLoss && currentPrice <= stopLoss) {
      return {
        action: 'SELL',
        reason: 'Stop loss triggered',
        color: 'red',
      };
    }

    if (takeProfit && currentPrice >= takeProfit) {
      return {
        action: 'SELL',
        reason: 'Take profit target reached',
        color: 'green',
      };
    }

    // Rule 2: Scoring system (more balanced)
    let score = 0;
    const reasons: string[] = [];

    if (stockData) {
      // Current vs TOP30/TOP60 (30% weight) - more lenient thresholds
      const top60Ratio = currentPrice / stockData.top60D;
      if (top60Ratio > 0.95) {
        score += 1;
        reasons.push('Strong vs TOP60');
      } else if (top60Ratio < 0.5) { // Much more lenient - only sell if really weak
        score -= 1;
        reasons.push('Weak vs TOP60');
      }

      // This Month % (20% weight) - more lenient thresholds
      if (stockData.thisMonthPercent > 15) {
        score += 1;
        reasons.push('Strong monthly performance');
      } else if (stockData.thisMonthPercent < -20) { // Much more lenient
        score -= 1;
        reasons.push('Poor monthly performance');
      }

      // Last Month % (20% weight) - more lenient thresholds
      if (stockData.lastMonthPercent > 15) {
        score += 1;
        reasons.push('Strong previous month');
      } else if (stockData.lastMonthPercent < -20) { // Much more lenient
        score -= 1;
        reasons.push('Poor previous month');
      }
    }

    // Price vs Entry (30% weight) - more lenient
    const priceChange = ((currentPrice - entryPrice) / entryPrice) * 100;
    if (priceChange > 5) {
      score += 1;
      reasons.push('Above entry price');
    } else if (priceChange < -15) { // Only sell if down more than 15%
      score -= 1;
      reasons.push('Below entry price');
    }

    // Decision based on score - adjusted for price-only analysis
    let action: 'BUY' | 'HOLD' | 'SELL';
    let color: string;

    if (score >= 1) { // Lower threshold for BUY (works with price analysis)
      action = 'BUY';
      color = 'green';
    } else if (score <= -1) { // Lower threshold for SELL (works with price analysis)
      action = 'SELL';
      color = 'red';
    } else {
      action = 'HOLD'; // Default to HOLD for neutral cases
      color = 'yellow';
    }

    return {
      action,
      reason: reasons.length > 0 ? reasons.join(', ') : 'Neutral signals',
      color,
      score,
    };
  }

  async updatePortfolioDecisions(portfolioItems: PortfolioItem[]): Promise<DecisionResult[]> {
    await this.loadStockData();
    return portfolioItems.map(item => this.decideActionEnhanced(item));
  }
}

export const decisionEngine = new DecisionEngine();
