'use client';

import { useState, useEffect, useRef } from 'react';
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
  BarChart3,
  FileText,
  Award,
  Settings,
  Bell,
  TrendingUp
} from 'lucide-react';
import { useDevice } from '@/hooks/useDevice';

interface MobileNavigationEnhancedProps {
  userName?: string;
  subscriptionTier?: 'free' | 'premium' | 'premium+';
  onLogout: () => void;
  unreadCount?: number;
  onNotificationClick?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href?: string;
  premium?: boolean;
  children?: NavItem[];
  badge?: string;
  color?: string;
}

export default function MobileNavigationEnhanced({ 
  userName, 
  subscriptionTier, 
  onLogout,
  unreadCount = 0,
  onNotificationClick 
}: MobileNavigationEnhancedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string>('');
  const [swipeStart, setSwipeStart] = useState<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const router = useRouter();
  const { isMobile } = useDevice();
  const navRef = useRef<HTMLDivElement>(null);

  const navigationItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      href: '/dashboard',
      color: 'text-blue-400'
    },
    {
      id: 'expert-portfolio',
      label: 'Expert Portfolio',
      icon: Award,
      href: '/expert-portfolio',
      badge: '🎓',
      color: 'text-yellow-400'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: PieChart,
      color: 'text-purple-400',
      children: [
        {
          id: 'performance',
          label: 'Performance',
          icon: BarChart3,
          href: '/analytics/performance',
          color: 'text-green-400'
        },
        {
          id: 'portfolio-analysis',
          label: 'Portfolio Analysis',
          icon: PieChart,
          href: '/analytics/portfolio-analysis',
          premium: true,
          color: 'text-blue-400'
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: FileText,
          href: '/analytics/reports',
          premium: true,
          color: 'text-orange-400'
        },
        {
          id: 'risk-management',
          label: 'Risk Management',
          icon: AlertTriangle,
          href: '/risk-management',
          premium: true,
          color: 'text-red-400'
        },
        {
          id: 'watchlist',
          label: 'Watchlist',
          icon: BarChart3,
          href: '/watchlist',
          premium: true,
          color: 'text-cyan-400'
        }
      ]
    },
    {
      id: 'upgrade',
      label: 'Upgrade to Premium',
      icon: Crown,
      href: '/subscription/upgrade',
      premium: true,
      color: 'text-yellow-400'
    }
  ];

  // Swipe gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeStart === null) return;
    
    const currentX = e.touches[0].clientX;
    const diff = swipeStart - currentX;
    
    if (Math.abs(diff) > 50) {
      setSwipeDirection(diff > 0 ? 'left' : 'right');
    }
  };

  const handleTouchEnd = () => {
    if (swipeDirection === 'left' && isOpen) {
      setIsOpen(false);
    } else if (swipeDirection === 'right' && !isOpen) {
      setIsOpen(true);
    }
    
    setSwipeStart(null);
    setSwipeDirection(null);
  };

  // Pull to refresh
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef<number | null>(null);

  const handlePullStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  };

  const handlePullMove = (e: React.TouchEvent) => {
    if (pullStartY.current === null) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - pullStartY.current;
    
    if (diff > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(diff * 0.5, 100));
    }
  };

  const handlePullEnd = async () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      // Trigger refresh
      window.location.reload();
    }
    setPullDistance(0);
    pullStartY.current = null;
  };

  const handleItemClick = (item: NavItem) => {
    if (item.href) {
      router.push(item.href);
      setIsOpen(false);
      setActiveItem(item.id);
    }
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Only show on mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Enhanced Mobile Menu Button with Haptic Feedback */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          onTouchStart={() => {
            // Haptic feedback
            if (navigator.vibrate) {
              navigator.vibrate(50);
            }
          }}
          className="p-4 bg-gradient-to-r from-blue-600 to-emerald-600 shadow-lg border border-blue-500/50 rounded-xl text-white hover:from-blue-500 hover:to-emerald-500 transition-all duration-300 min-h-[52px] min-w-[52px] flex items-center justify-center transform hover:scale-105 active:scale-95"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* Pull to Refresh Indicator */}
      {pullDistance > 0 && (
        <div 
          className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-center py-2 text-sm font-medium"
          style={{ transform: `translateY(${pullDistance - 100}px)` }}
        >
          {pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}
        </div>
      )}

      {/* Mobile Menu Overlay with Swipe Gestures */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div 
            ref={navRef}
            className="absolute left-0 top-0 bottom-0 w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 backdrop-blur-lg border-r border-blue-500/30 p-6 overflow-y-auto shadow-2xl"
            onTouchStart={handlePullStart}
            onTouchMove={handlePullMove}
            onTouchEnd={handlePullEnd}
          >
            {/* Header with User Info */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">AiCapital</h1>
                    <p className="text-xs text-slate-400">PRO</p>
                  </div>
                </div>
                
                {/* Notification Bell */}
                <button
                  onClick={onNotificationClick}
                  className="relative w-12 h-12 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl flex items-center justify-center transition-all active:scale-95"
                >
                  <Bell className="w-6 h-6 text-slate-300" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-slate-800 animate-pulse">
                      <span className="text-white text-xs font-black">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    </div>
                  )}
                </button>
              </div>
              
              {/* User Info Card */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {userName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
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
            </div>

            {/* Navigation Items with Enhanced Touch Targets */}
            <nav className="space-y-2 mb-6">
              {navigationItems.map(item => {
                const Icon = item.icon;
                const isPremiumLocked = item.premium && subscriptionTier === 'free';
                const isActive = activeItem === item.id;
                
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => handleItemClick(item)}
                      disabled={isPremiumLocked}
                      className={`
                        w-full flex items-center space-x-4 px-6 py-5 rounded-xl text-left transition-all duration-300 min-h-[52px] border border-transparent
                        ${isActive ? 'bg-gradient-to-r from-blue-600/30 to-emerald-600/30 border-blue-500/50' : ''}
                        ${isPremiumLocked 
                          ? 'text-slate-500 cursor-not-allowed bg-slate-700/30' 
                          : 'text-slate-200 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-emerald-600/20 hover:text-white hover:border-blue-500/50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                        }
                      `}
                    >
                      <Icon className={`w-6 h-6 ${item.color || (item.premium ? 'text-yellow-400' : 'text-slate-300')}`} />
                      <span className="text-sm font-medium flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {item.premium && (
                        <Crown className="w-4 h-4 text-yellow-400" />
                      )}
                    </button>
                    
                    {/* Sub-items */}
                    {item.children && (
                      <div className="ml-6 mt-2 space-y-1">
                        {item.children.map(child => {
                          const ChildIcon = child.icon;
                          const isChildPremiumLocked = child.premium && subscriptionTier === 'free';
                          const isChildActive = activeItem === child.id;
                          
                          return (
                            <button
                              key={child.id}
                              onClick={() => handleItemClick(child)}
                              disabled={isChildPremiumLocked}
                              className={`
                                w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 min-h-[44px]
                                ${isChildActive ? 'bg-blue-600/20 border border-blue-500/30' : ''}
                                ${isChildPremiumLocked 
                                  ? 'text-slate-500 cursor-not-allowed' 
                                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white active:scale-[0.98]'
                                }
                              `}
                            >
                              <ChildIcon className={`w-4 h-4 ${child.color || (child.premium ? 'text-yellow-400' : 'text-slate-400')}`} />
                              <span className="text-xs font-medium flex-1">{child.label}</span>
                              {child.premium && (
                                <Crown className="w-3 h-3 text-yellow-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Quick Actions */}
            <div className="mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
              <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    router.push('/dashboard?action=add-stock');
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-400 text-xs font-medium transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Stock</span>
                </button>
                <button
                  onClick={() => {
                    router.push('/analytics/performance');
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 rounded-lg text-green-400 text-xs font-medium transition-all active:scale-95"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </button>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-4 px-6 py-5 text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-red-600/20 hover:to-red-500/20 rounded-xl transition-all duration-300 min-h-[52px] border border-transparent hover:border-red-500/50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogOut className="w-6 h-6" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Refresh Loading Overlay */}
      {isRefreshing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-800 rounded-xl p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <span className="text-white font-medium">Refreshing...</span>
          </div>
        </div>
      )}
    </>
  );
}
