'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  BarChart3, 
  Plus, 
  Settings, 
  LogOut, 
  ChevronDown, 
  ChevronRight,
  Crown,
  Shield,
  TrendingUp,
  PieChart,
  Users,
  DollarSign,
  User,
  FileText,
  Bell,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import FeaturePreviewTooltip from './ui/FeaturePreviewTooltip';
import { FeaturePreviewImages, getFeatureDescription } from './ui/FeaturePreviewImages';

interface NavigationProps {
  userName?: string;
  subscriptionTier?: 'free' | 'premium' | 'premium+';
  isAdmin?: boolean;
  onLogout: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href?: string;
  children?: NavItem[];
  badge?: string;
  premium?: boolean;
  admin?: boolean;
  premiumPlus?: boolean;
}

export default function Navigation({ userName, subscriptionTier, isAdmin, onLogout }: NavigationProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(['dashboard']);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

  const navigationItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      href: '/dashboard'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: PieChart,
      children: [
        {
          id: 'performance',
          label: 'Performance',
          icon: BarChart3,
          href: '/analytics/performance'
        },
        {
          id: 'portfolio-analysis',
          label: 'Portfolio Analysis',
          icon: PieChart,
          href: '/analytics',
          premium: true
        },
        {
          id: 'watchlist',
          label: 'Watchlist',
          icon: BarChart3,
          href: '/watchlist',
          premiumPlus: true
        },
        {
          id: 'risk-management',
          label: 'Risk Management',
          icon: AlertTriangle,
          href: '/risk-management',
          premiumPlus: true
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: FileText,
          href: '/analytics/reports',
          premiumPlus: true
        }
      ]
    },
    {
      id: 'subscription',
      label: 'Subscription',
      icon: Crown,
      children: [
        {
          id: 'upgrade',
          label: 'Upgrade to Premium',
          icon: Crown,
          href: '/subscription/upgrade',
          badge: subscriptionTier === 'free' ? 'Upgrade' : undefined
        },
        {
          id: 'billing',
          label: 'Billing',
          icon: DollarSign,
          href: '/subscription/billing'
        }
      ]
    }
  ];

  // Add admin navigation if user is admin
  if (isAdmin) {
    navigationItems.push({
      id: 'admin',
      label: 'Admin Panel',
      icon: Shield,
      children: [
        {
          id: 'admin-dashboard',
          label: 'Admin Dashboard',
          icon: Shield,
          href: '/admin',
          admin: true
        },
        {
          id: 'admin-notifications',
          label: 'Notifications',
          icon: Bell,
          href: '/admin/notifications',
          admin: true
        }
      ]
    });
  }

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleItemClick = (item: NavItem) => {
    if (item.href) {
      if (item.href.startsWith('/dashboard')) {
        // Handle dashboard with query params
        const url = new URL(item.href, window.location.origin);
        if (url.searchParams.has('tab')) {
          // This will be handled by the dashboard component
          router.push('/dashboard');
        } else if (url.searchParams.has('action')) {
          // This will be handled by the dashboard component
          router.push('/dashboard');
        } else {
          router.push(item.href);
        }
      } else {
        router.push(item.href);
      }
    } else if (item.children) {
      toggleExpanded(item.id);
    }
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const Icon = item.icon;
    
    // Check if item is locked
    const isPremiumLocked = item.premium && subscriptionTier === 'free';
    const isPremiumPlusLocked = item.premiumPlus && subscriptionTier !== 'premium+';
    const isAdminLocked = item.admin && !isAdmin;
    const isLocked = isPremiumLocked || isPremiumPlusLocked || isAdminLocked;

    // Get feature preview info
    const featureInfo = isLocked ? getFeatureDescription(item.id) : null;

    const navItemContent = (
      <div
        className={`
          flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 group
          ${level === 0 ? 'text-slate-200 hover:bg-slate-800/50' : 'text-slate-300 hover:bg-slate-700/50 ml-4'}
          ${isLocked ? 'opacity-60' : ''}
        `}
        onClick={() => !isLocked && handleItemClick(item)}
      >
        <div className="flex items-center space-x-3">
          <Icon className={`w-5 h-5 ${item.premium ? 'text-yellow-400' : item.premiumPlus ? 'text-purple-400' : item.admin ? 'text-red-400' : ''}`} />
          {!isCollapsed && (
            <>
              <span className="text-sm font-medium">{item.label}</span>
              {item.premium && (
                <Crown className="w-4 h-4 text-yellow-400" />
              )}
              {item.premiumPlus && (
                <Crown className="w-4 h-4 text-purple-400" />
              )}
              {item.admin && (
                <Shield className="w-4 h-4 text-red-400" />
              )}
              {item.badge && (
                <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </>
          )}
        </div>
        {hasChildren && !isCollapsed && (
          <div className="text-slate-400">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>
        )}
      </div>
    );

    return (
      <div key={item.id}>
        {isLocked && featureInfo ? (
          <FeaturePreviewTooltip
            featureName={featureInfo.name}
            description={featureInfo.description}
            requiredTier={featureInfo.tier}
          >
            {navItemContent}
          </FeaturePreviewTooltip>
        ) : (
          navItemContent
        )}
        
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children?.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`
      bg-slate-900/95 backdrop-blur-sm border-r border-slate-800/50 transition-all duration-300
      ${isCollapsed ? 'w-16' : 'w-64'}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">AiCapital</h1>
                <p className="text-xs text-slate-400">PRO</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userName || 'User'}
              </p>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  subscriptionTier === 'premium+' ? 'bg-purple-400' :
                  subscriptionTier === 'premium' ? 'bg-yellow-400' : 'bg-slate-500'
                }`} />
                <p className="text-xs text-slate-400">
                  {subscriptionTier === 'premium+' ? 'Premium+' :
                   subscriptionTier === 'premium' ? 'Premium' : 'Free'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="p-4 space-y-2">
        {navigationItems.map(item => renderNavItem(item))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800/50">
        <button
          onClick={onLogout}
          className="flex items-center space-x-3 w-full px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );
}
