// Sector classification service for portfolio analytics
export interface SectorData {
  sector: string;
  percentage: number;
  value: number;
  performance90D: number;
  stocks: string[];
  color: string;
}

export interface PortfolioAnalysis {
  sectorAllocation: SectorData[];
  totalValue: number;
  riskMetrics: {
    concentration: number;
    diversification: number;
    volatility: number;
  };
  performance90D: number;
}

class SectorService {
  // Stock ticker to sector mapping
  private sectorMap: Record<string, string> = {
    // Technology
    'AAPL': 'Technology',
    'MSFT': 'Technology',
    'GOOGL': 'Technology',
    'GOOG': 'Technology',
    'AMZN': 'Technology',
    'TSLA': 'Technology',
    'NVDA': 'Technology',
    'META': 'Technology',
    'NFLX': 'Technology',
    'ADBE': 'Technology',
    'CRM': 'Technology',
    'ORCL': 'Technology',
    'INTC': 'Technology',
    'AMD': 'Technology',
    'QCOM': 'Technology',
    'CSCO': 'Technology',
    'IBM': 'Technology',
    'SNOW': 'Technology',
    'PLTR': 'Technology',
    'COIN': 'Technology',
    'HOOD': 'Technology',
    'BABA': 'Technology',
    'JD': 'Technology',
    'PTON': 'Technology',
    'QS': 'Technology',
    'HIMX': 'Technology',
    'ONCY': 'Technology',
    'AQST': 'Technology',
    
    // Healthcare
    'JNJ': 'Healthcare',
    'PFE': 'Healthcare',
    'UNH': 'Healthcare',
    'ABBV': 'Healthcare',
    'MRK': 'Healthcare',
    'TMO': 'Healthcare',
    'ABT': 'Healthcare',
    'DHR': 'Healthcare',
    'BMY': 'Healthcare',
    'AMGN': 'Healthcare',
    'GILD': 'Healthcare',
    'CVS': 'Healthcare',
    'CI': 'Healthcare',
    'HUM': 'Healthcare',
    'ANTM': 'Healthcare',
    'ISRG': 'Healthcare',
    'SYK': 'Healthcare',
    'BDX': 'Healthcare',
    'EW': 'Healthcare',
    'ZTS': 'Healthcare',
    
    // Financial Services
    'JPM': 'Financial Services',
    'BAC': 'Financial Services',
    'WFC': 'Financial Services',
    'GS': 'Financial Services',
    'MS': 'Financial Services',
    'C': 'Financial Services',
    'AXP': 'Financial Services',
    'BLK': 'Financial Services',
    'SCHW': 'Financial Services',
    'COF': 'Financial Services',
    'USB': 'Financial Services',
    'PNC': 'Financial Services',
    'TFC': 'Financial Services',
    'BK': 'Financial Services',
    'STT': 'Financial Services',
    
    // Consumer Discretionary
    'HD': 'Consumer Discretionary',
    'MCD': 'Consumer Discretionary',
    'NKE': 'Consumer Discretionary',
    'SBUX': 'Consumer Discretionary',
    'LOW': 'Consumer Discretionary',
    'TJX': 'Consumer Discretionary',
    'TGT': 'Consumer Discretionary',
    'COST': 'Consumer Discretionary',
    'BKNG': 'Consumer Discretionary',
    'CMG': 'Consumer Discretionary',
    
    // Energy
    'XOM': 'Energy',
    'CVX': 'Energy',
    'COP': 'Energy',
    'EOG': 'Energy',
    'SLB': 'Energy',
    'OXY': 'Energy',
    'PXD': 'Energy',
    'KMI': 'Energy',
    'WMB': 'Energy',
    'PSX': 'Energy',
    
    // Industrial
    'BA': 'Industrial',
    'CAT': 'Industrial',
    'GE': 'Industrial',
    'HON': 'Industrial',
    'UPS': 'Industrial',
    'RTX': 'Industrial',
    'LMT': 'Industrial',
    'NOC': 'Industrial',
    'GD': 'Industrial',
    'MMM': 'Industrial',
    
    // Consumer Staples
    'PG': 'Consumer Staples',
    'KO': 'Consumer Staples',
    'PEP': 'Consumer Staples',
    'WMT': 'Consumer Staples',
    'CL': 'Consumer Staples',
    'KMB': 'Consumer Staples',
    'GIS': 'Consumer Staples',
    'HSY': 'Consumer Staples',
    'K': 'Consumer Staples',
    'CPB': 'Consumer Staples',
    
    // Utilities
    'NEE': 'Utilities',
    'DUK': 'Utilities',
    'SO': 'Utilities',
    'D': 'Utilities',
    'AEP': 'Utilities',
    'EXC': 'Utilities',
    'XEL': 'Utilities',
    'SRE': 'Utilities',
    'PEG': 'Utilities',
    'WEC': 'Utilities',
    
    // Real Estate
    'AMT': 'Real Estate',
    'PLD': 'Real Estate',
    'CCI': 'Real Estate',
    'EQIX': 'Real Estate',
    'PSA': 'Real Estate',
    'O': 'Real Estate',
    'SPG': 'Real Estate',
    'WELL': 'Real Estate',
    'EXR': 'Real Estate',
    'AVB': 'Real Estate',
    
    // Materials
    'LIN': 'Materials',
    'APD': 'Materials',
    'SHW': 'Materials',
    'ECL': 'Materials',
    'DD': 'Materials',
    'DOW': 'Materials',
    'PPG': 'Materials',
    'NEM': 'Materials',
    'FCX': 'Materials',
    'VMC': 'Materials',
    
    // Communication Services
    'VZ': 'Communication Services',
    'T': 'Communication Services',
    'CMCSA': 'Communication Services',
    'DIS': 'Communication Services',
    'NFLX': 'Communication Services',
    'CHTR': 'Communication Services',
    'TMUS': 'Communication Services',
    'DISH': 'Communication Services',
    'LUMN': 'Communication Services',
    'VZ': 'Communication Services'
  };

