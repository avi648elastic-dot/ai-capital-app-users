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
  private readonly UPDATE_INTERVAL = 30000; // 30 seconds

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

    try {
      const token = Cookies.get('token');
      if (!token) {
        console.warn('⚠️ No auth token for price updates');
        return;
      }

      console.log('📊 Fetching real-time prices for:', this.currentTickers);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stocks/batch-prices`,
        { tickers: this.currentTickers },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.prices) {
        const updates: PriceUpdate[] = response.data.prices.map((price: any) => ({
          ticker: price.ticker,
          currentPrice: price.currentPrice || price.price || 0,
          change: price.change || 0,
          changePercent: price.changePercent || 0,
          lastUpdated: new Date()
        }));

        console.log('✅ Real-time price updates received:', updates);
        this.updateCallback(updates);
      }
    } catch (error) {
      console.error('❌ Failed to fetch real-time prices:', error);
      
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
