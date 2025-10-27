'use client';

import { ReactNode } from 'react';
import { Crown, Lock } from 'lucide-react';

interface FeatureFlagProps {
  children: ReactNode;
  plan: 'free' | 'premium' | 'premium+';
  currentPlan: 'free' | 'premium' | 'premium+';
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  upgradeMessage?: string;
  className?: string;
}

const planHierarchy = {
  'free': 0,
  'premium': 1,
  'premium+': 2
};

export default function FeatureFlag({
  children,
  plan,
  currentPlan,
  fallback,
  showUpgradePrompt = true,
  upgradeMessage,
  className = ''
}: FeatureFlagProps) {
  // 🆓 FREE APP MODE: Always allow access - no restrictions
  // This allows the app to be approved as free on Google Play Store
  const hasAccess = true;

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const defaultMessage = plan === 'premium' 
    ? 'Upgrade to Premium to unlock this feature'
    : plan === 'premium+'
    ? 'Upgrade to Premium+ to unlock this feature'
    : 'Upgrade your plan to unlock this feature';

  return (
    <div className={`relative ${className}`}>
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay with upgrade prompt */}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-lg">
        <div className="text-center p-6">
          <div className="flex items-center justify-center mb-4">
            {plan === 'premium+' ? (
              <Crown className="w-8 h-8 text-yellow-400" />
            ) : (
              <Lock className="w-8 h-8 text-blue-400" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {plan === 'premium' ? 'Premium Feature' : plan === 'premium+' ? 'Premium+ Feature' : 'Premium Feature'}
          </h3>
          <p className="text-slate-300 mb-4 text-sm">
            {upgradeMessage || defaultMessage}
          </p>
          <button
            onClick={() => window.location.href = '/subscription'}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}

// Convenience components for specific plans
export function PremiumFeature({ children, currentPlan, ...props }: Omit<FeatureFlagProps, 'plan'>) {
  return (
    <FeatureFlag plan="premium" currentPlan={currentPlan} {...props}>
      {children}
    </FeatureFlag>
  );
}

export function PremiumPlusFeature({ children, currentPlan, ...props }: Omit<FeatureFlagProps, 'plan'>) {
  return (
    <FeatureFlag plan="premium+" currentPlan={currentPlan} {...props}>
      {children}
    </FeatureFlag>
  );
}

// Hook for checking feature access
export function useFeatureAccess(currentPlan: 'free' | 'premium' | 'premium+') {
  return {
    hasPremium: planHierarchy[currentPlan] >= planHierarchy['premium'],
    hasPremiumPlus: planHierarchy[currentPlan] >= planHierarchy['premium+'],
    canAccess: (requiredPlan: 'free' | 'premium' | 'premium+') => 
      planHierarchy[currentPlan] >= planHierarchy[requiredPlan]
  };
}
