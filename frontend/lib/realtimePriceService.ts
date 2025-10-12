// Real-time Price Service for Watchlist
// Major's requirement: "Integrate real-time data for watchlist prices"

import axios from 'axios';
import Cookies from 'js-cookie';

interface PriceUpdate {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  lastUpdated: Date;
}

interface RealtimePriceService {
  startUpdates: (tickers: string[], onUpdate: (updates: PriceUpdate[]) => void) => void;
  stopUpdates: () => void;
  isRunning: () => boolean;
}

class RealtimePriceServiceImpl implements RealtimePriceService {
  private intervalId: NodeJS.Timeout | null = null;
  private isActive = false;
  private currentTickers: string[] = [];
  private updateCallback: ((updates: PriceUpdate[]) => void) | null = null;
  private readonly UPDATE_INTERVAL = 60000; // 🚀 PERFORMANCE: Increased from 30s to 60s to reduce API load
  private lastFetchTime = 0;
  private readonly MIN_FETCH_INTERVAL = 10000; // Minimum 10 seconds between fetches
  private priceCache = new Map<string, { price: number; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 second cache for prices

  startUpdates(tickers: string[], onUpdate: (updates: PriceUpdate[]) => void): void {
    console.log('🚀 Starting real-time price updates for:', tickers);
    
    this.currentTickers = tickers;
    this.updateCallback = onUpdate;
    this.isActive = true;

    // Start immediate update
    this.fetchPrices();

    // Set up interval
    this.intervalId = setInterval(() => {
      if (this.isActive) {
        this.fetchPrices();
      }
    }, this.UPDATE_INTERVAL);
  }

  stopUpdates(): void {
    console.log('🛑 Stopping real-time price updates');
    
    this.isActive = false;
    this.currentTickers = [];
    this.updateCallback = null;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  isRunning(): boolean {
    return this.isActive;
  }

  private async fetchPrices(): Promise<void> {
    if (!this.isActive || this.currentTickers.length === 0 || !this.updateCallback) {
      return;
    }

    // 🚀 PERFORMANCE: Throttle requests to avoid too frequent API calls
    const now = Date.now();
    if (now - this.lastFetchTime < this.MIN_FETCH_INTERVAL) {
      console.log('📊 [THROTTLE] Skipping fetch - too soon since last request');
      return;
    }

    try {
      const token = Cookies.get('token');
      if (!token) {
        console.warn('⚠️ No auth token for price updates');
        return;
      }

      // 🚀 PERFORMANCE: Check cache first for recent prices
      const cachedUpdates: PriceUpdate[] = [];
      const tickersToFetch: string[] = [];

      for (const ticker of this.currentTickers) {
        const cached = this.priceCache.get(ticker);
        if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
          cachedUpdates.push({
            ticker,
            currentPrice: cached.price,
            change: 0, // We don't cache change data
            changePercent: 0,
            lastUpdated: new Date(cached.timestamp)
          });
        } else {
          tickersToFetch.push(ticker);
        }
      }

      // If we have all data in cache, return it
      if (tickersToFetch.length === 0 && cachedUpdates.length > 0) {
        console.log('📊 [CACHE HIT] Using cached prices for all tickers');
        this.updateCallback(cachedUpdates);
        return;
      }

      console.log(`📊 Fetching real-time prices for: ${tickersToFetch.length} tickers (${cachedUpdates.length} cached)`);

      this.lastFetchTime = now;
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stocks/batch-prices`,
        { tickers: tickersToFetch.length > 0 ? tickersToFetch : this.currentTickers },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'max-age=30' // Request caching at HTTP level
          },
          timeout: 5000 // 🚀 PERFORMANCE: Reduced timeout from default to 5s
        }
      );

      if (response.data && response.data.prices) {
        const fetchedUpdates: PriceUpdate[] = response.data.prices.map((price: any) => {
          const ticker = price.ticker;
          const currentPrice = price.currentPrice || price.price || 0;
          
          // 🚀 PERFORMANCE: Cache the price data
          this.priceCache.set(ticker, {
            price: currentPrice,
            timestamp: now
          });

          return {
            ticker,
            currentPrice,
            change: price.change || 0,
            changePercent: price.changePercent || 0,
            lastUpdated: new Date()
          };
        });

        // Combine cached and fetched updates
        const allUpdates = [...cachedUpdates, ...fetchedUpdates];
        
        console.log(`✅ Real-time price updates: ${fetchedUpdates.length} fetched + ${cachedUpdates.length} cached = ${allUpdates.length} total`);
        this.updateCallback(allUpdates);
      }
    } catch (error) {
      console.error('❌ Failed to fetch real-time prices:', error);
      
      // 🚀 PERFORMANCE: On error, try to return cached data if available
      const cachedUpdates: PriceUpdate[] = [];
      const now = Date.now();
      
      for (const ticker of this.currentTickers) {
        const cached = this.priceCache.get(ticker);
        if (cached) { // Return even slightly stale data on error
          cachedUpdates.push({
            ticker,
            currentPrice: cached.price,
            change: 0,
            changePercent: 0,
            lastUpdated: new Date(cached.timestamp)
          });
        }
      }
      
      if (cachedUpdates.length > 0) {
        console.log(`📊 [FALLBACK] Using ${cachedUpdates.length} cached prices due to API error`);
        this.updateCallback(cachedUpdates);
      }
      
      // Don't stop updates on error, just log it
      if (axios.isAxiosError(error)) {
        console.error('❌ API Error:', {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
      }
    }
  }
}

// Create singleton instance
export const realtimePriceService = new RealtimePriceServiceImpl();

// Export types
export type { PriceUpdate, RealtimePriceService };
