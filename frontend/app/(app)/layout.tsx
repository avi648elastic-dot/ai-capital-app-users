'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import ResponsiveNavigation from '@/components/ResponsiveNavigation';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/');
  };

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
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <ResponsiveNavigation 
        userName={user?.name || 'User'} 
        subscriptionTier={user?.subscriptionTier || 'free'}
        userAvatar={user?.avatarUrl}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 pt-20 lg:pt-8 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
