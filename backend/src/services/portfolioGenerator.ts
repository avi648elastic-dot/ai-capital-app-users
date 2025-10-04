import { decisionEngine } from './decisionEngine';
import User from '../models/User'; // ✅ נוספה הגדרה למודל המשתמש לעדכון מצב onboarding
import Portfolio from '../models/Portfolio'; // ✅ נוספה תמיכה ליצירת תיק אמיתי בבסיס הנתונים

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
    this.initializeStockDatabase();
  }

  private initializeStockDatabase() {
    // Mock stock database with real-world data
    this.stockDatabase = [
      // Solid stocks (low volatility, stable growth)
      { symbol: 'AAPL', current: 150, top30D: 160, top60D: 155, thisMonthPercent: 5.2, lastMonthPercent: 3.1, volatility: 0.15, marketCap: 2500000000000 },
      { symbol: 'MSFT', current: 420, top30D: 440, top60D: 430, thisMonthPercent: 8.5, lastMonthPercent: 4.2, volatility: 0.18, marketCap: 3100000000000 },
      { symbol: 'GOOGL', current: 2800, top30D: 2900, top60D: 2850, thisMonthPercent: 2.1, lastMonthPercent: -1.2, volatility: 0.22, marketCap: 1800000000000 },
      { symbol: 'JNJ', current: 160, top30D: 165, top60D: 162, thisMonthPercent: 1.5, lastMonthPercent: 2.1, volatility: 0.12, marketCap: 420000000000 },
      { symbol: 'PG', current: 155, top30D: 158, top60D: 156, thisMonthPercent: 0.8, lastMonthPercent: 1.5, volatility: 0.10, marketCap: 380000000000 },
      { symbol: 'KO', current: 60, top30D: 62, top60D: 61, thisMonthPercent: 1.2, lastMonthPercent: 0.8, volatility: 0.08, marketCap: 260000000000 },

      // Dangerous stocks (high volatility, growth potential)
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
    portfolioType: 'solid' | 'dangerous',
    totalCapital: number,
    riskTolerance: number = 7
  ): Promise<GeneratedStock[]> {
    const generatedPortfolio = this.generatePortfolio(portfolioType, totalCapital, riskTolerance);
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
   * 🧠 בחירת מניות
   */
  private selectStocks(portfolioType: 'solid' | 'dangerous'): StockData[] {
    if (portfolioType === 'solid') {
      return this.stockDatabase
        .filter((s) => s.volatility < 0.25 && s.marketCap > 100000000000)
        .sort((a, b) => b.thisMonthPercent - a.thisMonthPercent)
        .slice(0, 6);
    } else {
      return this.stockDatabase
        .filter((s) => s.volatility > 0.30)
        .sort((a, b) => b.thisMonthPercent - a.thisMonthPercent)
        .slice(0, 6);
    }
  }

  /**
   * 💰 חישוב תיק לפי הקצאות
   */
  private calculateAllocations(stocks: StockData[], portfolioType: 'solid' | 'dangerous'): number[] {
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
   * 📈 הפעלת החישוב עצמו
   */
  generatePortfolio(portfolioType: 'solid' | 'dangerous', totalCapital: number, riskTolerance: number = 7): GeneratedStock[] {
    const stocks = this.selectStocks(portfolioType);
    const allocations = this.calculateAllocations(stocks, portfolioType);

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
      };
    });
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
    await decisionEngine.loadStockData();

    return portfolio.map((item) => {
      const decision = decisionEngine.decideActionEnhanced({
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
    });
  }
}

export const portfolioGenerator = new PortfolioGenerator();
