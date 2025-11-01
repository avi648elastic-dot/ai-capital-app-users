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
   * ENHANCED WITH COMPREHENSIVE DEBUGGING
   */
  async getEarningsCalendar(tickers: string[]): Promise<EarningsData[]> {
    const uniqueTickers = [...new Set(tickers)];
    const allEarnings: EarningsData[] = [];

    console.log(`📅 [EARNINGS] ============================================`);
    console.log(`📅 [EARNINGS] Fetching earnings calendar for ${uniqueTickers.length} stocks: ${uniqueTickers.join(', ')}`);
    console.log(`📅 [EARNINGS] ============================================`);

    for (const ticker of uniqueTickers) {
      try {
        console.log(`\n🔍 [EARNINGS] Processing ${ticker}...`);
        
        // Check cache first
        const cached = this.cache.get(ticker);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
          allEarnings.push(...cached.data);
          console.log(`✅ [EARNINGS] ${ticker}: Using cached data (${cached.data.length} earnings, source: ${cached.data[0]?.source})`);
          continue;
        }

        console.log(`📥 [EARNINGS] ${ticker}: No cache, fetching from APIs...`);

        // Try FMP first (most reliable)
        console.log(`🔍 [EARNINGS] ${ticker}: Trying FMP API...`);
        let earnings = await this.fetchFromFMP(ticker);
        
        // Fallback to Alpha Vantage if FMP fails
        if (!earnings || earnings.length === 0) {
          console.log(`⚠️ [EARNINGS] ${ticker}: FMP failed, trying Alpha Vantage...`);
          earnings = await this.fetchFromAlphaVantage(ticker);
        }

        // Fallback to Yahoo Finance if both fail
        if (!earnings || earnings.length === 0) {
          console.log(`⚠️ [EARNINGS] ${ticker}: Alpha Vantage failed, trying Yahoo Finance...`);
          earnings = await this.fetchFromYahooFinance(ticker);
        }

        // If all APIs failed, use fallback data
        if (!earnings || earnings.length === 0) {
          console.log(`⚠️ [EARNINGS] ${ticker}: ALL APIs FAILED - using fallback data (estimated quarterly earnings)`);
          earnings = this.generateFallbackEarnings(ticker);
        } else {
          console.log(`✅ [EARNINGS] ${ticker}: Got ${earnings.length} earnings from ${earnings[0]?.source}`);
        }

        // Filter for future dates only
        if (earnings && earnings.length > 0) {
          const now = new Date();
          now.setHours(0, 0, 0, 0); // Start of today
          
          const futureEarnings = earnings.filter(e => {
            const earningsDate = new Date(e.date);
            earningsDate.setHours(0, 0, 0, 0);
            return earningsDate >= now;
          });

          console.log(`📊 [EARNINGS] ${ticker}: Filtered ${earnings.length} total → ${futureEarnings.length} future earnings`);
          
          if (futureEarnings.length > 0) {
            console.log(`📅 [EARNINGS] ${ticker}: Next earnings: ${futureEarnings[0].date} ${futureEarnings[0].time || ''}`);
          }

          // Cache the result
          const dataToCache = futureEarnings.length > 0 ? futureEarnings : earnings;
          this.cache.set(ticker, {
            data: dataToCache,
            timestamp: Date.now()
          });

          allEarnings.push(...dataToCache);
        }
      } catch (error: any) {
        console.error(`❌ [EARNINGS] ${ticker}: CRITICAL ERROR:`, error?.message);
        console.error(`❌ [EARNINGS] ${ticker}: Stack trace:`, error?.stack);
        // Still add fallback data so user gets something
        const fallback = this.generateFallbackEarnings(ticker);
        allEarnings.push(...fallback);
      }
    }

    console.log(`\n✅ [EARNINGS] FINAL RESULT: ${allEarnings.length} total earnings for ${uniqueTickers.length} stocks`);
    console.log(`📊 [EARNINGS] Sources: ${[...new Set(allEarnings.map(e => e.source))].join(', ')}`);
    console.log(`📅 [EARNINGS] ============================================\n`);

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
      process.env.FINANCIAL_MODELING_PREP_API_KEY, // CRITICAL: Render uses this name!
    ].filter(key => key);

    if (apiKeys.length === 0) {
      console.log(`⚠️ [EARNINGS] FMP: No API keys configured`);
      return [];
    }

    console.log(`🔑 [EARNINGS] FMP: Found ${apiKeys.length} API keys, trying up to 3...`);

    for (let i = 0; i < Math.min(apiKeys.length, 3); i++) {
      try {
        const url = `https://financialmodelingprep.com/api/v3/earning_calendar?symbol=${ticker}&apikey=${apiKeys[i]}`;
        console.log(`🌐 [EARNINGS] FMP: Calling ${url.substring(0, 100)}...`);
        
        const response = await axios.get(url, { timeout: 8000 });

        console.log(`📥 [EARNINGS] FMP: Response status ${response.status}, data type: ${typeof response.data}, isArray: ${Array.isArray(response.data)}`);
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          console.log(`✅ [EARNINGS] FMP: SUCCESS! Fetched ${response.data.length} records for ${ticker}`);
          console.log(`📊 [EARNINGS] FMP: Sample data:`, JSON.stringify(response.data[0], null, 2));
          
          const parsedEarnings = response.data.map((item: any) => ({
            ticker: ticker,
            date: item.date?.split(' ')[0] || item.date,
            time: item.time || 'Before Market Open',
            epsEstimate: item.epsEstimated || null,
            epsActual: item.eps || null,
            revenueEstimate: item.revenueEstimated || null,
            revenueActual: item.revenue || null,
            source: 'FMP' as const
          }));
          
          console.log(`✅ [EARNINGS] FMP: Parsed ${parsedEarnings.length} earnings for ${ticker}`);
          return parsedEarnings;
        } else {
          console.warn(`⚠️ [EARNINGS] FMP: Empty or invalid response for ${ticker}`);
        }
      } catch (error: any) {
        console.error(`❌ [EARNINGS] FMP: Error for ${ticker}:`, {
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          message: error?.message,
          data: error?.response?.data
        });
        
        if (error?.response?.status === 429 || error?.response?.status === 403) {
          console.warn(`⚠️ [EARNINGS] FMP: Rate limited/forbidden for ${ticker}, trying next key...`);
          continue;
        }
      }
    }

    console.log(`❌ [EARNINGS] FMP: All ${apiKeys.length} keys failed for ${ticker}`);
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
      console.log(`⚠️ [EARNINGS] Alpha Vantage: No API keys configured`);
      return [];
    }

    console.log(`🔑 [EARNINGS] Alpha Vantage: Found ${apiKeys.length} API keys, trying up to 2...`);

    for (let i = 0; i < Math.min(apiKeys.length, 2); i++) {
      try {
        const url = `https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&symbol=${ticker}&horizon=3month&apikey=${apiKeys[i]}`;
        console.log(`🌐 [EARNINGS] Alpha Vantage: Calling API for ${ticker}...`);
        
        const response = await axios.get(url, { timeout: 10000 });

        console.log(`📥 [EARNINGS] Alpha Vantage: Response status ${response.status}, data type: ${typeof response.data}, length: ${response.data?.length || 0}`);
        
        // Alpha Vantage returns CSV format as STRING
        if (response.data && typeof response.data === 'string' && response.data.includes('reportDate')) {
          console.log(`✅ [EARNINGS] Alpha Vantage: Got CSV data for ${ticker}, parsing...`);
          console.log(`📄 [EARNINGS] Alpha Vantage: CSV preview:`, response.data.substring(0, 200));
          
          const lines = response.data.split('\n').filter((line: string) => line.trim());
          const earnings: EarningsData[] = [];
          
          // First line is headers: symbol,reportDate,fiscalDateEnding,estimate,currency
          console.log(`📊 [EARNINGS] Alpha Vantage: CSV headers:`, lines[0]);
          
          for (let j = 1; j < lines.length; j++) {
            const values = lines[j].split(',');
            if (values.length >= 2) {
              const date = values[1]?.trim();
              const estimate = values[3] ? parseFloat(values[3]) : null;
              
              if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                earnings.push({
                  ticker: values[0]?.trim() || ticker,
                  date: date,
                  time: 'After Market Close', // Alpha Vantage doesn't provide time
                  epsEstimate: estimate,
                  revenueEstimate: null,
                  source: 'ALPHA_VANTAGE' as const
                });
              }
            }
          }
          
          console.log(`✅ [EARNINGS] Alpha Vantage: Parsed ${earnings.length} earnings for ${ticker}`);
          if (earnings.length > 0) {
            console.log(`📅 [EARNINGS] Alpha Vantage: Next earnings:`, earnings[0]);
          }
          return earnings;
        } else {
          console.warn(`⚠️ [EARNINGS] Alpha Vantage: Invalid response format for ${ticker}`);
        }
      } catch (error: any) {
        console.error(`❌ [EARNINGS] Alpha Vantage: Error for ${ticker}:`, {
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          message: error?.message,
          data: typeof error?.response?.data === 'string' ? error.response.data.substring(0, 200) : error?.response?.data
        });
      }
    }

    console.log(`❌ [EARNINGS] Alpha Vantage: All ${apiKeys.length} keys failed for ${ticker}`);
    return [];
  }

  /**
   * Fetch from Yahoo Finance using their quote API
   */
  private async fetchFromYahooFinance(ticker: string): Promise<EarningsData[]> {
    try {
      console.log(`🌐 [EARNINGS] Yahoo: Trying to fetch earnings for ${ticker}...`);
      
      // Yahoo Finance API v10 - Get quote with earnings date
      const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=calendarEvents,earnings`;
      const response = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      console.log(`📥 [EARNINGS] Yahoo: Response status ${response.status}`);

      if (response.data?.quoteSummary?.result?.[0]?.calendarEvents?.earnings) {
        const earningsData = response.data.quoteSummary.result[0].calendarEvents.earnings;
        const earningsDate = earningsData.earningsDate?.[0]?.raw;
        
        if (earningsDate) {
          const date = new Date(earningsDate * 1000);
          const formattedDate = date.toISOString().split('T')[0];
          
          console.log(`✅ [EARNINGS] Yahoo: Found earnings date for ${ticker}: ${formattedDate}`);
          
          return [{
            ticker,
            date: formattedDate,
            time: 'After Market Close', // Yahoo doesn't always provide time
            epsEstimate: earningsData.earningsAverage?.raw || null,
            revenueEstimate: earningsData.revenueAverage?.raw || null,
            source: 'YAHOO' as const
          }];
        }
      }
      
      console.warn(`⚠️ [EARNINGS] Yahoo: No earnings data in response for ${ticker}`);
      return [];
    } catch (error: any) {
      console.error(`❌ [EARNINGS] Yahoo: Failed for ${ticker}:`, {
        status: error?.response?.status,
        message: error?.message
      });
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
