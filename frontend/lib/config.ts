// API Configuration
export const API_CONFIG = {
  // Use environment variable or fallback to localhost
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  ENDPOINTS: {
    HEALTH: '/api/health',
    WATCHLIST: '/api/watchlist',
    WATCHLIST_ALERT: (id: string) => `/api/watchlist/${id}/alert`,
    STOCKS_BATCH_PRICES: '/api/stocks/batch-prices',
    NOTIFICATIONS: '/api/notifications',
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Debug function to log current configuration
export const logApiConfig = () => {
  console.log('🔧 API Configuration:');
  console.log('  Base URL:', API_CONFIG.BASE_URL);
  console.log('  Environment:', process.env.NODE_ENV);
  console.log('  NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
};
