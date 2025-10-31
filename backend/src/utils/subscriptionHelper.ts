import User from '../models/User';

/**
 * Get effective subscription tier for a user
 * This checks if user is in trial period and grants premium+ access if so
 * Admin users always have premium+ access
 */
export async function getEffectiveSubscriptionTier(userId: string): Promise<'free' | 'premium' | 'premium+'> {
  const user = await User.findById(userId);
  if (!user) return 'free';

  // Admins always have premium+ access
  if (user.isAdmin === true || user.role === 'admin') {
    return 'premium+';
  }

  // Check if user is in active trial period
  if (user.isTrialActive && user.trialEndDate) {
    const now = new Date();
    if (now < user.trialEndDate) {
      // Trial is still active
      return 'premium+';
    } else {
      // Trial has expired, but user might not have been downgraded yet
      // This will be handled by the cron job, but we return actual tier here
      return user.subscriptionTier;
    }
  }

  // Check subscription status
  if (user.subscriptionActive && user.subscriptionStatus === 'active') {
    return user.subscriptionTier;
  }

  // Default to free
  return 'free';
}

/**
 * Check if user has access to a feature based on subscription tier
 */
export async function hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
  const tier = await getEffectiveSubscriptionTier(userId);
  
  switch (feature) {
    case 'portfolioAnalysis':
      return tier !== 'free';
    case 'riskManagement':
    case 'watchlist':
      return tier === 'premium+';
    default:
      return true;
  }
}

/**
 * Check if trial period is active for a user
 */
export function isTrialActive(user: any): boolean {
  if (!user.isTrialActive || !user.trialEndDate) {
    return false;
  }
  
  const now = new Date();
  return now < user.trialEndDate;
}

