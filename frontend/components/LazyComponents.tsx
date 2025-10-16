'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Loading component for better UX
const LoadingSpinner = ({ height = 'h-64' }: { height?: string }) => (
  <div className={`${height} flex items-center justify-center bg-slate-800/50 rounded-lg border border-slate-700`}>
    <div className="flex flex-col items-center space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      <p className="text-sm text-slate-400">Loading...</p>
    </div>
  </div>
);

// Lazy load Charts component
export const LazyCharts = dynamic(
  () => import('./Charts'),
  { 
    loading: () => <LoadingSpinner height="h-64" />,
    ssr: false 
  }
);

// Lazy load Analytics components
export const LazyAnalyticsDashboard = dynamic(
  () => import('./Charts'),
  { 
    loading: () => <LoadingSpinner height="h-96" />,
    ssr: false 
  }
);

// Lazy load Notification components
export const LazyNotificationPanel = dynamic(
  () => import('./NotificationPanel'),
  { 
    loading: () => <LoadingSpinner height="h-64" />,
    ssr: false 
  }
);

// Lazy load Market components
export const LazyMarketOverview = dynamic(
  () => import('./MarketOverview'),
  { 
    loading: () => <LoadingSpinner height="h-48" />,
    ssr: false 
  }
);

// Lazy load Portfolio components
export const LazyPortfolioTable = dynamic(
  () => import('./PortfolioTable'),
  { 
    loading: () => <LoadingSpinner height="h-64" />,
    ssr: false 
  }
);

export const LazyPortfolioSummary = dynamic(
  () => import('./PortfolioSummary'),
  { 
    loading: () => <LoadingSpinner height="h-32" />,
    ssr: false 
  }
);

// Lazy load Multi-Portfolio components
export const LazyMultiPortfolioDashboard = dynamic(
  () => import('./MultiPortfolioDashboard'),
  { 
    loading: () => <LoadingSpinner height="h-80" />,
    ssr: false 
  }
);

// Lazy load Risk Management components
export const LazyRiskManagementDashboard = dynamic(
  () => import('./RiskManagementDashboard'),
  { 
    loading: () => <LoadingSpinner height="h-96" />,
    ssr: false 
  }
);

// Lazy load Leaderboard
export const LazyLeaderboard = dynamic(
  () => import('./Leaderboard'),
  { 
    loading: () => <LoadingSpinner height="h-64" />,
    ssr: false 
  }
);
