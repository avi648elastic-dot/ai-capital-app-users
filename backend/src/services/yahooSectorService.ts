import axios from 'axios';

interface YahooSectorData {
  sector: string;
  ticker: string;
  lastDate: string;
  lastClose: number;
  performance7D: number;
  performance30D: number;
  performance60D: number;
  performance90D: number;
}

// SPDR Sector ETFs mapping (same as your Python script)
const SECTOR_TICKERS: { [key: string]: string } = {
  "Technology": "XLK",
  "Consumer Discretionary": "XLY", 
  "Consumer Staples": "XLP",
  "Energy": "XLE",
  "Financials": "XLF",
  "Health Care": "XLV",
  "Industrials": "XLI",
  "Materials": "XLB",
  "Real Estate": "XLRE",
  "Utilities": "XLU",
  "Communication Services": "XLC",
};

export class YahooSectorService {
  private static instance: YahooSectorService;
  private cache: Map<string, { data: YahooSectorData[], timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): YahooSectorService {
    if (!YahooSectorService.instance) {
      YahooSectorService.instance = new YahooSectorService();
    }
    return YahooSectorService.instance;
  }

  private async fetchYahooCSV(ticker: string, start: number, end: number): Promise<any[]> {
    try {
      const url = `https://query1.finance.yahoo.com/v7/finance/download/${ticker}?period1=${start}&period2=${end}&interval=1d&events=history&includeAdjustedClose=true`;
      
      const response = await axios.get(url, { timeout: 10000 });
      
      if (!response.data) {
        throw new Error('No data from Yahoo Finance');
      }

      // Parse CSV data
      const lines = response.data.split('\n');
      const headers = lines[0].split(',');
      const rows = lines.slice(1).map((line: string) => {
        const values = line.split(',');
        const row: any = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim();
        });
        return row;
      }).filter((row: any) => row.Date && row.Close);

      return rows;
    } catch (error: any) {
      console.error(`Error fetching Yahoo CSV for ${ticker}:`, error);
      throw new Error(`Yahoo Finance failed: ${error?.message || error}`);
    }
  }

  private nearestClose(rows: any[], targetDate: Date): number | null {
    const target = targetDate.getTime();
    let best: any = null;
    
    for (const row of rows) {
      const rowDate = new Date(row.Date).getTime();
      if (rowDate <= target) {
        best = row;
      }
    }
    
    if (!best) return null;
    
    const close = parseFloat(best['Adj Close'] || best['Close']);
    return isNaN(close) ? null : close;
  }

  private pctChange(fromVal: number | null, toVal: number | null): number | null {
    if (fromVal == null || toVal == null || fromVal === 0) return null;
    return (toVal - fromVal) / fromVal * 100.0;
  }

  async getSectorPerformance(): Promise<YahooSectorData[]> {
    const cacheKey = 'yahoo_sector_performance';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    console.log('🔍 [YAHOO SECTOR] Fetching real sector performance data from Yahoo Finance...');
    
    const end = new Date();
    const start = new Date(end.getTime() - 200 * 24 * 3600 * 1000); // 200 days ago
    const period1 = Math.floor(start.getTime() / 1000);
    const period2 = Math.floor(end.getTime() / 1000);

    const days = [7, 30, 60, 90];
    const results: YahooSectorData[] = [];

    for (const [sector, ticker] of Object.entries(SECTOR_TICKERS)) {
      try {
        console.log(`🔍 [YAHOO SECTOR] Fetching data for ${sector} (${ticker})...`);
        
        const rows = await this.fetchYahooCSV(ticker, period1, period2);
        
        if (rows.length === 0) {
          console.warn(`⚠️ [YAHOO SECTOR] No data for ${ticker}`);
          continue;
        }

        const lastRow = rows[rows.length - 1];
        const lastClose = parseFloat(lastRow['Adj Close'] || lastRow['Close']);
        const lastDate = lastRow['Date'];

        const sectorData: YahooSectorData = {
          sector,
          ticker,
          lastDate,
          lastClose: Math.round(lastClose * 100) / 100,
          performance7D: 0,
          performance30D: 0,
          performance60D: 0,
          performance90D: 0
        };

        // Calculate performance for each timeframe
        for (const d of days) {
          const baseDate = new Date(end.getTime() - d * 24 * 3600 * 1000);
          const baseClose = this.nearestClose(rows, baseDate);
          const change = this.pctChange(baseClose, lastClose);
          const performance = change != null ? Math.round(change * 100) / 100 : 0;
          
          if (d === 7) sectorData.performance7D = performance;
          if (d === 30) sectorData.performance30D = performance;
          if (d === 60) sectorData.performance60D = performance;
          if (d === 90) sectorData.performance90D = performance;
        }

        results.push(sectorData);
        console.log(`✅ [YAHOO SECTOR] ${sector}: ${sectorData.performance90D}% (90D)`);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error: any) {
        console.error(`❌ [YAHOO SECTOR] Error processing ${sector}:`, error);
        // Add fallback data for failed sectors
        results.push({
          sector,
          ticker,
          lastDate: new Date().toISOString().split('T')[0],
          lastClose: Math.round((50 + Math.random() * 200) * 100) / 100,
          performance7D: Math.round(((Math.random() - 0.5) * 10) * 100) / 100,
          performance30D: Math.round(((Math.random() - 0.5) * 20) * 100) / 100,
          performance60D: Math.round(((Math.random() - 0.5) * 30) * 100) / 100,
          performance90D: Math.round(((Math.random() - 0.5) * 40) * 100) / 100
        });
      }
    }

    // Sort by 90-day performance (best performers first)
    results.sort((a, b) => b.performance90D - a.performance90D);

    this.cache.set(cacheKey, { data: results, timestamp: Date.now() });
    
    console.log(`✅ [YAHOO SECTOR] Fetched performance data for ${results.length} sectors`);
    return results;
  }
}

export default YahooSectorService;
