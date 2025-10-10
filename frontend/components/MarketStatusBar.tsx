'use client';

import { useState, useEffect } from 'react';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MarketStatusBarProps {
  userTimezone?: string;
}

export default function MarketStatusBar({ userTimezone }: MarketStatusBarProps) {
  const { t } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marketStatus, setMarketStatus] = useState<{
    isOpen: boolean;
    message: string;
    timeUntil: string;
  }>({ isOpen: false, message: '', timeUntil: '' });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate market status
  useEffect(() => {
    const calculateMarketStatus = () => {
      const now = new Date();
      
      // Convert to EST (New York time)
      const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const day = estTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const hours = estTime.getHours();
      const minutes = estTime.getMinutes();
      const currentMinutes = hours * 60 + minutes;

      // Market hours: Monday-Friday, 9:30 AM - 4:00 PM EST
      const marketOpen = 9 * 60 + 30; // 9:30 AM
      const marketClose = 16 * 60; // 4:00 PM

      // Weekend
      if (day === 0 || day === 6) {
        const daysUntilMonday = day === 0 ? 1 : 2;
        return {
          isOpen: false,
          message: `${t('dashboard.marketClosed')} - ${t('common.weekend')}`,
          timeUntil: `${t('dashboard.opensIn')} ${daysUntilMonday} ${t('common.day')}${daysUntilMonday > 1 ? 's' : ''}`
        };
      }

      // Weekday - check if market is open
      if (currentMinutes >= marketOpen && currentMinutes < marketClose) {
        const minutesUntilClose = marketClose - currentMinutes;
        const hoursUntilClose = Math.floor(minutesUntilClose / 60);
        const minsUntilClose = minutesUntilClose % 60;
        
        return {
          isOpen: true,
          message: t('dashboard.marketOpen'),
          timeUntil: `${t('dashboard.closesIn')} ${hoursUntilClose}h ${minsUntilClose}m`
        };
      }

      // Before market opens
      if (currentMinutes < marketOpen) {
        const minutesUntilOpen = marketOpen - currentMinutes;
        const hoursUntilOpen = Math.floor(minutesUntilOpen / 60);
        const minsUntilOpen = minutesUntilOpen % 60;
        
        return {
          isOpen: false,
          message: `${t('dashboard.marketClosed')} - ${t('common.preMarket')}`,
          timeUntil: `${t('dashboard.opensIn')} ${hoursUntilOpen}h ${minsUntilOpen}m`
        };
      }

      // After market closes
      const minutesUntilNextOpen = (24 * 60 - currentMinutes) + marketOpen;
      const hoursUntilNextOpen = Math.floor(minutesUntilNextOpen / 60);
      
      return {
        isOpen: false,
        message: `${t('dashboard.marketClosed')} - ${t('common.afterHours')}`,
        timeUntil: `${t('dashboard.opensIn')} ${hoursUntilNextOpen}h`
      };
    };

    setMarketStatus(calculateMarketStatus());
  }, [currentTime]);

  // Format time for user's timezone
  const formatTime = () => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    return currentTime.toLocaleTimeString('en-US', options);
  };

  // Format date
  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    return currentTime.toLocaleDateString('en-US', options);
  };

  return (
    <div className="w-full bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-b border-slate-700 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Clock Section */}
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-primary-400" />
            <div>
              <div className="text-2xl font-bold text-white tabular-nums">
                {formatTime()}
              </div>
              <div className="text-xs text-slate-400">
                {formatDate()}
              </div>
            </div>
          </div>

          {/* Market Status Section with Animated Businessman */}
          <div className="flex items-center gap-6">
            {/* Status Line with Businessman */}
            <div className="relative flex items-center">
              {/* The Line */}
              <div className={`h-1 w-48 md:w-64 rounded-full ${
                marketStatus.isOpen 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                  : 'bg-gradient-to-r from-red-500 to-orange-500'
              }`}>
                {/* Professional Businessman Indicator */}
                <div className={`absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ${
                  marketStatus.isOpen ? 'left-0' : 'left-1/2 -translate-x-1/2'
                }`}>
                  {marketStatus.isOpen ? (
                    // Active businessman - walking/moving during market hours
                    <div className="relative w-8 h-8 flex items-center justify-center">
                      <svg 
                        viewBox="0 0 24 24" 
                        className="w-6 h-6 text-green-500 animate-walk"
                        fill="currentColor"
                      >
                        {/* Professional businessman walking */}
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5V7.5L21 9ZM3 9L9 7.5V5.5L3 7V9ZM12 7.5C14.33 7.5 19 8.84 19 11.5V16C19 16.55 18.55 17 18 17H6C5.45 17 5 16.55 5 16V11.5C5 8.84 9.67 7.5 12 7.5ZM12 9C9.5 9 7 10.25 7 11.5V15H17V11.5C17 10.25 14.5 9 12 9Z"/>
                        {/* Walking motion indicator */}
                        <circle cx="18" cy="18" r="1" fill="currentColor" className="animate-pulse"/>
                        <circle cx="20" cy="19" r="0.8" fill="currentColor" className="animate-pulse" style={{animationDelay: '0.2s'}}/>
                      </svg>
                      {/* Activity glow */}
                      <div className="absolute w-8 h-8 bg-green-300 rounded-full animate-ping opacity-20"></div>
                    </div>
                  ) : (
                    // Resting businessman - still when market is closed
                    <div className="relative w-8 h-8 flex items-center justify-center">
                      <svg 
                        viewBox="0 0 24 24" 
                        className="w-6 h-6 text-gray-400"
                        fill="currentColor"
                      >
                        {/* Professional businessman sitting/resting */}
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5V7.5L21 9ZM3 9L9 7.5V5.5L3 7V9ZM12 7.5C14.33 7.5 19 8.84 19 11.5V16C19 16.55 18.55 17 18 17H6C5.45 17 5 16.55 5 16V11.5C5 8.84 9.67 7.5 12 7.5ZM12 9C9.5 9 7 10.25 7 11.5V15H17V11.5C17 10.25 14.5 9 12 9Z"/>
                        {/* Rest indicator */}
                        <rect x="10" y="18" width="4" height="2" rx="1" fill="currentColor"/>
                      </svg>
                      {/* Resting glow */}
                      <div className="absolute w-8 h-8 bg-gray-300 rounded-full opacity-10"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status Text */}
            <div className="text-right">
              <div className={`flex items-center gap-2 text-sm font-semibold ${
                marketStatus.isOpen ? 'text-green-400' : 'text-red-400'
              }`}>
                {marketStatus.isOpen ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {marketStatus.message}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {marketStatus.timeUntil}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes walk-line {
          0%, 100% { left: 0%; }
          50% { left: calc(100% - 2rem); }
        }

        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes walk {
          0%, 100% { 
            transform: translateX(0) translateY(0); 
          }
          25% { 
            transform: translateX(2px) translateY(-1px); 
          }
          50% { 
            transform: translateX(4px) translateY(0); 
          }
          75% { 
            transform: translateX(2px) translateY(1px); 
          }
        }

        .animate-walk-line {
          animation: walk-line 4s ease-in-out infinite;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 0.6s ease-in-out infinite;
        }

        .animate-walk {
          animation: walk 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
