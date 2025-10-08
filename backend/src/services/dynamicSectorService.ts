import axios from 'axios';

interface StockInfo {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
}

class DynamicSectorService {
  private cache = new Map<string, StockInfo>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  // Get sector from multiple free APIs
  async getSector(ticker: string): Promise<string> {
    const upperTicker = ticker.toUpperCase();
    
    // Check cache first
    const cached = this.cache.get(upperTicker);
    if (cached && Date.now() - (cached as any).timestamp < this.CACHE_DURATION) {
      return cached.sector;
    }

    try {
      // Try Alpha Vantage first (free tier: 5 calls/minute)
      const sector = await this.getSectorFromAlphaVantage(upperTicker);
      if (sector && sector !== 'Unknown') {
        this.cache.set(upperTicker, {
          symbol: upperTicker,
          name: '',
          sector,
          industry: '',
          timestamp: Date.now()
        } as any);
        return sector;
      }
    } catch (error) {
      console.warn(`Alpha Vantage failed for ${upperTicker}:`, error.message);
    }

    try {
      // Try Yahoo Finance as backup
      const sector = await this.getSectorFromYahoo(upperTicker);
      if (sector && sector !== 'Unknown') {
        this.cache.set(upperTicker, {
          symbol: upperTicker,
          name: '',
          sector,
          industry: '',
          timestamp: Date.now()
        } as any);
        return sector;
      }
    } catch (error) {
      console.warn(`Yahoo Finance failed for ${upperTicker}:`, error.message);
    }

    // Fallback to hardcoded mapping
    return this.getSectorFromHardcoded(upperTicker);
  }

  private async getSectorFromAlphaVantage(ticker: string): Promise<string> {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      throw new Error('Alpha Vantage API key not configured');
    }

