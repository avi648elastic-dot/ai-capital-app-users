'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  PieChart, 
  Plus, 
  LogOut, 
  Menu,
  X,
  Crown,
  AlertTriangle,
  BarChart3
} from 'lucide-react';

interface MobileNavigationProps {
  userName?: string;
  subscriptionTier?: 'free' | 'premium';
  onLogout: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href?: string;
  premium?: boolean;
}

export default function MobileNavigation({ userName, subscriptionTier, onLogout }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
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
          id: 'reports',
          label: 'Reports',
          icon: FileText,
          href: '/analytics/reports',
          premium: true
        },
        {
          id: 'risk-management',
          label: 'Risk Management',
          icon: AlertTriangle,
          href: '/risk-management',
          premium: true
        },
        {
          id: 'watchlist',
          label: 'Watchlist',
          icon: BarChart3,
          href: '/watchlist',
          premium: true
        }
      ]
    },
    {
      id: 'upgrade',
      label: 'Upgrade to Premium',
      icon: Crown,
      href: '/subscription/upgrade',
      premium: true
    }
  ];

  const handleItemClick = (item: NavItem) => {
    if (item.href) {
      if (item.href.startsWith('/dashboard')) {
        // Handle dashboard with query params
        const url = new URL(item.href, window.location.origin);
        if (url.searchParams.has('action')) {
          // This will be handled by the dashboard component
          router.push('/dashboard');
        } else {
          router.push(item.href);
        }
      } else {
        router.push(item.href);
      }
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-slate-900/95 backdrop-blur-sm border border-slate-800/50 rounded-lg text-white hover:bg-slate-800/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-sm border-r border-slate-800/50 p-4 overflow-y-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">AiCapital</h1>
                  <p className="text-xs text-slate-400">PRO</p>
                </div>
              </div>
              
              {/* User Info */}
              <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg">
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {userName || 'User'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      subscriptionTier === 'premium' ? 'bg-yellow-400' : 'bg-slate-500'
                    }`} />
                    <p className="text-xs text-slate-400">
                      {subscriptionTier === 'premium' ? 'Premium' : 'Free'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-2 mb-6">
              {navigationItems.map(item => {
                const Icon = item.icon;
                const isPremiumLocked = item.premium && subscriptionTier === 'free';
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    disabled={isPremiumLocked}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-4 rounded-lg text-left transition-colors min-h-[44px]
                      ${isPremiumLocked 
                        ? 'text-slate-500 cursor-not-allowed' 
                        : 'text-slate-200 hover:bg-slate-800/50 hover:text-white'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${item.premium ? 'text-yellow-400' : ''}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.premium && (
                      <Crown className="w-4 h-4 text-yellow-400" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Logout Button */}
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-4 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors min-h-[44px]"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
