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
  // Subscription restrictions are now active
  switch (subscriptionTier) {
    case 'free':
      return {
        maxPortfolios: 1,
        maxStocksPerPortfolio: 10,
        hasPortfolioAnalysis: false,
        hasRiskManagement: false,
        hasWatchlist: false,
        hasLiveNotifications: false,
        hasAdvancedBacktesting: false,
        hasWhiteLabel: false,
        hasApiAccess: false,
      };
    
    case 'premium':
      return {
        maxPortfolios: 6, // 3 Solid + 3 Risky
        maxStocksPerPortfolio: 15,
        hasPortfolioAnalysis: true,
        hasRiskManagement: false, // Premium+ only
        hasWatchlist: false, // Premium+ only
        hasLiveNotifications: true,
        hasAdvancedBacktesting: false,
        hasWhiteLabel: false,
        hasApiAccess: false,
      };
    
    case 'premium+':
      return {
        maxPortfolios: 10, // 5 Solid + 5 Risky
        maxStocksPerPortfolio: 20,
        hasPortfolioAnalysis: true,
        hasRiskManagement: true,
        hasWatchlist: true,
        hasLiveNotifications: true,
        hasAdvancedBacktesting: true,
        hasWhiteLabel: true,
        hasApiAccess: true,
      };
    
    default:
      return {
        maxPortfolios: 1,
        maxStocksPerPortfolio: 10,
        hasPortfolioAnalysis: false,
        hasRiskManagement: false,
        hasWatchlist: false,
        hasLiveNotifications: false,
        hasAdvancedBacktesting: false,
        hasWhiteLabel: false,
        hasApiAccess: false,
      };
  }
};

export const canCreatePortfolio = (currentPortfolios: number, subscriptionTier: string): boolean => {
  const limits = getSubscriptionLimits(subscriptionTier);
  return currentPortfolios < limits.maxPortfolios;
};

export const canAddStock = (currentStocks: number, subscriptionTier: string): boolean => {
  const limits = getSubscriptionLimits(subscriptionTier);
  return currentStocks < limits.maxStocksPerPortfolio;
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
