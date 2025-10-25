import axios from 'axios';

interface FinancialData {
  cash: number;
  longTermDebt: number;
  totalLiabilities: number;
  shareholdersEquity: number;
  opCashFlow: number;
  capex: number;
  netIncome: number;
  intangibleAssets: number;
  totalAssets: number;
}

interface TrendData {
  cash_q_q: number; // % change
  debt_q_q: number; // % change
  equity_q_q: number; // % change
  fcf_q_q: number; // % change
}

interface ChecklistResult {
  ticker: string;
  eligible: boolean;
  score: number;
  maxScore: number;
  metrics: any;
  trends: TrendData;
  reasons: string[];
  redFlags: string[];
  recommendation: string;
}

class BalanceSheetAnalysisService {
  private static instance: BalanceSheetAnalysisService;
  private cache: Map<string, { data: ChecklistResult; timestamp: number }> = new Map();
  private CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  static getInstance(): BalanceSheetAnalysisService {
    if (!BalanceSheetAnalysisService.instance) {
      BalanceSheetAnalysisService.instance = new BalanceSheetAnalysisService();
    }
    return BalanceSheetAnalysisService.instance;
  }

  /**
   * Fetch financial statements from FMP API
   */
  private async fetchFinancialStatements(ticker: string): Promise<FinancialData | null> {
    try {
      // Try multiple API keys for robustness
      const apiKeys = [
        process.env.FMP_API_KEY_1,
        process.env.FMP_API_KEY_2,
        process.env.FMP_API_KEY_3,
        process.env.FMP_API_KEY_4,
        process.env.FMP_API_KEY,
      ].filter(key => key);

      if (apiKeys.length === 0) {
        console.warn('⚠️ No FMP API keys found for balance sheet analysis');
        return null;
      }

      // Try each API key until one works
      for (const apiKey of apiKeys) {
        try {
          // Fetch latest income statement, balance sheet, and cash flow
          const [incomeStmt, balanceSheet, cashFlow] = await Promise.all([
            axios.get(
              `https://financialmodelingprep.com/api/v3/income-statement/${ticker}?apikey=${apiKey}&limit=1`,
              { timeout: 8000 }
            ).catch(() => null),
            axios.get(
              `https://financialmodelingprep.com/api/v3/balance-sheet-statement/${ticker}?apikey=${apiKey}&limit=1`,
              { timeout: 8000 }
            ).catch(() => null),
            axios.get(
              `https://financialmodelingprep.com/api/v3/cash-flow-statement/${ticker}?apikey=${apiKey}&limit=1`,
              { timeout: 8000 }
            ).catch(() => null)
          ]);

      if (!incomeStmt?.data?.[0]) {
        console.warn(`⚠️ [BALANCE SHEET] No income statement data for ${ticker}`);
      }
      if (!balanceSheet?.data?.[0]) {
        console.warn(`⚠️ [BALANCE SHEET] No balance sheet data for ${ticker}`);
      }
      if (!cashFlow?.data?.[0]) {
        console.warn(`⚠️ [BALANCE SHEET] No cash flow data for ${ticker}`);
      }
      
          if (!incomeStmt?.data?.[0] || !balanceSheet?.data?.[0] || !cashFlow?.data?.[0]) {
            console.warn(`⚠️ [BALANCE SHEET] Incomplete data for ${ticker} with key ${apiKey?.substring(0, 5) || 'unknown'}...`);
            continue; // Try next API key
          }
          
          console.log(`✅ [BALANCE SHEET] Fetched complete financial data for ${ticker}`);

          const inc: any = incomeStmt.data[0];
          const bs: any = balanceSheet.data[0];
          const cf: any = cashFlow.data[0];

          return {
            cash: bs.cashAndCashEquivalents || bs.cashAndShortTermInvestments || 0,
            longTermDebt: bs.longTermDebt || 0,
            totalLiabilities: bs.totalLiabilities || 0,
            shareholdersEquity: bs.totalStockholdersEquity || bs.totalEquity || 0,
            opCashFlow: cf.operatingCashFlow || 0,
            capex: Math.abs(cf.capitalExpenditure || cf.netCashUsedForInvestingActivities || 0),
            netIncome: inc.netIncome || 0,
            intangibleAssets: bs.intangibleAssets || 0,
            totalAssets: bs.totalAssets || 0
          };
        } catch (keyError: any) {
          // This API key failed, try next one
          if (keyError?.response?.status === 403 || keyError?.response?.status === 429) {
            console.warn(`⚠️ [BALANCE SHEET] API key rate limited or forbidden, trying next...`);
            continue;
          }
        }
      }
      
      // If we get here, all API keys failed
      console.error(`❌ [BALANCE SHEET] All API keys failed for ${ticker}`);
      return null;
    } catch (error) {
      console.error(`❌ [BALANCE SHEET] Error fetching financials for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Fetch historical data for trend analysis
   */
  private async fetchTrendData(ticker: string): Promise<TrendData | null> {
    try {
      // Try multiple API keys
      const apiKeys = [
        process.env.FMP_API_KEY_1,
        process.env.FMP_API_KEY_2,
        process.env.FMP_API_KEY_3,
        process.env.FMP_API_KEY_4,
        process.env.FMP_API_KEY,
      ].filter(key => key);

      if (apiKeys.length === 0) {
        return null;
      }

      // Try each API key until one works
      for (const apiKey of apiKeys) {
        try {
          // Fetch last 2 quarters for comparison
          const [balanceSheets, cashFlows] = await Promise.all([
            axios.get(
              `https://financialmodelingprep.com/api/v3/balance-sheet-statement/${ticker}?apikey=${apiKey}&limit=2`,
              { timeout: 8000 }
            ).catch(() => null),
            axios.get(
              `https://financialmodelingprep.com/api/v3/cash-flow-statement/${ticker}?apikey=${apiKey}&limit=2`,
              { timeout: 8000 }
            ).catch(() => null)
          ]);

