'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { logout } from '@/lib/auth';
import ResponsiveNavigation from '@/components/ResponsiveNavigation';
import MarketStatusBar from '@/components/MarketStatusBar';
import TourTrigger from '@/components/TourTrigger';
import { useTour } from '@/contexts/TourContext';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTourTrigger, setShowTourTrigger] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { hasSeenTour } = useTour();

  const handleLogout = () => logout();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = Cookies.get('token');
        if (!token) {
          router.push('/');
          return;
        }

        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data.user);
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  // Show tour trigger for ALL users on ALL pages (removed restrictions)
  useEffect(() => {
    if (!loading && user) {
      // Always show the floating tour trigger after a short delay
      const timer = setTimeout(() => {
        setShowTourTrigger(true);
      }, 2000); // Show after 2 seconds
      
      return () => clearTimeout(timer);
    }
  }, [loading, user]);


  // Don't show layout for auth pages
  if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
    return <>{children}</>;
  }

  // Don't show layout for onboarding
  if (pathname?.startsWith('/onboarding')) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        {/* IC Tree thinking animation - subtle pulsing */}
        <div 
          className="pointer-events-none"
          style={{ 
            opacity: 0.15,
            animation: 'pulse 2s ease-in-out infinite'
          }}
        >
          <svg width="80" height="80" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g fill="#D4AF37">
              <text x="52" y="62" fontFamily="serif" fontSize="18" fontWeight="bold" textAnchor="middle" fill="#D4AF37">IC</text>
              <path d="M35 55 Q40 35 45 55 Q50 30 55 55 Q60 25 65 55 Q70 30 75 55 Q80 35 85 55" stroke="#D4AF37" strokeWidth="2" fill="none" opacity="0.6"/>
              <path d="M35 65 Q40 85 45 65 Q50 90 55 65 Q60 95 65 65 Q70 90 75 65 Q80 85 85 65" stroke="#D4AF37" strokeWidth="2" fill="none" opacity="0.6"/>
            </g>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative">
      <ResponsiveNavigation 
        userName={user?.name || 'User'} 
        subscriptionTier={user?.subscriptionTier || 'free'}
        userAvatar={user?.avatar}
        isAdmin={user?.isAdmin || false}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col relative z-10">
        {/* Market Status Bar - positioned at the top */}
        <MarketStatusBar />
        
        {/* Main Content - Optimized spacing */}
        <div className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 pt-4 pb-4 sm:pt-6 sm:pb-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>

        {/* Tour Trigger - Floating */}
        {showTourTrigger && (
          <TourTrigger variant="floating" />
        )}
      </div>
    </div>
  );
}