  private sectorColors: Record<string, string> = {
    'Technology': 'bg-blue-500',
    'Healthcare': 'bg-green-500',
    'Financial Services': 'bg-yellow-500',
    'Consumer Discretionary': 'bg-purple-500',
    'Energy': 'bg-red-500',
    'Industrial': 'bg-orange-500',
    'Consumer Staples': 'bg-pink-500',
    'Utilities': 'bg-cyan-500',
    'Real Estate': 'bg-indigo-500',
    'Materials': 'bg-amber-500',
    'Communication Services': 'bg-teal-500'
  };

  // Get sector for a stock ticker
  getSector(ticker: string): string {
    return this.sectorMap[ticker.toUpperCase()] || 'Other';
  }

  // Get color for a sector
  getSectorColor(sector: string): string {
    return this.sectorColors[sector] || 'bg-gray-500';
  }

  // Analyze portfolio and return sector allocation
  async analyzePortfolio(portfolio: any[]): Promise<PortfolioAnalysis> {
    const sectorMap = new Map<string, { stocks: string[], value: number, entryValue: number }>();
    let totalValue = 0;
    let totalEntryValue = 0;

    // Group stocks by sector
    portfolio.forEach(stock => {
      const sector = this.getSector(stock.ticker);
      const currentValue = stock.currentPrice * stock.shares;
      const entryValue = stock.entryPrice * stock.shares;
      
      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, { stocks: [], value: 0, entryValue: 0 });
      }
      
      const sectorData = sectorMap.get(sector)!;
      sectorData.stocks.push(stock.ticker);
      sectorData.value += currentValue;
      sectorData.entryValue += entryValue;
      
      totalValue += currentValue;
      totalEntryValue += entryValue;
    });

    // Calculate sector allocation
    const sectorAllocation: SectorData[] = Array.from(sectorMap.entries()).map(([sector, data]) => {
      const percentage = totalValue > 0 ? (data.value / totalValue) * 100 : 0;
      const performance90D = data.entryValue > 0 ? ((data.value - data.entryValue) / data.entryValue) * 100 : 0;
      
      return {
        sector,
        percentage: Math.round(percentage * 10) / 10,
        value: Math.round(data.value * 100) / 100,
        performance90D: Math.round(performance90D * 10) / 10,
        stocks: data.stocks,
        color: this.getSectorColor(sector)
      };
    }).sort((a, b) => b.percentage - a.percentage);

    // Calculate risk metrics
    const concentration = Math.max(...sectorAllocation.map(s => s.percentage));
    const diversification = sectorAllocation.length;
    const volatility = this.calculatePortfolioVolatility(portfolio);
    
    const performance90D = totalEntryValue > 0 ? ((totalValue - totalEntryValue) / totalEntryValue) * 100 : 0;

    return {
      sectorAllocation,
      totalValue: Math.round(totalValue * 100) / 100,
      riskMetrics: {
        concentration: Math.round(concentration * 10) / 10,
        diversification,
        volatility: Math.round(volatility * 10) / 10
      },
      performance90D: Math.round(performance90D * 10) / 10
    };
  }

  // Calculate portfolio volatility (simplified)
  private calculatePortfolioVolatility(portfolio: any[]): number {
    if (portfolio.length === 0) return 0;
    
    // Use average volatility of individual stocks
    const avgVolatility = portfolio.reduce((sum, stock) => {
      // Estimate volatility based on price movement
      const priceChange = Math.abs(stock.currentPrice - stock.entryPrice) / stock.entryPrice;
      return sum + (priceChange * 100); // Convert to percentage
    }, 0) / portfolio.length;
    
    return Math.min(avgVolatility * 2, 50); // Cap at 50%
  }
}

export const sectorService = new SectorService();