    const response = await axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: 'OVERVIEW',
        symbol: ticker,
        apikey: apiKey
      },
      timeout: 5000
    });

    const data = response.data;
    if (data && data.Sector && data.Sector !== 'None') {
      return this.mapSectorName(data.Sector);
    }

    return 'Unknown';
  }

  private async getSectorFromYahoo(ticker: string): Promise<string> {
    const response = await axios.get(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}`, {
      params: {
        modules: 'assetProfile'
      },
      timeout: 5000
    });

    const data = response.data;
    if (data?.quoteSummary?.result?.[0]?.assetProfile?.sector) {
      return this.mapSectorName(data.quoteSummary.result[0].assetProfile.sector);
    }

    return 'Unknown';
  }

  private getSectorFromHardcoded(ticker: string): string {
    // Fallback to existing hardcoded mapping
    const hardcodedMap: Record<string, string> = {
      // Technology
      'AAPL': 'Technology', 'MSFT': 'Technology', 'GOOGL': 'Technology', 'GOOG': 'Technology',
      'AMZN': 'Technology', 'TSLA': 'Technology', 'NVDA': 'Technology', 'META': 'Technology',
      'ADBE': 'Technology', 'CRM': 'Technology', 'ORCL': 'Technology', 'INTC': 'Technology',
      'AMD': 'Technology', 'QCOM': 'Technology', 'CSCO': 'Technology', 'IBM': 'Technology',
      'SNOW': 'Technology', 'PLTR': 'Technology', 'COIN': 'Technology', 'HOOD': 'Technology',
      'BABA': 'Technology', 'JD': 'Technology', 'PTON': 'Technology', 'QS': 'Technology',
      'HIMX': 'Technology', 'ONCY': 'Technology', 'AQST': 'Technology',

      // Healthcare
      'JNJ': 'Healthcare', 'PFE': 'Healthcare', 'UNH': 'Healthcare', 'LLY': 'Healthcare',
      'MRK': 'Healthcare', 'ABBV': 'Healthcare', 'TMO': 'Healthcare', 'DHR': 'Healthcare',
      'AMGN': 'Healthcare', 'GILD': 'Healthcare', 'BMY': 'Healthcare', 'MDT': 'Healthcare',

      // Financial Services
      'JPM': 'Financial Services', 'BAC': 'Financial Services', 'V': 'Financial Services',
      'MA': 'Financial Services', 'WFC': 'Financial Services', 'GS': 'Financial Services',
      'MS': 'Financial Services', 'C': 'Financial Services', 'AXP': 'Financial Services',
      'SPG': 'Financial Services', 'BLK': 'Financial Services', 'PYPL': 'Financial Services',
      'AEG': 'Financial Services',

      // Energy
      'XOM': 'Energy', 'CVX': 'Energy', 'SHEL': 'Energy', 'BP': 'Energy',
      'EOG': 'Energy', 'PXD': 'Energy', 'SLB': 'Energy', 'HAL': 'Energy',
      'OXY': 'Energy', 'COP': 'Energy', 'DVN': 'Energy', 'WMB': 'Energy',
      'UEC': 'Energy',

      // Real Estate
      'PLD': 'Real Estate', 'EQIX': 'Real Estate', 'PSA': 'Real Estate', 'AMT': 'Real Estate',
      'SPG': 'Real Estate', 'O': 'Real Estate', 'CCI': 'Real Estate', 'DLR': 'Real Estate',
      'HST': 'Real Estate',

      // Consumer Discretionary
      'HD': 'Consumer Discretionary', 'NKE': 'Consumer Discretionary', 'MCD': 'Consumer Discretionary',
      'SBUX': 'Consumer Discretionary', 'LOW': 'Consumer Discretionary', 'TJX': 'Consumer Discretionary',
      'GM': 'Consumer Discretionary', 'F': 'Consumer Discretionary', 'RCL': 'Consumer Discretionary',
      'LVS': 'Consumer Discretionary', 'WYNN': 'Consumer Discretionary', 'MAR': 'Consumer Discretionary',

      // Consumer Staples
      'PG': 'Consumer Staples', 'KO': 'Consumer Staples', 'PEP': 'Consumer Staples',
      'WMT': 'Consumer Staples', 'COST': 'Consumer Staples', 'MDLZ': 'Consumer Staples',
      'CL': 'Consumer Staples', 'KHC': 'Consumer Staples', 'MON': 'Consumer Staples',
      'HSY': 'Consumer Staples', 'KMB': 'Consumer Staples', 'GIS': 'Consumer Staples',

      // Utilities
      'NEE': 'Utilities', 'DUK': 'Utilities', 'SO': 'Utilities', 'EXC': 'Utilities',
      'SRE': 'Utilities', 'AEP': 'Utilities', 'PCG': 'Utilities', 'XLU': 'Utilities',

      // Industrials
      'GE': 'Industrials', 'MMM': 'Industrials', 'CAT': 'Industrials', 'BA': 'Industrials',
      'HON': 'Industrials', 'LMT': 'Industrials', 'GD': 'Industrials', 'RTX': 'Industrials',
      'UPS': 'Industrials', 'FDX': 'Industrials', 'DE': 'Industrials', 'ETN': 'Industrials',

      // Materials
      'LIN': 'Materials', 'APD': 'Materials', 'ECL': 'Materials', 'SHW': 'Materials',
      'DD': 'Materials', 'NEM': 'Materials', 'FCX': 'Materials', 'MOS': 'Materials',
      'ALB': 'Materials', 'CE': 'Materials', 'IFF': 'Materials', 'LYB': 'Materials',

      // Communication Services
      'T': 'Communication Services', 'CMCSA': 'Communication Services', 'DIS': 'Communication Services',
      'NFLX': 'Communication Services', 'CHTR': 'Communication Services', 'TMUS': 'Communication Services',
      'DISH': 'Communication Services', 'LUMN': 'Communication Services'
    };

    return hardcodedMap[ticker] || 'Other';
  }

  private mapSectorName(apiSector: string): string {
    const sectorMap: Record<string, string> = {
      'Technology': 'Technology',
      'Healthcare': 'Healthcare',
      'Financial Services': 'Financial Services',
      'Financials': 'Financial Services',
      'Consumer Discretionary': 'Consumer Discretionary',
      'Consumer Staples': 'Consumer Staples',
      'Energy': 'Energy',
      'Utilities': 'Utilities',
      'Industrials': 'Industrials',
      'Materials': 'Materials',
      'Real Estate': 'Real Estate',
      'Communication Services': 'Communication Services',
      'Telecommunications': 'Communication Services'
    };

    return sectorMap[apiSector] || 'Other';
  }

  // Get all cached sectors
  getCachedSectors(): StockInfo[] {
    return Array.from(this.cache.values());
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

export const dynamicSectorService = new DynamicSectorService();
