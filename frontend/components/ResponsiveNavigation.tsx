'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, Home, TrendingUp, Target, Shield, 
  Crown, Menu, X, LogOut, Eye, PieChart,
  Activity, AlertTriangle, Star, User, Settings, Sparkles, Award
} from 'lucide-react';
import { logout } from '@/lib/auth';
import { useDevice } from '@/hooks/useDevice';
import Image from 'next/image';
import NotificationCenter from './NotificationCenter';
import FeaturePreviewTooltip from './ui/FeaturePreviewTooltip';
import { getFeatureDescription } from './ui/FeaturePreviewImages';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTour } from '@/contexts/TourContext';

interface ResponsiveNavigationProps {
  userName?: string;
  subscriptionTier?: 'free' | 'premium' | 'premium+';
  userAvatar?: string;
  isAdmin?: boolean;
  onLogout: () => void;
}

export default function ResponsiveNavigation({ 
  userName, 
  subscriptionTier = 'free', 
  userAvatar,
  isAdmin = false,
  onLogout 
}: ResponsiveNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Default to closed, opens when button clicked
  const router = useRouter();
  const { isMobile, isTablet } = useDevice();
  const { t } = useLanguage();
  const { startTour } = useTour();
  
  // Debug logging
  console.log('🔍 [RESPONSIVE NAV] Device detection:', { isMobile, isTablet, screenWidth: useDevice().screenWidth });
  console.log('🔍 [RESPONSIVE NAV] Will show desktop sidebar:', !isMobile && !isTablet);
  console.log('🔍 [RESPONSIVE NAV] Will show mobile button:', isMobile || isTablet);

  const navigationItems = [
    { id: 'dashboard', label: t('navigation.dashboard'), icon: Home, href: '/dashboard' },
    { id: 'expert-portfolio', label: 'Expert Portfolio', icon: Award, href: '/expert-portfolio', badge: '🎓' },
    { 
      id: 'analytics', 
      label: t('navigation.analytics'), 
      icon: BarChart3,
      children: [
        { id: 'performance', label: t('navigation.performance'), icon: TrendingUp, href: '/analytics/performance' },
        { id: 'portfolio-analysis', label: t('navigation.portfolioAnalysis'), icon: PieChart, href: '/analytics/portfolio-analysis', premium: true, beta: true },
        { id: 'watchlist', label: t('navigation.watchlist'), icon: Eye, href: '/watchlist', premiumPlus: true },
        { id: 'risk-management', label: t('navigation.riskManagement'), icon: Shield, href: '/risk-management', premiumPlus: true, beta: true },
        { id: 'reports', label: t('navigation.reports'), icon: Activity, href: '/analytics/reports', premiumPlus: true, beta: true }
      ]
    },
    { id: 'subscription', label: t('navigation.subscription'), icon: Crown, href: '/subscription' }
  ];

  // Add admin navigation if user is admin
  if (isAdmin) {
    navigationItems.push({
      id: 'admin',
      label: t('navigation.adminPanel'),
      icon: Shield,
      children: [
        { id: 'admin-dashboard', label: t('navigation.adminDashboard'), icon: Shield, href: '/admin', admin: true } as any,
        { id: 'admin-notifications', label: t('navigation.adminNotifications'), icon: Settings, href: '/admin/notifications', admin: true } as any
      ]
    });
  }

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
            <div className="relative w-7 h-7">
              <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" aria-label="AI Capital Logo">
                <defs>
                  <linearGradient id="nav-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E5E7EB" />
                    <stop offset="100%" stopColor="#9CA3AF" />
                  </linearGradient>
                </defs>
                <g fill="url(#nav-grad)">
                  <path d="M20 78 L47 22 C49 18 51 18 53 22 L80 78 L70 78 L50 38 L30 78 Z" />
                  <rect x="42" y="56" width="16" height="6" rx="2" />
                </g>
              </svg>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">AiCapital</h1>
                <p className="text-xs text-slate-400">PRO V2</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            {userAvatar ? (
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-600">
                <Image
                  src={userAvatar}
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-600 bg-slate-800 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-7 h-7" xmlns="http://www.w3.org/2000/svg" aria-label="AI Capital Logo">
                  <defs>
                    <linearGradient id="nav-avatar-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E5E7EB" />
                      <stop offset="100%" stopColor="#9CA3AF" />
                    </linearGradient>
                  </defs>
                  <g fill="url(#nav-avatar-grad)">
                    <path d="M20 78 L47 22 C49 18 51 18 53 22 L80 78 L70 78 L50 38 L30 78 Z" />
                    <rect x="42" y="56" width="16" height="6" rx="2" />
                  </g>
                </svg>
              </div>
            )}
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
            {/* Notification Center */}
            <NotificationCenter userId={userName || 'user'} />
          </div>
          
          {/* Profile and Settings buttons */}
          <div className="flex space-x-2 mt-3">
            <button
              onClick={() => router.push('/profile')}
              className="flex-1 px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors flex items-center justify-center space-x-1"
            >
              <User className="w-3 h-3" />
              <span>{t('common.profile')}</span>
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="flex-1 px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors flex items-center justify-center space-x-1"
            >
              <Settings className="w-3 h-3" />
              <span>{t('navigation.settings')}</span>
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
                  {(item as any).badge && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                      {(item as any).badge}
                    </span>
                  )}
                </button>
                
                    {item.children && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.children.map(child => {
                          const ChildIcon = child.icon;
                          const isPremiumLocked = child.premium && subscriptionTier === 'free';
                          const isPremiumPlusLocked = child.premiumPlus && subscriptionTier !== 'premium+';
                          const isAdminLocked = (child as any).admin && !isAdmin;
                          const isLocked = isPremiumLocked || isPremiumPlusLocked || isAdminLocked;
                          
                          // Get feature preview info
                          const featureInfo = isLocked ? getFeatureDescription(child.id) : null;
                          
                          const childButton = (
                            <button
                              key={child.id}
                              onClick={() => !isLocked && handleItemClick(child)}
                              disabled={isLocked}
                              className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                                isLocked 
                                  ? 'text-slate-500 cursor-not-allowed' 
                                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
                              }`}
                            >
                              <ChildIcon className={`w-4 h-4 flex-shrink-0 ${
                                child.premium ? 'text-yellow-400' : 
                                child.premiumPlus ? 'text-purple-400' :
                                (child as any).admin ? 'text-red-400' : ''
                              }`} />
                              <span className="text-sm flex-1 ml-3">{child.label}</span>
                              {/* Beta Badge */}
                              {(child as any).beta && (
                                <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded">BETA</span>
                              )}
                              {child.premium && !(child as any).beta && (
                                <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                              )}
                              {child.premiumPlus && !(child as any).beta && (
                                <Crown className="w-3 h-3 text-purple-400 flex-shrink-0" />
                              )}
                              {(child as any).admin && !(child as any).beta && (
                                <Shield className="w-3 h-3 text-red-400 flex-shrink-0" />
                              )}
                            </button>
                          );
                          
                          return isLocked && featureInfo ? (
                            <FeaturePreviewTooltip
                              key={child.id}
                              featureName={featureInfo.name}
                              description={featureInfo.description}
                              requiredTier={featureInfo.tier}
                            >
                              {childButton}
                            </FeaturePreviewTooltip>
                          ) : (
                            childButton
                          );
                        })}
                      </div>
                    )}
              </div>
            );
          })}
        </nav>

        {/* Tour & Logout */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          {/* Tour Button - Always visible */}
          <button
            onClick={() => startTour()}
            className="w-full flex items-center space-x-3 px-3 py-2 text-purple-400 hover:text-purple-300 hover:bg-slate-700/50 rounded-lg transition-colors group"
            title={t('common.startTour')}
          >
            <Sparkles className="w-5 h-5 group-hover:animate-spin" />
            <span className="text-sm font-medium">{t('common.startTour')}</span>
            <div className="ml-auto w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          </button>
          
          {/* Logout Button */}
          <button
            onClick={() => logout()}
            className="w-full flex items-center space-x-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">{t('common.logout')}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Button - Positioned below header - SMALLER SIZE */}
      <div className="lg:hidden fixed top-20 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-4 bg-red-600 shadow-2xl border-4 border-red-400 rounded-2xl text-white font-bold hover:bg-red-500 transition-all duration-300 transform hover:scale-110 active:scale-95"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
                       {userAvatar ? (
                         <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-600">
                           <Image
                             src={userAvatar}
                             alt="User Avatar"
                             width={32}
                             height={32}
                             className="w-full h-full object-cover"
                           />
                         </div>
                       ) : (
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-600 bg-slate-800 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" aria-label="AI Capital Logo">
                    <defs>
                      <linearGradient id="nav-avatar-grad-m" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#E5E7EB" />
                        <stop offset="100%" stopColor="#9CA3AF" />
                      </linearGradient>
                    </defs>
                    <g fill="url(#nav-avatar-grad-m)">
                      <path d="M20 78 L47 22 C49 18 51 18 53 22 L80 78 L70 78 L50 38 L30 78 Z" />
                      <rect x="42" y="56" width="16" height="6" rx="2" />
                    </g>
                  </svg>
                </div>
                       )}
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
                {/* Notification Center for mobile */}
                <NotificationCenter userId={userName || 'user'} />
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
                  <span>{t('common.profile')}</span>
                </button>
                <button
                  onClick={() => {
                    router.push('/settings');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors flex items-center justify-center space-x-1"
                >
                  <Settings className="w-3 h-3" />
                  <span>{t('navigation.settings')}</span>
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
                      {(item as any).badge && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                          {(item as any).badge}
                        </span>
                      )}
                    </button>
                    
                    {item.children && (
                      <div className="ml-6 mt-2 space-y-2">
                        {item.children.map(child => {
                          const ChildIcon = child.icon;
                          const isPremiumLocked = child.premium && subscriptionTier === 'free';
                          const isPremiumPlusLocked = child.premiumPlus && subscriptionTier !== 'premium+';
                          const isAdminLocked = (child as any).admin && !isAdmin;
                          const isLocked = isPremiumLocked || isPremiumPlusLocked || isAdminLocked;
                          
                          return (
                            <button
                              key={child.id}
                              onClick={() => handleItemClick(child)}
                              disabled={isLocked}
                              className={`w-full flex items-center px-6 py-4 rounded-xl text-left transition-all duration-300 border border-transparent ${
                                isLocked 
                                  ? 'text-slate-500 cursor-not-allowed bg-slate-700/30' 
                                  : 'text-slate-300 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-emerald-600/20 hover:text-white hover:border-blue-500/50 hover:shadow-lg hover:scale-[1.02]'
                              }`}
                            >
                              <ChildIcon className={`w-4 h-4 flex-shrink-0 ${
                                child.premium ? 'text-yellow-400' : 
                                child.premiumPlus ? 'text-purple-400' :
                                (child as any).admin ? 'text-red-400' : ''
                              }`} />
                              <span className="text-sm flex-1 ml-4">{child.label}</span>
                              {/* Beta Badge for Mobile */}
                              {(child as any).beta && (
                                <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded">BETA</span>
                              )}
                              {child.premium && !(child as any).beta && (
                                <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                              )}
                              {child.premiumPlus && !(child as any).beta && (
                                <Crown className="w-4 h-4 text-purple-400 flex-shrink-0" />
                              )}
                              {(child as any).admin && !(child as any).beta && (
                                <Shield className="w-4 h-4 text-red-400 flex-shrink-0" />
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

            {/* Tour & Logout Buttons */}
            <div className="space-y-2">
              {/* Tour Button - Always visible */}
              <button
                onClick={() => {
                  startTour();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-4 px-6 py-5 text-purple-400 hover:text-purple-300 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-pink-600/20 rounded-xl transition-all duration-300 border border-transparent hover:border-purple-500/50 hover:shadow-lg hover:scale-[1.02] group"
              >
                <Sparkles className="w-5 h-5 group-hover:animate-spin" />
                <span className="text-sm font-medium">{t('common.startTour')}</span>
                <div className="ml-auto w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              </button>
              
              {/* Logout Button */}
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-4 px-6 py-5 text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-red-600/20 hover:to-red-500/20 rounded-xl transition-all duration-300 border border-transparent hover:border-red-500/50 hover:shadow-lg hover:scale-[1.02]"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">{t('common.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
