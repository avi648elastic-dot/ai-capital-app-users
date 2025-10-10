'use client';

import { useState, useEffect } from 'react';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface MarketStatusBarProps {
  userTimezone?: string;
}

export default function MarketStatusBar({ userTimezone }: MarketStatusBarProps) {
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
          message: 'Market Closed - Weekend',
          timeUntil: `Opens in ${daysUntilMonday} day${daysUntilMonday > 1 ? 's' : ''}`
        };
      }

      // Weekday - check if market is open
      if (currentMinutes >= marketOpen && currentMinutes < marketClose) {
        const minutesUntilClose = marketClose - currentMinutes;
        const hoursUntilClose = Math.floor(minutesUntilClose / 60);
        const minsUntilClose = minutesUntilClose % 60;
        
        return {
          isOpen: true,
          message: 'Market is Open',
          timeUntil: `Closes in ${hoursUntilClose}h ${minsUntilClose}m`
        };
      }

      // Before market opens
      if (currentMinutes < marketOpen) {
        const minutesUntilOpen = marketOpen - currentMinutes;
        const hoursUntilOpen = Math.floor(minutesUntilOpen / 60);
        const minsUntilOpen = minutesUntilOpen % 60;
        
        return {
          isOpen: false,
          message: 'Market Closed - Pre-Market',
          timeUntil: `Opens in ${hoursUntilOpen}h ${minsUntilOpen}m`
        };
      }

      // After market closes
      const minutesUntilNextOpen = (24 * 60 - currentMinutes) + marketOpen;
      const hoursUntilNextOpen = Math.floor(minutesUntilNextOpen / 60);
      
      return {
        isOpen: false,
        message: 'Market Closed - After Hours',
        timeUntil: `Opens in ${hoursUntilNextOpen}h`
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
                {/* Animated Businessman */}
                <div className={`absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ${
                  marketStatus.isOpen ? 'left-0 animate-walk-line' : 'left-1/2 -translate-x-1/2'
                }`}>
                  {marketStatus.isOpen ? (
                    // Walking businessman (when market is open)
                    <div className="relative w-8 h-8 animate-bounce-subtle">
                      <svg width="32" height="32" viewBox="0 0 32 32" className="text-blue-500">
                        {/* Head */}
                        <circle cx="16" cy="8" r="4" fill="currentColor" />
                        {/* Body - suit */}
                        <rect x="12" y="12" width="8" height="12" rx="2" fill="currentColor" />
                        {/* Tie */}
                        <rect x="15" y="12" width="2" height="8" fill="#1e40af" />
                        {/* Arms */}
                        <rect x="8" y="16" width="3" height="8" rx="1.5" fill="currentColor" />
                        <rect x="21" y="16" width="3" height="8" rx="1.5" fill="currentColor" />
                        {/* Legs */}
                        <rect x="13" y="24" width="2.5" height="6" fill="#374151" />
                        <rect x="16.5" y="24" width="2.5" height="6" fill="#374151" />
                        {/* Shoes */}
                        <ellipse cx="14" cy="31" rx="2" ry="1" fill="#1f2937" />
                        <ellipse cx="18" cy="31" rx="2" ry="1" fill="#1f2937" />
                        {/* Briefcase */}
                        <rect x="22" y="20" width="4" height="3" rx="0.5" fill="#92400e" />
                      </svg>
                    </div>
                  ) : (
                    // Sitting businessman (when market is closed)
                    <div className="relative w-8 h-8">
                      <svg width="32" height="32" viewBox="0 0 32 32" className="text-gray-500">
                        {/* Head */}
                        <circle cx="16" cy="8" r="4" fill="currentColor" />
                        {/* Body - suit */}
                        <rect x="12" y="12" width="8" height="10" rx="2" fill="currentColor" />
                        {/* Tie */}
                        <rect x="15" y="12" width="2" height="6" fill="#1e40af" />
                        {/* Arms */}
                        <rect x="8" y="16" width="3" height="6" rx="1.5" fill="currentColor" />
                        <rect x="21" y="16" width="3" height="6" rx="1.5" fill="currentColor" />
                        {/* Legs - sitting position */}
                        <rect x="12" y="22" width="2.5" height="4" rx="1" fill="#374151" />
                        <rect x="17.5" y="22" width="2.5" height="4" rx="1" fill="#374151" />
                        {/* Chair base */}
                        <rect x="10" y="26" width="12" height="2" rx="1" fill="#6b7280" />
                      </svg>
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

        .animate-walk-line {
          animation: walk-line 4s ease-in-out infinite;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 0.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
