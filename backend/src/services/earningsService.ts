import axios from 'axios';

export interface EarningsData {
  ticker: string;
  date: string;
  time?: string;
  epsEstimate?: number | null;
  epsActual?: number | null;
  revenueEstimate?: number | null;
  revenueActual?: number | null;
  source: 'FMP' | 'ALPHA_VANTAGE' | 'YAHOO' | 'FALLBACK';
}

export class EarningsService {
  private static instance: EarningsService;
  private cache: Map<string, { data: EarningsData[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 3600000; // 1 hour

  private constructor() {}

  static getInstance(): EarningsService {
    if (!EarningsService.instance) {
      EarningsService.instance = new EarningsService();
    }
    return EarningsService.instance;
  }

  /**
   * Fetch earnings calendar for a list of tickers
   */
  async getEarningsCalendar(tickers: string[]): Promise<EarningsData[]> {
    const uniqueTickers = [...new Set(tickers)];
    const allEarnings: EarningsData[] = [];

    for (const ticker of uniqueTickers) {
      try {
        // Check cache first
        const cached = this.cache.get(ticker);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
          allEarnings.push(...cached.data);
          console.log(`✅ [EARNINGS] Using cached data for ${ticker}`);
          continue;
        }

        // Try FMP first (most reliable)
        let earnings = await this.fetchFromFMP(ticker);
        
        // Fallback to Alpha Vantage if FMP fails
        if (!earnings || earnings.length === 0) {
          earnings = await this.fetchFromAlphaVantage(ticker);
        }

        // Fallback to Yahoo Finance if both fail
        if (!earnings || earnings.length === 0) {
          earnings = await this.fetchFromYahooFinance(ticker);
        }

        // If all APIs failed, use fallback data
        if (!earnings || earnings.length === 0) {
          console.log(`⚠️ [EARNINGS] Using fallback data for ${ticker}`);
          earnings = this.generateFallbackEarnings(ticker);
        }

        // Filter for future dates only
        if (earnings && earnings.length > 0) {
          const futureEarnings = earnings.filter(e => {
            const earningsDate = new Date(e.date);
            return earningsDate >= new Date();
          });

          // Cache the result
          this.cache.set(ticker, {
            data: futureEarnings.length > 0 ? futureEarnings : earnings,
            timestamp: Date.now()
          });

          allEarnings.push(...(futureEarnings.length > 0 ? futureEarnings : earnings));
        }
      } catch (error: any) {
        console.error(`❌ [EARNINGS] Error fetching earnings for ${ticker}:`, error?.message);
      }
    }

    return allEarnings;
  }

  /**
   * Fetch from Financial Modeling Prep
   */
  private async fetchFromFMP(ticker: string): Promise<EarningsData[]> {
    const apiKeys = [
      process.env.FMP_API_KEY_1,
      process.env.FMP_API_KEY_2,
      process.env.FMP_API_KEY_3,
      process.env.FMP_API_KEY_4,
      process.env.FMP_API_KEY,
    ].filter(key => key);

    if (apiKeys.length === 0) {
      return [];
    }

    for (let i = 0; i < Math.min(apiKeys.length, 3); i++) {
      try {
        const response = await axios.get(
          `https://financialmodelingprep.com/api/v3/earning_calendar?symbol=${ticker}&apikey=${apiKeys[i]}`,
          { timeout: 5000 }
        );

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          console.log(`✅ [EARNINGS] FMP fetched ${response.data.length} records for ${ticker}`);
          
          return response.data.map((item: any) => ({
            ticker: ticker,
            date: item.date?.split(' ')[0] || item.date,
            time: item.time || 'Before Market Open',
            epsEstimate: item.epsEstimated,
            revenueEstimate: item.revenueEstimated,
            source: 'FMP' as const
          }));
        }
      } catch (error: any) {
        if (error?.response?.status === 429 || error?.response?.status === 403) {
          console.warn(`⚠️ [EARNINGS] FMP rate limited for ${ticker}, trying next key...`);
          continue;
        }
      }
    }

    return [];
  }

  /**
   * Fetch from Alpha Vantage
   */
  private async fetchFromAlphaVantage(ticker: string): Promise<EarningsData[]> {
    const apiKeys = [
      process.env.ALPHA_VANTAGE_API_KEY_1,
      process.env.ALPHA_VANTAGE_API_KEY_2,
      process.env.ALPHA_VANTAGE_API_KEY_3,
      process.env.ALPHA_VANTAGE_API_KEY_4,
      process.env.ALPHA_VANTAGE_API_KEY,
    ].filter(key => key);

    if (apiKeys.length === 0) {
      return [];
    }

    for (let i = 0; i < Math.min(apiKeys.length, 2); i++) {
      try {
        const response = await axios.get(
          `https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&symbol=${ticker}&horizon=3month&apikey=${apiKeys[i]}`,
          { timeout: 8000 }
        );

        if (response.data && response.data[0] && response.data[0].reportDate) {
          console.log(`✅ [EARNINGS] Alpha Vantage fetched earnings for ${ticker}`);
          
          // Alpha Vantage returns CSV format
          const lines = response.data.split('\n');
          const earnings: EarningsData[] = [];
          
          for (let j = 1; j < lines.length; j++) {
            const values = lines[j].split(',');
            if (values.length >= 5) {
              earnings.push({
                ticker: values[0] || ticker,
                date: values[1],
                time: values[2] || 'Before Market Open',
                epsEstimate: parseFloat(values[3]) || null,
                revenueEstimate: parseFloat(values[4]) || null,
                source: 'ALPHA_VANTAGE' as const
              });
            }
          }
          
          return earnings;
        }
      } catch (error: any) {
        console.warn(`⚠️ [EARNINGS] Alpha Vantage failed for ${ticker}:`, error?.message);
      }
    }

    return [];
  }

  /**
   * Fetch from Yahoo Finance (web scraping approach)
   */
  private async fetchFromYahooFinance(ticker: string): Promise<EarningsData[]> {
    try {
      // Simple approach: Yahoo Finance doesn't have a good public API
      // We'll return a fallback with current date as next earnings
      console.log(`⚠️ [EARNINGS] Yahoo Finance not implemented for ${ticker}`);
      return [];
    } catch (error: any) {
      console.warn(`⚠️ [EARNINGS] Yahoo Finance failed for ${ticker}:`, error?.message);
      return [];
    }
  }

  /**
   * Generate fallback data based on historical patterns
   */
  private generateFallbackEarnings(ticker: string): EarningsData[] {
    // Most US companies report quarterly earnings roughly every 3 months
    // Calculate next likely earnings date based on typical reporting schedule
    const now = new Date();
    const nextQuarter = new Date(now);
    nextQuarter.setMonth(now.getMonth() + 3);

    return [{
      ticker: ticker,
      date: nextQuarter.toISOString().split('T')[0],
      time: 'After Market Close',
      epsEstimate: null,
      revenueEstimate: null,
      source: 'FALLBACK' as const
    }];
  }
}
