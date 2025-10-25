import axios from 'axios';

interface SectorInfo {
  ticker: string;
  sector: string;
  industry: string;
  gicsSector?: string;
  gicsSubIndustry?: string;
  source: string;
  lastUpdated: string;
}

export class SectorLookupService {
  private static instance: SectorLookupService;
  private cache: Map<string, { data: SectorInfo, timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static getInstance(): SectorLookupService {
    if (!SectorLookupService.instance) {
      SectorLookupService.instance = new SectorLookupService();
    }
    return SectorLookupService.instance;
  }

  /**
   * Get sector classification for a stock from professional sources
   * Tries multiple APIs in order: FMP -> Alpha Vantage -> Finnhub
   */
  async getSectorForStock(ticker: string): Promise<SectorInfo | null> {
    // Check cache first
    const cached = this.cache.get(ticker);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`✅ [SECTOR LOOKUP] Cache hit for ${ticker}: ${cached.data.sector}`);
      return cached.data;
    }

    console.log(`🔍 [SECTOR LOOKUP] Fetching sector for ${ticker}...`);

    // Try Financial Modeling Prep first (most reliable)
    try {
      const fmpResult = await this.fetchFromFMP(ticker);
      if (fmpResult) {
        this.cache.set(ticker, { data: fmpResult, timestamp: Date.now() });
        console.log(`✅ [SECTOR LOOKUP] FMP: ${ticker} -> ${fmpResult.sector}`);
        return fmpResult;
      }
    } catch (error: any) {
      console.warn(`⚠️ [SECTOR LOOKUP] FMP failed for ${ticker}:`, error?.message);
    }

    // Try Alpha Vantage (provides GICS classification)
    try {
      const avResult = await this.fetchFromAlphaVantage(ticker);
      if (avResult) {
        this.cache.set(ticker, { data: avResult, timestamp: Date.now() });
        console.log(`✅ [SECTOR LOOKUP] Alpha Vantage: ${ticker} -> ${avResult.sector}`);
        return avResult;
      }
    } catch (error: any) {
      console.warn(`⚠️ [SECTOR LOOKUP] Alpha Vantage failed for ${ticker}:`, error?.message);
    }

    // Try Finnhub as fallback
    try {
      const finnhubResult = await this.fetchFromFinnhub(ticker);
      if (finnhubResult) {
        this.cache.set(ticker, { data: finnhubResult, timestamp: Date.now() });
        console.log(`✅ [SECTOR LOOKUP] Finnhub: ${ticker} -> ${finnhubResult.sector}`);
        return finnhubResult;
      }
    } catch (error: any) {
      console.warn(`⚠️ [SECTOR LOOKUP] Finnhub failed for ${ticker}:`, error?.message);
    }

