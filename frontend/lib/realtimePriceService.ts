'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export interface PriceUpdate {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

export interface RealtimePriceService {
  connect: () => void;
  disconnect: () => void;
  subscribe: (tickers: string[]) => void;
  unsubscribe: (tickers: string[]) => void;
  onPriceUpdate: (callback: (update: PriceUpdate) => void) => void;
  onConnect: (callback: () => void) => void;
  onDisconnect: (callback: () => void) => void;
  isConnected: () => boolean;
}

class RealtimePriceServiceImpl implements RealtimePriceService {
  private socket: Socket | null = null;
  private priceUpdateCallbacks: ((update: PriceUpdate) => void)[] = [];
  private connectCallbacks: (() => void)[] = [];
  private disconnectCallbacks: (() => void)[] = [];
  private subscribedTickers: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  connect(): void {
    // DISABLE WebSocket connection - backend doesn't support it yet
    // Use polling fallback instead
    console.log('🔌 [REALTIME] WebSocket disabled - using polling fallback');
    this.fallbackToPolling();
    return;

    if (this.socket?.connected) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com';
    const wsUrl = apiUrl.replace('https://', 'wss://').replace('http://', 'ws://');

    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.socket.on('connect', () => {
      console.log('🔌 [REALTIME] Connected to price update service');
      this.reconnectAttempts = 0;
      
      // Resubscribe to previously subscribed tickers
      if (this.subscribedTickers.size > 0) {
        this.subscribe(Array.from(this.subscribedTickers));
      }
      
      this.connectCallbacks.forEach(callback => callback());
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 [REALTIME] Disconnected from price update service:', reason);
      this.disconnectCallbacks.forEach(callback => callback());
    });

    this.socket.on('priceUpdate', (update: PriceUpdate) => {
      this.priceUpdateCallbacks.forEach(callback => callback(update));
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 [REALTIME] Connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔌 [REALTIME] Reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('🔌 [REALTIME] Reconnection error:', error);
      this.handleReconnect();
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔌 [REALTIME] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('🔌 [REALTIME] Max reconnection attempts reached. Falling back to polling.');
      this.fallbackToPolling();
    }
  }

  private fallbackToPolling(): void {
    // Fallback to polling if WebSocket fails
    console.log('🔌 [REALTIME] Falling back to polling for price updates');
    // This would trigger the existing polling mechanism
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.subscribedTickers.clear();
  }

  subscribe(tickers: string[]): void {
    if (!this.socket?.connected) {
      console.warn('🔌 [REALTIME] Cannot subscribe - not connected');
      return;
    }

    const newTickers = tickers.filter(ticker => !this.subscribedTickers.has(ticker));
    
    if (newTickers.length > 0) {
      this.socket.emit('subscribe', newTickers);
      newTickers.forEach(ticker => this.subscribedTickers.add(ticker));
      console.log('🔌 [REALTIME] Subscribed to tickers:', newTickers);
    }
  }

  unsubscribe(tickers: string[]): void {
    if (!this.socket?.connected) {
      return;
    }

    const tickersToUnsubscribe = tickers.filter(ticker => this.subscribedTickers.has(ticker));
    
    if (tickersToUnsubscribe.length > 0) {
      this.socket.emit('unsubscribe', tickersToUnsubscribe);
      tickersToUnsubscribe.forEach(ticker => this.subscribedTickers.delete(ticker));
      console.log('🔌 [REALTIME] Unsubscribed from tickers:', tickersToUnsubscribe);
    }
  }

  onPriceUpdate(callback: (update: PriceUpdate) => void): void {
    this.priceUpdateCallbacks.push(callback);
  }

  onConnect(callback: () => void): void {
    this.connectCallbacks.push(callback);
  }

  onDisconnect(callback: () => void): void {
    this.disconnectCallbacks.push(callback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Cleanup method
  cleanup(): void {
    this.disconnect();
    this.priceUpdateCallbacks = [];
    this.connectCallbacks = [];
    this.disconnectCallbacks = [];
  }
}

// Singleton instance
export const realtimePriceService = new RealtimePriceServiceImpl();

// Hook for React components
export function useRealtimePrices(tickers: string[] = []) {
  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const handlePriceUpdate = (update: PriceUpdate) => {
      setPrices(prev => new Map(prev.set(update.ticker, update)));
    };

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    // Subscribe to events
    realtimePriceService.onPriceUpdate(handlePriceUpdate);
    realtimePriceService.onConnect(handleConnect);
    realtimePriceService.onDisconnect(handleDisconnect);

    // Subscribe to tickers
    if (tickers.length > 0) {
      realtimePriceService.subscribe(tickers);
    }

    // Cleanup
    return () => {
      if (tickers.length > 0) {
        realtimePriceService.unsubscribe(tickers);
      }
    };
  }, [tickers]);

  return {
    prices,
    isConnected,
    subscribe: (newTickers: string[]) => realtimePriceService.subscribe(newTickers),
    unsubscribe: (tickersToRemove: string[]) => realtimePriceService.unsubscribe(tickersToRemove),
  };
}
