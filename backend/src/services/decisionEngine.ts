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
      
      // List of stocks we track
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'JNJ', 'PG', 'KO', 'AMD', 'PLTR', 'ARKK', 'GME'];
      
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
      { symbol: 'AAPL', current: 150, top30D: 160, top60D: 155, thisMonthPercent: 5.2, lastMonthPercent: 3.1, volatility: 0.15, marketCap: 2500000000000 },
      { symbol: 'GOOGL', current: 2800, top30D: 2900, top60D: 2850, thisMonthPercent: 2.1, lastMonthPercent: -1.2, volatility: 0.22, marketCap: 1800000000000 },
      { symbol: 'MSFT', current: 420, top30D: 440, top60D: 430, thisMonthPercent: 8.5, lastMonthPercent: 4.2, volatility: 0.18, marketCap: 3100000000000 },
      { symbol: 'TSLA', current: 250, top30D: 280, top60D: 260, thisMonthPercent: -5.2, lastMonthPercent: 12.3, volatility: 0.45, marketCap: 800000000000 },
      { symbol: 'AMZN', current: 3200, top30D: 3300, top60D: 3250, thisMonthPercent: 1.8, lastMonthPercent: -2.1, volatility: 0.25, marketCap: 1700000000000 },
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

    // Decision based on score - more balanced thresholds
    let action: 'BUY' | 'HOLD' | 'SELL';
    let color: string;

    if (score >= 3) { // Higher threshold for BUY
      action = 'BUY';
      color = 'green';
    } else if (score <= -3) { // Much lower threshold for SELL
      action = 'SELL';
      color = 'red';
    } else {
      action = 'HOLD'; // Default to HOLD for most cases
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
