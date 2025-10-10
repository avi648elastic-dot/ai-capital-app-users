'use client';

// Feature preview SVG images for locked navigation items
export const FeaturePreviewImages = {
  analytics: (
    <svg viewBox="0 0 400 200" className="w-full h-full">
      <defs>
        <linearGradient id="analyticsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="#1E293B" />
      {/* Chart bars */}
      <rect x="50" y="120" width="40" height="60" fill="url(#analyticsGrad)" rx="4" />
      <rect x="110" y="80" width="40" height="100" fill="url(#analyticsGrad)" rx="4" />
      <rect x="170" y="100" width="40" height="80" fill="url(#analyticsGrad)" rx="4" />
      <rect x="230" y="60" width="40" height="120" fill="url(#analyticsGrad)" rx="4" />
      <rect x="290" y="90" width="40" height="90" fill="url(#analyticsGrad)" rx="4" />
      {/* Line chart */}
      <polyline
        points="50,140 110,100 170,120 230,70 290,110 350,80"
        fill="none"
        stroke="#10B981"
        strokeWidth="3"
        opacity="0.6"
      />
      {/* Title */}
      <text x="200" y="30" fill="#F1F5F9" fontSize="20" fontWeight="bold" textAnchor="middle">
        Advanced Analytics
      </text>
    </svg>
  ),

  riskManagement: (
    <svg viewBox="0 0 400 200" className="w-full h-full">
      <defs>
        <linearGradient id="riskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="#1E293B" />
      {/* Gauge/Meter */}
      <circle cx="200" cy="120" r="60" fill="none" stroke="#334155" strokeWidth="12" />
      <circle
        cx="200"
        cy="120"
        r="60"
        fill="none"
        stroke="url(#riskGrad)"
        strokeWidth="12"
        strokeDasharray="188 377"
        strokeLinecap="round"
        transform="rotate(-90 200 120)"
      />
      {/* Needle */}
      <line x1="200" y1="120" x2="200" y2="70" stroke="#F1F5F9" strokeWidth="3" strokeLinecap="round" />
      <circle cx="200" cy="120" r="8" fill="#F1F5F9" />
      {/* Title */}
      <text x="200" y="30" fill="#F1F5F9" fontSize="20" fontWeight="bold" textAnchor="middle">
        Risk Management
      </text>
    </svg>
  ),

  reports: (
    <svg viewBox="0 0 400 200" className="w-full h-full">
      <defs>
        <linearGradient id="reportsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="#1E293B" />
      {/* Document icon */}
      <rect x="120" y="50" width="160" height="120" fill="#334155" rx="8" />
      <rect x="140" y="70" width="120" height="8" fill="url(#reportsGrad)" rx="4" />
      <rect x="140" y="90" width="100" height="6" fill="#475569" rx="3" />
      <rect x="140" y="105" width="80" height="6" fill="#475569" rx="3" />
      <rect x="140" y="120" width="120" height="8" fill="url(#reportsGrad)" rx="4" />
      <rect x="140" y="140" width="90" height="6" fill="#475569" rx="3" />
      {/* Title */}
      <text x="200" y="30" fill="#F1F5F9" fontSize="20" fontWeight="bold" textAnchor="middle">
        Detailed Reports
      </text>
    </svg>
  ),

  watchlist: (
    <svg viewBox="0 0 400 200" className="w-full h-full">
      <defs>
        <linearGradient id="watchlistGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="#1E293B" />
      {/* List items */}
      <rect x="60" y="60" width="280" height="25" fill="#334155" rx="6" />
      <circle cx="80" cy="72.5" r="6" fill="url(#watchlistGrad)" />
      <rect x="60" y="95" width="280" height="25" fill="#334155" rx="6" />
      <circle cx="80" cy="107.5" r="6" fill="url(#watchlistGrad)" />
      <rect x="60" y="130" width="280" height="25" fill="#334155" rx="6" />
      <circle cx="80" cy="142.5" r="6" fill="url(#watchlistGrad)" />
      {/* Star icon */}
      <path
        d="M 320 72.5 L 323 79 L 330 79 L 324 83 L 327 90 L 320 85 L 313 90 L 316 83 L 310 79 L 317 79 Z"
        fill="#FBBF24"
      />
      {/* Title */}
      <text x="200" y="40" fill="#F1F5F9" fontSize="20" fontWeight="bold" textAnchor="middle">
        Stock Watchlist
      </text>
    </svg>
  ),

  multiPortfolio: (
    <svg viewBox="0 0 400 200" className="w-full h-full">
      <defs>
        <linearGradient id="portfolioGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="#1E293B" />
      {/* Portfolio cards */}
      <rect x="50" y="60" width="80" height="100" fill="#334155" rx="8" />
      <rect x="50" y="60" width="80" height="30" fill="url(#portfolioGrad)" rx="8" />
      <rect x="160" y="60" width="80" height="100" fill="#334155" rx="8" />
      <rect x="160" y="60" width="80" height="30" fill="url(#portfolioGrad)" rx="8" />
      <rect x="270" y="60" width="80" height="100" fill="#334155" rx="8" />
      <rect x="270" y="60" width="80" height="30" fill="url(#portfolioGrad)" rx="8" />
      {/* Title */}
      <text x="200" y="40" fill="#F1F5F9" fontSize="20" fontWeight="bold" textAnchor="middle">
        Multiple Portfolios
      </text>
    </svg>
  )
};

export const getFeatureDescription = (feature: string): { name: string; description: string; tier: 'premium' | 'premium+' } => {
  const descriptions: Record<string, { name: string; description: string; tier: 'premium' | 'premium+' }> = {
    analytics: {
      name: 'Advanced Analytics',
      description: 'Get detailed performance analytics, sector breakdowns, and historical trends to make informed investment decisions.',
      tier: 'premium'
    },
    'risk-management': {
      name: 'Risk Management',
      description: 'Monitor portfolio risk metrics, volatility analysis, and get automated alerts for risk threshold breaches.',
      tier: 'premium+'
    },
    reports: {
      name: 'Detailed Reports',
      description: 'Generate comprehensive PDF reports with performance summaries, tax documents, and portfolio statements.',
      tier: 'premium+'
    },
    watchlist: {
      name: 'Stock Watchlist',
      description: 'Track unlimited stocks, set price alerts, and monitor market movements for potential investment opportunities.',
      tier: 'premium+'
    },
    'multi-portfolio': {
      name: 'Multiple Portfolios',
      description: 'Create and manage up to 5 portfolios of each type (Solid & Risky) with advanced portfolio comparison tools.',
      tier: 'premium'
    }
  };

  return descriptions[feature] || {
    name: 'Premium Feature',
    description: 'Upgrade to unlock this advanced feature and take your portfolio management to the next level.',
    tier: 'premium'
  };
};
