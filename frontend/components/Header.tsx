'use client';

import { useState } from 'react';
import { LogOut, User, Settings, TrendingUp, BarChart3 } from 'lucide-react';
import Cookies from 'js-cookie';
import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ThemeToggle from './ThemeToggle';
import TechLogo from './TechLogo';
import NotificationCenter from './NotificationCenter';
import NotificationPanel from './NotificationPanel';
import Leaderboard from './Leaderboard';

interface HeaderProps {
  userName?: string;
  showNavigation?: boolean;
  isAdmin?: boolean;
  userAvatar?: string;
  userReputation?: any;
}

export default function Header({ userName, showNavigation = true, isAdmin = false, userAvatar, userReputation }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const router = useRouter();

  const handleLogout = () => logout();

  const Logo = () => (
    <div className="flex items-center space-x-3">
      <div className="relative w-12 h-12">
        <TechLogo size={48} className="drop-shadow-[0_0_8px_rgba(96,165,250,0.25)]" />
      </div>
      <div>
        <h1 className="logo-text text-xl font-bold tracking-wide text-slate-200">AI CAPITAL</h1>
        <p className="text-xs text-slate-400 font-medium">Professional Portfolio Management</p>
      </div>
    </div>
  );

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Branding */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Navigation - Removed dead links as requested */}
          {showNavigation && (
            <nav className="hidden md:flex space-x-8">
              {/* All navigation moved to left sidebar - clean header */}
            </nav>
          )}

          {/* User Menu */}
          {userName && (
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-slate-200">Welcome, {userName}</p>
                <p className="text-xs text-slate-400">Portfolio Manager</p>
              </div>
              
              {/* REPUTATION DISPLAY - VISIBLE ON ALL SCREENS */}
              {userReputation && (
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="flex items-center space-x-2 bg-slate-800/50 rounded-lg px-2 sm:px-3 py-2 border border-slate-700/50 hover:bg-slate-700/50 transition-colors"
                  title="View Trading Leaderboard"
                >
                  <span className="text-lg">🏆</span>
                  <div className="text-right hidden sm:block">
                    <div className={`text-sm font-semibold ${userReputation.reputation >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${userReputation.reputation?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-xs text-slate-400">
                      {userReputation.totalPositionsClosed || 0} trades
                    </div>
                  </div>
                  <div className="text-right sm:hidden">
                    <div className={`text-xs font-semibold ${userReputation.reputation >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${userReputation.reputation?.toFixed(0) || '0'}
                    </div>
                  </div>
                </button>
              )}

              {/* NOTIFICATION BELL - VISIBLE ON ALL PAGES */}
              {/* CRITICAL FIX: Enhanced Notification System */}
              <div className="relative">
                <button
                  onClick={() => setShowNotificationPanel(true)}
                  className="relative p-2 text-slate-400 hover:text-slate-300 transition-colors"
                  title="Notifications"
                >
                  <span className="text-xl">🔔</span>
                  {/* Unread count badge - will be updated by NotificationPanel */}
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    64
                  </span>
                </button>
                
                {/* Desktop Notification Panel */}
                {showNotificationPanel && (
                  <NotificationPanel 
                    isVisible={showNotificationPanel}
                    onClose={() => setShowNotificationPanel(false)}
                    isMobile={false}
                  />
                )}
              </div>
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* User Avatar */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors duration-200"
                >
                  {userAvatar ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-600">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL}${userAvatar}`}
                        alt="User Avatar"
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1 z-50">
                    {isAdmin && (
                      <a
                        href="/admin"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-emerald-300 hover:bg-slate-700 hover:text-emerald-200 transition-colors duration-200"
                      >
                        <span>Admin Dashboard</span>
                      </a>
                    )}
                    <a
                      href="/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors duration-200"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </a>
                    <a
                      href="/settings"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors duration-200"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </a>
                    <hr className="my-1 border-slate-700" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Leaderboard Modal */}
      <Leaderboard 
        isVisible={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        isMobile={false}
      />
    </header>
  );
}