    console.error(`❌ [SECTOR LOOKUP] All sources failed for ${ticker}`);
    return null;
  }

  private async fetchFromFMP(ticker: string): Promise<SectorInfo | null> {
    try {
      const apiKey = process.env.FMP_API_KEY_1 || process.env.FINANCIAL_MODELING_PREP_API_KEY;
      if (!apiKey) {
        throw new Error('No FMP API key');
      }

      const url = `https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${apiKey}`;
      const response = await axios.get(url, { timeout: 10000 });

      if (response.data && response.data.length > 0) {
        const profile = response.data[0];
        
        // Map FMP sector to standard sector names
        const sector = this.mapSectorToStandard(profile.sector || profile.industryCategory);
        const industry = profile.industry || profile.industryCategory || 'Unknown';
        const gicsSector = profile.sector;
        const gicsSubIndustry = profile.industry;

        return {
          ticker: ticker.toUpperCase(),
          sector,
          industry,
          gicsSector,
          gicsSubIndustry,
          source: 'fmp',
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (error: any) {
      throw new Error(`FMP error: ${error?.message || error}`);
    }

    return null;
  }

  private async fetchFromAlphaVantage(ticker: string): Promise<SectorInfo | null> {
    try {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY_1 || process.env.ALPHA_VANTAGE_API_KEY;
      if (!apiKey) {
        throw new Error('No Alpha Vantage API key');
      }

      const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`;
      const response = await axios.get(url, { timeout: 10000 });

      if (response.data && response.data.Sector && response.data.Industry) {
        return {
          ticker: ticker.toUpperCase(),
          sector: this.mapSectorToStandard(response.data.Sector),
          industry: response.data.Industry,
          gicsSector: response.data.Sector,
          gicsSubIndustry: response.data.Industry,
          source: 'alpha_vantage',
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (error: any) {
      throw new Error(`Alpha Vantage error: ${error?.message || error}`);
    }

    return null;
  }

  private async fetchFromFinnhub(ticker: string): Promise<SectorInfo | null> {
    try {
      const apiKey = process.env.FINNHUB_API_KEY_1 || process.env.FINNHUB_API_KEY;
      if (!apiKey) {
        throw new Error('No Finnhub API key');
      }

      const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${apiKey}`;
      const response = await axios.get(url, { timeout: 10000 });

      if (response.data && response.data.finnhubIndustry) {
        // Finnhub provides industry, we need to infer sector
        const industry = response.data.finnhubIndustry;
        const sector = this.inferSectorFromIndustry(industry);

        return {
          ticker: ticker.toUpperCase(),
          sector,
          industry,
          source: 'finnhub',
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (error: any) {
      throw new Error(`Finnhub error: ${error?.message || error}`);
    }

    return null;
  }

  /**
   * Map various sector names to standard sectors
   */
  private mapSectorToStandard(sector: string): string {
    if (!sector) return 'Other';

    const s = sector.toLowerCase();
    
    // Technology
    if (s.includes('technology') || s.includes('software') || s.includes('semiconductor') || 
        s.includes('tech') || s.includes('computer') || s.includes('internet')) {
      return 'Technology';
    }

    // Healthcare
    if (s.includes('healthcare') || s.includes('health care') || s.includes('pharmaceutical') || 
        s.includes('biotech') || s.includes('biotechnology') || s.includes('medical')) {
      return 'Healthcare';
    }

    // Financials
    if (s.includes('financial') || s.includes('bank') || s.includes('insurance') || 
        s.includes('capital markets') || s.includes('investment') || s.includes('credit')) {
      return 'Financials';
    }

    // Energy
    if (s.includes('energy') || s.includes('oil') || s.includes('gas') || 
        s.includes('petroleum') || s.includes('electricity')) {
      return 'Energy';
    }

    // Consumer Discretionary
    if (s.includes('consumer discretionary') || s.includes('retail') || s.includes('auto') ||
        s.includes('hotel') || s.includes('restaurant') || s.includes('leisure')) {
      return 'Consumer Discretionary';
    }

    // Consumer Staples
    if (s.includes('consumer staples') || s.includes('food') || s.includes('beverage') ||
        s.includes('tobacco') || s.includes('household') || s.includes('personal care')) {
      return 'Consumer Staples';
    }

    // Industrials
    if (s.includes('industrial') || s.includes('aerospace') || s.includes('defense') ||
        s.includes('machinery') || s.includes('transportation')) {
      return 'Industrials';
    }

    // Materials
    if (s.includes('material') || s.includes('chemical') || s.includes('metal') ||
        s.includes('mining') || s.includes('paper')) {
      return 'Materials';
    }

    // Real Estate
    if (s.includes('real estate') || s.includes('reit') || s.includes('property')) {
      return 'Real Estate';
    }

    // Utilities
    if (s.includes('utility') || s.includes('electric utility') || s.includes('gas utility')) {
      return 'Utilities';
    }

    // Communication Services
    if (s.includes('communication') || s.includes('telecommunication') || 
        s.includes('media') || s.includes('entertainment')) {
      return 'Communication Services';
    }

    return 'Other';
  }

  /**
   * Infer sector from industry when only industry is available
   */
  private inferSectorFromIndustry(industry: string): string {
    if (!industry) return 'Other';
    
    // Map common industries to sectors
    const s = industry.toLowerCase();
    
    if (s.includes('auto') || s.includes('vehicle') || s.includes('motor')) {
      return 'Consumer Discretionary';
    }
    
    if (s.includes('bank') || s.includes('financial') || s.includes('credit')) {
      return 'Financials';
    }
    
    if (s.includes('tech') || s.includes('software') || s.includes('semiconductor')) {
      return 'Technology';
    }
    
    if (s.includes('health') || s.includes('pharma') || s.includes('medical')) {
      return 'Healthcare';
    }
    
    return this.mapSectorToStandard(industry);
  }

  /**
   * Batch lookup for multiple stocks
   */
  async getSectorsForStocks(tickers: string[]): Promise<Map<string, SectorInfo>> {
    const results = new Map<string, SectorInfo>();
    
    console.log(`🔍 [SECTOR LOOKUP] Batch lookup for ${tickers.length} stocks...`);
    
    for (const ticker of tickers) {
      try {
        const sectorInfo = await this.getSectorForStock(ticker);
        if (sectorInfo) {
          results.set(ticker.toUpperCase(), sectorInfo);
        }
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ [SECTOR LOOKUP] Failed to get sector for ${ticker}:`, error);
      }
    }

    console.log(`✅ [SECTOR LOOKUP] Batch lookup complete: ${results.size}/${tickers.length} succeeded`);
    return results;
  }
}

export default SectorLookupService;
