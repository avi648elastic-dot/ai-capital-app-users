'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, Home, TrendingUp, Target, Shield, 
  Crown, Menu, X, LogOut, Eye, PieChart,
  Activity, AlertTriangle, Star, User, Settings
} from 'lucide-react';
import { useDevice } from '@/hooks/useDevice';

interface ResponsiveNavigationProps {
  userName?: string;
  subscriptionTier?: string;
  onLogout: () => void;
}

export default function ResponsiveNavigation({ 
  userName, 
  subscriptionTier = 'free', 
  onLogout 
}: ResponsiveNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { isMobile, isTablet } = useDevice();
  
  // Debug logging
  console.log('🔍 [RESPONSIVE NAV] Device detection:', { isMobile, isTablet, screenWidth: useDevice().screenWidth });
  console.log('🔍 [RESPONSIVE NAV] Will show desktop sidebar:', !isMobile && !isTablet);
  console.log('🔍 [RESPONSIVE NAV] Will show mobile button:', isMobile || isTablet);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: BarChart3,
      children: [
        { id: 'performance', label: 'Performance', icon: TrendingUp, href: '/analytics/performance' },
        { id: 'portfolio-analysis', label: 'Portfolio Analysis', icon: PieChart, href: '/analytics/portfolio-analysis', premium: true },
        { id: 'reports', label: 'Reports', icon: Activity, href: '/analytics/reports', premium: true },
        { id: 'risk-management', label: 'Risk Management', icon: Shield, href: '/analytics/risk-management', premium: true },
        { id: 'watchlist', label: 'Watchlist', icon: Eye, href: '/analytics/watchlist', premium: true }
      ]
    },
    { id: 'subscription', label: 'Subscription', icon: Crown, href: '/subscription', premium: true }
  ];

  const handleItemClick = (item: any) => {
    if (item.href) {
      router.push(item.href);
      setIsMobileMenuOpen(false);
    }
  };

  // Desktop Navigation - Always show sidebar on desktop
  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex flex-col w-64 bg-slate-800 border-r border-slate-700 h-screen">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">AiCapital</h1>
              <p className="text-xs text-slate-400">PRO V2</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-slate-300" />
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
          
          {/* Profile and Settings buttons */}
          <div className="flex space-x-2 mt-3">
            <button
              onClick={() => router.push('/profile')}
              className="flex-1 px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors flex items-center justify-center space-x-1"
            >
              <User className="w-3 h-3" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="flex-1 px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors flex items-center justify-center space-x-1"
            >
              <Settings className="w-3 h-3" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          {navigationItems.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="mb-2">
                <button
                  onClick={() => handleItemClick(item)}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
                
                {item.children && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map(child => {
                      const ChildIcon = child.icon;
                      const isPremiumLocked = child.premium && subscriptionTier === 'free';
                      
                      return (
                        <button
                          key={child.id}
                          onClick={() => handleItemClick(child)}
                          disabled={isPremiumLocked}
                          className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                            isPremiumLocked 
                              ? 'text-slate-500 cursor-not-allowed' 
                              : 'text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          <ChildIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm flex-1 ml-3">{child.label}</span>
                          {child.premium && (
                            <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />
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

        {/* Logout */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Button - Positioned below header */}
      <div className="lg:hidden fixed top-20 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-6 bg-red-600 shadow-2xl border-4 border-red-400 rounded-2xl text-white text-xl font-bold hover:bg-red-500 transition-all duration-300 transform hover:scale-110 active:scale-95"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 backdrop-blur-lg border-r border-blue-500/30 p-6 overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">AiCapital</h1>
                  <p className="text-xs text-slate-400">PRO V2</p>
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
              
              {/* Profile and Settings buttons for mobile */}
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={() => {
                    router.push('/profile');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors flex items-center justify-center space-x-1"
                >
                  <User className="w-3 h-3" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    router.push('/settings');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors flex items-center justify-center space-x-1"
                >
                  <Settings className="w-3 h-3" />
                  <span>Settings</span>
                </button>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-2 mb-6">
              {navigationItems.map(item => {
                const Icon = item.icon;
                
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => handleItemClick(item)}
                      className="w-full flex items-center space-x-4 px-6 py-5 rounded-xl text-left transition-all duration-300 border border-transparent text-slate-200 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-emerald-600/20 hover:text-white hover:border-blue-500/50 hover:shadow-lg hover:scale-[1.02]"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                    
                    {item.children && (
                      <div className="ml-6 mt-2 space-y-2">
                        {item.children.map(child => {
                          const ChildIcon = child.icon;
                          const isPremiumLocked = child.premium && subscriptionTier === 'free';
                          
                          return (
                            <button
                              key={child.id}
                              onClick={() => handleItemClick(child)}
                              disabled={isPremiumLocked}
                              className={`w-full flex items-center px-6 py-4 rounded-xl text-left transition-all duration-300 border border-transparent ${
                                isPremiumLocked 
                                  ? 'text-slate-500 cursor-not-allowed bg-slate-700/30' 
                                  : 'text-slate-300 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-emerald-600/20 hover:text-white hover:border-blue-500/50 hover:shadow-lg hover:scale-[1.02]'
                              }`}
                            >
                              <ChildIcon className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm flex-1 ml-4">{child.label}</span>
                              {child.premium && (
                                <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
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

            {/* Logout Button */}
            <button
              onClick={() => {
                onLogout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-4 px-6 py-5 text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-red-600/20 hover:to-red-500/20 rounded-xl transition-all duration-300 border border-transparent hover:border-red-500/50 hover:shadow-lg hover:scale-[1.02]"
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
