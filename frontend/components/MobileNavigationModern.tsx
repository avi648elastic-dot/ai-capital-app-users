'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  BarChart3,
  Plus,
  User,
  Settings,
  Bell,
  Trophy,
  Target,
  TrendingUp,
  PieChart,
  Activity,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import NotificationPanel from './NotificationPanel';

interface MobileNavigationModernProps {
  user?: any;
  notificationCount?: number;
}

const MobileNavigationModern: React.FC<MobileNavigationModernProps> = ({
  user,
  notificationCount = 0
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Portfolio',
      href: '/portfolio',
      icon: BarChart3,
      color: 'from-green-500 to-emerald-500'
    },
    {
      name: 'Add Stock',
      href: '/add-stock',
      icon: Plus,
      color: 'from-purple-500 to-pink-500',
      isAction: true
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500'
    },
    {
      name: 'Leaderboard',
      href: '/leaderboard',
      icon: Trophy,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      name: 'Targets',
      href: '/targets',
      icon: Target,
      color: 'from-pink-500 to-rose-500'
    },
    {
      name: 'Charts',
      href: '/charts',
      icon: PieChart,
      color: 'from-indigo-500 to-purple-500'
    },
    {
      name: 'Activity',
      href: '/activity',
      icon: Activity,
      color: 'from-teal-500 to-cyan-500'
    }
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-8 h-8 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="w-8 h-8 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Navigation Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Navigation Panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-80 bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 z-50 shadow-2xl"
            >
              <div className="p-6 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">AI Capital</h2>
                      <p className="text-sm text-purple-200">Trading Platform</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                {/* User Info */}
                {user && (
                  <div className="mb-8 p-4 bg-white/10 rounded-2xl border border-white/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {user.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{user.name || 'User'}</h3>
                        <p className="text-purple-200 text-sm">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="px-2 py-1 bg-purple-500/20 rounded-full">
                            <span className="text-purple-200 text-xs font-medium">
                              {user.subscriptionTier?.toUpperCase() || 'FREE'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Items */}
                <div className="flex-1 space-y-2">
                  {navigationItems.map((item, index) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    
                    return (
                      <motion.button
                        key={item.name}
                        onClick={() => handleNavigation(item.href)}
                        className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 ${
                          active
                            ? 'bg-white/20 border border-white/30'
                            : 'bg-white/5 hover:bg-white/10 border border-transparent'
                        }`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${item.color} ${
                          active ? 'shadow-lg' : ''
                        }`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`font-semibold ${
                            active ? 'text-white' : 'text-gray-300'
                          }`}>
                            {item.name}
                          </p>
                          {item.isAction && (
                            <p className="text-xs text-purple-300">Quick Action</p>
                          )}
                        </div>
                        {active && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-white rounded-full"
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Notifications - Clickable */}
                <button
                  onClick={() => setShowNotificationPanel(true)}
                  className="mt-8 w-full p-4 bg-white/10 rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-200 active:scale-95"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <Bell className="w-5 h-5 text-yellow-400" />
                      </div>
                      <span className="text-white font-semibold">Notifications</span>
                    </div>
                    {notificationCount > 0 && (
                      <div className="px-3 py-1 bg-red-500 rounded-full animate-pulse">
                        <span className="text-white text-sm font-bold">
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Footer */}
                <div className="mt-6 pt-6 border-t border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      AI Capital v2.0
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notification Panel */}
      {showNotificationPanel && (
        <NotificationPanel 
          isVisible={showNotificationPanel}
          onClose={() => setShowNotificationPanel(false)}
          isMobile={true}
        />
      )}
    </>
  );
};

export default MobileNavigationModern;
