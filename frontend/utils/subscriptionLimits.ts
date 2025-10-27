// Subscription limits and utilities
export interface SubscriptionLimits {
  maxPortfolios: number;
  maxStocksPerPortfolio: number;
  hasPortfolioAnalysis: boolean;
  hasRiskManagement: boolean;
  hasWatchlist: boolean;
  hasLiveNotifications: boolean;
  hasAdvancedBacktesting: boolean;
  hasWhiteLabel: boolean;
  hasApiAccess: boolean;
}

export const getSubscriptionLimits = (subscriptionTier: string): SubscriptionLimits => {
  // 🆓 FREE APP MODE: Grant unlimited access to all features for all users
  // This allows the app to be approved as free on Google Play Store
  console.log('✅ [SUBSCRIPTION] FREE MODE - Unlimited access for all users');
  
  return {
    maxPortfolios: 999, // Unlimited
    maxStocksPerPortfolio: 999, // Unlimited
    hasPortfolioAnalysis: true,
    hasRiskManagement: true,
    hasWatchlist: true,
    hasLiveNotifications: true,
    hasAdvancedBacktesting: true,
    hasWhiteLabel: true,
    hasApiAccess: true,
  };
};

export const canCreatePortfolio = (currentPortfolios: number, subscriptionTier: string): boolean => {
  // 🆓 FREE APP MODE: Always allow portfolio creation
  return true;
};

export const canAddStock = (currentStocks: number, subscriptionTier: string): boolean => {
  // 🆓 FREE APP MODE: Always allow adding stocks
  return true;
};

export const getUpgradeMessage = (subscriptionTier: string, feature: string): string => {
  switch (subscriptionTier) {
    case 'free':
      return `Upgrade to Premium to access ${feature}`;
    case 'premium':
      return `Upgrade to Premium+ to access ${feature}`;
    default:
      return `Feature not available in your current plan`;
  }
};