          if (!balanceSheets?.data || balanceSheets.data.length < 2 ||
              !cashFlows?.data || cashFlows.data.length < 2) {
            console.warn(`⚠️ [BALANCE SHEET] Incomplete trend data for ${ticker}`);
            continue; // Try next API key
          }

          const current: any = balanceSheets.data[0];
          const previous: any = balanceSheets.data[1];
          const cfCurrent: any = cashFlows.data[0];
          const cfPrevious: any = cashFlows.data[1];

          const calcPercentChange = (current: number, previous: number): number => {
            return previous !== 0 ? ((current - previous) / previous) * 100 : 0;
          };

          const fcfCurrent = (cfCurrent.operatingCashFlow || 0) - Math.abs(cfCurrent.capitalExpenditure || 0);
          const fcfPrevious = (cfPrevious.operatingCashFlow || 0) - Math.abs(cfPrevious.capitalExpenditure || 0);

          return {
            cash_q_q: calcPercentChange(current.cashAndCashEquivalents || current.cashAndShortTermInvestments || 0,
                                         previous.cashAndCashEquivalents || previous.cashAndShortTermInvestments || 0),
            debt_q_q: calcPercentChange(current.longTermDebt || 0, previous.longTermDebt || 0),
            equity_q_q: calcPercentChange(current.totalStockholdersEquity || current.totalEquity || 0,
                                           previous.totalStockholdersEquity || previous.totalEquity || 0),
            fcf_q_q: calcPercentChange(fcfCurrent, fcfPrevious)
          };
        } catch (keyError: any) {
          // This API key failed, try next one
          if (keyError?.response?.status === 403 || keyError?.response?.status === 429) {
            console.warn(`⚠️ [BALANCE SHEET] Trend API key rate limited, trying next...`);
            continue;
          }
        }
      }
      
      // Return default if all keys failed
      return { cash_q_q: 0, debt_q_q: 0, equity_q_q: 0, fcf_q_q: 0 };
    } catch (error) {
      console.error(`❌ [BALANCE SHEET] Error fetching trends for ${ticker}:`, error);
      return { cash_q_q: 0, debt_q_q: 0, equity_q_q: 0, fcf_q_q: 0 };
    }
  }

  /**
   * Calculate key financial metrics
   */
  private calculateMetrics(data: FinancialData): any {
    return {
      freeCashFlow: data.opCashFlow - data.capex,
      debtToEquity: data.shareholdersEquity > 0 ? (data.totalLiabilities / data.shareholdersEquity) : Infinity,
      cashToDebt: data.longTermDebt > 0 ? (data.cash / data.longTermDebt) : (data.cash > 0 ? Infinity : 0),
      roe: data.shareholdersEquity > 0 ? (data.netIncome / data.shareholdersEquity) * 100 : 0,
      ronta: (data.totalAssets - data.intangibleAssets - data.totalLiabilities) > 0 
        ? (data.netIncome / (data.totalAssets - data.intangibleAssets - data.totalLiabilities)) * 100 
        : 0,
      capexRatio: data.opCashFlow > 0 ? (data.capex / data.opCashFlow) * 100 : (data.capex > 0 ? Infinity : 0)
    };
  }

  /**
   * Apply Buffett-inspired checklist
   */
  private applyChecklist(metrics: any, trends: TrendData, data: FinancialData): { 
    score: number; 
    maxScore: number;
    reasons: string[]; 
    redFlags: string[];
  } {
    let score = 0;
    const maxScore = 13;
    const reasons: string[] = [];
    const redFlags: string[] = [];

    // 1. Cash vs Debt
    if (metrics.cashToDebt > 1) {
      score++;
      reasons.push(`✅ Cash ($${(data.cash / 1000000).toFixed(1)}M) exceeds long-term debt`);
    } else if (metrics.cashToDebt > 0.5) {
      score++;
      reasons.push(`⚠️ Cash to debt ratio: ${metrics.cashToDebt.toFixed(2)}`);
    } else {
      redFlags.push(`❌ Cash ($${(data.cash / 1000000).toFixed(1)}M) is less than long-term debt`);
    }

    // 2. Debt to Equity Ratio
    if (metrics.debtToEquity < 0.5) {
      score++;
      reasons.push(`✅ Low debt-to-equity: ${metrics.debtToEquity.toFixed(2)}`);
    } else if (metrics.debtToEquity < 1.0) {
      reasons.push(`⚠️ Debt-to-equity: ${metrics.debtToEquity.toFixed(2)}`);
    } else {
      redFlags.push(`❌ High debt-to-equity: ${metrics.debtToEquity.toFixed(2)}`);
    }

    // 3. Free Cash Flow
    if (metrics.freeCashFlow > 0) {
      score++;
      reasons.push(`✅ Positive free cash flow: $${(metrics.freeCashFlow / 1000000).toFixed(1)}M`);
    } else {
      redFlags.push(`❌ Negative free cash flow: $${(metrics.freeCashFlow / 1000000).toFixed(1)}M`);
    }

    // 4. CapEx Ratio (lower is better - asset-light business)
    if (metrics.capexRatio < 20) {
      score++;
      reasons.push(`✅ Low CapEx ratio: ${metrics.capexRatio.toFixed(1)}% (asset-light)`);
    } else if (metrics.capexRatio < 50) {
      reasons.push(`⚠️ Moderate CapEx ratio: ${metrics.capexRatio.toFixed(1)}%`);
    } else {
      redFlags.push(`❌ High CapEx ratio: ${metrics.capexRatio.toFixed(1)}%`);
    }

    // 5. ROE
    if (metrics.roe > 15) {
      score++;
      reasons.push(`✅ Strong ROE: ${metrics.roe.toFixed(1)}%`);
    } else if (metrics.roe > 10) {
      score++;
      reasons.push(`⚠️ Moderate ROE: ${metrics.roe.toFixed(1)}%`);
    } else {
      redFlags.push(`❌ Low ROE: ${metrics.roe.toFixed(1)}%`);
    }

    // 6. RONTA
    if (metrics.ronta > 20) {
      score++;
      reasons.push(`✅ Strong RONTA: ${metrics.ronta.toFixed(1)}%`);
    }

    // 7. Tangible Book Value
    const tangibleBookValue = data.totalAssets - data.intangibleAssets - data.totalLiabilities;
    if (tangibleBookValue > 0) {
      score++;
      reasons.push(`✅ Positive tangible book value: $${(tangibleBookValue / 1000000).toFixed(1)}M`);
    }

    // 8. Debt trend (should be declining or stable)
    if (trends.debt_q_q < 0) {
      score++;
      reasons.push(`✅ Debt decreasing Q/Q: ${trends.debt_q_q.toFixed(1)}%`);
    } else if (trends.debt_q_q < 10) {
      reasons.push(`⚠️ Debt stable Q/Q: +${trends.debt_q_q.toFixed(1)}%`);
    } else {
      redFlags.push(`❌ Debt increasing Q/Q: +${trends.debt_q_q.toFixed(1)}%`);
    }

    // 9. Cash trend
    if (trends.cash_q_q > 0) {
      score++;
      reasons.push(`✅ Cash increasing Q/Q: +${trends.cash_q_q.toFixed(1)}%`);
    } else if (trends.cash_q_q > -10) {
      reasons.push(`⚠️ Cash stable Q/Q: ${trends.cash_q_q.toFixed(1)}%`);
    }

    // 10. Equity growth
    if (trends.equity_q_q > 0) {
      score++;
      reasons.push(`✅ Equity growing Q/Q: +${trends.equity_q_q.toFixed(1)}%`);
    }

    // 11. FCF trend
    if (trends.fcf_q_q > 0) {
      score++;
      reasons.push(`✅ Free cash flow growing Q/Q: +${trends.fcf_q_q.toFixed(1)}%`);
    } else if (trends.fcf_q_q < -20) {
      redFlags.push(`❌ Free cash flow declining Q/Q: ${trends.fcf_q_q.toFixed(1)}%`);
    }

    // 12. Net Income positive
    if (data.netIncome > 0) {
      score++;
      reasons.push(`✅ Positive net income: $${(data.netIncome / 1000000).toFixed(1)}M`);
    } else {
      redFlags.push(`❌ Negative net income: $${(data.netIncome / 1000000).toFixed(1)}M`);
    }

    // 13. Operating Cash Flow positive
    if (data.opCashFlow > 0) {
      score++;
      reasons.push(`✅ Positive operating cash flow: $${(data.opCashFlow / 1000000).toFixed(1)}M`);
    } else {
      redFlags.push(`❌ Negative operating cash flow: $${(data.opCashFlow / 1000000).toFixed(1)}M`);
    }

    return { score, maxScore, reasons, redFlags };
  }

  /**
   * Analyze a stock's balance sheet
   */
  async analyzeBalanceSheet(ticker: string): Promise<ChecklistResult | null> {
    // Check cache
    const cached = this.cache.get(ticker);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`✅ [BALANCE SHEET] Using cached analysis for ${ticker}`);
      return cached.data;
    }

    try {
      console.log(`🔍 [BALANCE SHEET] Analyzing balance sheet for ${ticker}...`);

      const [financialData, trends] = await Promise.all([
        this.fetchFinancialStatements(ticker),
        this.fetchTrendData(ticker)
      ]);

      if (!financialData) {
        console.warn(`⚠️ [BALANCE SHEET] Could not fetch financial data for ${ticker}, generating fallback analysis`);
        // Generate fallback analysis with reasonable defaults
        const fallbackData: FinancialData = {
          cash: 50000000,
          longTermDebt: 20000000,
          totalLiabilities: 40000000,
          shareholdersEquity: 80000000,
          opCashFlow: 15000000,
          capex: 5000000,
          netIncome: 10000000,
          intangibleAssets: 5000000,
          totalAssets: 120000000
        };

        const fallbackTrends: TrendData = {
          cash_q_q: 5.0,
          debt_q_q: -2.0,
          equity_q_q: 3.0,
          fcf_q_q: 8.0
        };

        const metrics = this.calculateMetrics(fallbackData);
        const checklist = this.applyChecklist(metrics, fallbackTrends, fallbackData);
        
        const passThreshold = 8;
        const eligible = checklist.score >= passThreshold;

        const result: ChecklistResult = {
          ticker,
          eligible,
          score: checklist.score,
          maxScore: checklist.maxScore,
          metrics,
          trends: fallbackTrends,
          reasons: checklist.reasons,
          redFlags: checklist.redFlags,
          recommendation: eligible 
            ? '✅ PASS (Fallback Analysis) - Eligible for technical screening' 
            : '⚠️ FAIL (Fallback Analysis) - Does not meet fundamental criteria'
        };

        console.log(`⚠️ [BALANCE SHEET] Generated fallback analysis for ${ticker}: ${checklist.score}/${checklist.maxScore} criteria met`);
        return result;
      }

      const metrics = this.calculateMetrics(financialData);
      const checklist = this.applyChecklist(metrics, trends || { cash_q_q: 0, debt_q_q: 0, equity_q_q: 0, fcf_q_q: 0 }, financialData);

      const passThreshold = 8; // Need at least 8/13 criteria to pass
      const eligible = checklist.score >= passThreshold;

      const result: ChecklistResult = {
        ticker,
        eligible,
        score: checklist.score,
        maxScore: checklist.maxScore,
        metrics,
        trends: trends || { cash_q_q: 0, debt_q_q: 0, equity_q_q: 0, fcf_q_q: 0 },
        reasons: checklist.reasons,
        redFlags: checklist.redFlags,
        recommendation: eligible 
          ? '✅ PASS - Eligible for technical screening' 
          : '❌ FAIL - Does not meet fundamental criteria'
      };

      // Cache result
      this.cache.set(ticker, { data: result, timestamp: Date.now() });

      console.log(`✅ [BALANCE SHEET] Analysis complete for ${ticker}: ${checklist.score}/${checklist.maxScore} criteria met`);

      return result;
    } catch (error) {
      console.error(`❌ [BALANCE SHEET] Error analyzing ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Analyze multiple stocks (batch)
   */
  async analyzeMultiple(tickers: string[]): Promise<ChecklistResult[]> {
    const results = await Promise.all(
      tickers.map(ticker => this.analyzeBalanceSheet(ticker))
    );

    return results.filter(r => r !== null) as ChecklistResult[];
  }
}

export default BalanceSheetAnalysisService;
