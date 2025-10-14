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
  if (pathname.startsWith('/onboarding')) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative">
      <ResponsiveNavigation 
        userName={user?.name || 'User'} 
        subscriptionTier={user?.subscriptionTier || 'free'}
        userAvatar={user?.avatarUrl}
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
