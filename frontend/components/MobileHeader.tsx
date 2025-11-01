'use client';

import { Bell, Trophy } from 'lucide-react';
import { useDevice } from '@/hooks/useDevice';
import { useState } from 'react';
import NotificationPanel from './NotificationPanel';
import Leaderboard from './Leaderboard';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  unreadCount?: number;
  onNotificationClick?: () => void;
}

export default function MobileHeader({ title, subtitle, unreadCount = 0, onNotificationClick }: MobileHeaderProps) {
  const { isMobile } = useDevice();
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [notificationButtonRef, setNotificationButtonRef] = useState<HTMLButtonElement | null>(null);
  const [leaderboardButtonRef, setLeaderboardButtonRef] = useState<HTMLButtonElement | null>(null);

  // Only show on mobile devices
  if (!isMobile) {
    return null;
  }

  const handleNotificationClick = () => {
    setShowNotificationPanel(true);
    if (onNotificationClick) onNotificationClick();
  };

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 to-emerald-600 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-lg font-bold text-white">{title}</h1>
              {subtitle && <p className="text-xs text-blue-100">{subtitle}</p>}
            </div>
          </div>
          
          {/* MOBILE BUTTONS - CLICKABLE */}
          <div className="flex items-center space-x-2">
            {/* Trophy/Leaderboard Button */}
            <button
              ref={setLeaderboardButtonRef}
              onClick={() => setShowLeaderboard(true)}
              className="relative w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all active:scale-95"
              title="View Leaderboard"
            >
              <Trophy className="w-6 h-6 text-white" />
            </button>
            
            {/* Notification Bell */}
            <button
              ref={setNotificationButtonRef}
              onClick={handleNotificationClick}
              className="relative w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all active:scale-95"
            >
              <Bell className="w-6 h-6 text-white" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  <span className="text-white text-xs font-black">{unreadCount > 9 ? '9+' : unreadCount}</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* MOBILE NOTIFICATION PANEL - DROPDOWN FROM BUTTON */}
      {showNotificationPanel && (
        <NotificationPanel 
          isVisible={showNotificationPanel}
          onClose={() => setShowNotificationPanel(false)}
          isMobile={true}
          buttonRef={notificationButtonRef}
        />
      )}

      {/* MOBILE LEADERBOARD MODAL - DROPDOWN FROM BUTTON */}
      <Leaderboard 
        isVisible={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        isMobile={true}
        buttonRef={leaderboardButtonRef}
      />
    </>
  );
}