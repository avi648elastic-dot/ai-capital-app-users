interface StockData {
  symbol: string;
  current: number;
  top30D: number;
  top60D: number;
  thisMonthPercent: number;
  lastMonthPercent: number;
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
      // Mock data for now - in production, this would fetch from Google Sheets
      const mockData: StockData[] = [
        { symbol: 'AAPL', current: 150, top30D: 160, top60D: 155, thisMonthPercent: 5.2, lastMonthPercent: 3.1 },
        { symbol: 'GOOGL', current: 2800, top30D: 2900, top60D: 2850, thisMonthPercent: 2.1, lastMonthPercent: -1.2 },
        { symbol: 'MSFT', current: 420, top30D: 440, top60D: 430, thisMonthPercent: 8.5, lastMonthPercent: 4.2 },
        { symbol: 'TSLA', current: 250, top30D: 280, top60D: 260, thisMonthPercent: -5.2, lastMonthPercent: 12.3 },
        { symbol: 'AMZN', current: 3200, top30D: 3300, top60D: 3250, thisMonthPercent: 1.8, lastMonthPercent: -2.1 },
      ];

      this.stockData.clear();
      mockData.forEach(stock => {
        this.stockData.set(stock.symbol, stock);
      });
    } catch (error) {
      console.error('Error loading stock data:', error);
      // Continue with empty data
    }
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

    // Rule 2: Scoring system
    let score = 0;
    const reasons: string[] = [];

    if (stockData) {
      // Current vs TOP30/TOP60 (30% weight)
      const top60Ratio = currentPrice / stockData.top60D;
      if (top60Ratio > 0.9) {
        score += 1;
        reasons.push('Strong vs TOP60');
      } else if (top60Ratio < 0.7) {
        score -= 1;
        reasons.push('Weak vs TOP60');
      }

      // This Month % (20% weight)
      if (stockData.thisMonthPercent > 10) {
        score += 1;
        reasons.push('Strong monthly performance');
      } else if (stockData.thisMonthPercent < -10) {
        score -= 1;
        reasons.push('Poor monthly performance');
      }

      // Last Month % (20% weight)
      if (stockData.lastMonthPercent > 10) {
        score += 1;
        reasons.push('Strong previous month');
      } else if (stockData.lastMonthPercent < -10) {
        score -= 1;
        reasons.push('Poor previous month');
      }
    }

    // Price vs Entry (30% weight)
    if (currentPrice > entryPrice) {
      score += 1;
      reasons.push('Above entry price');
    } else {
      score -= 1;
      reasons.push('Below entry price');
    }

    // Decision based on score
    let action: 'BUY' | 'HOLD' | 'SELL';
    let color: string;

    if (score >= 2) {
      action = 'BUY';
      color = 'green';
    } else if (score <= -2) {
      action = 'SELL';
      color = 'red';
    } else {
      action = 'HOLD';
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
