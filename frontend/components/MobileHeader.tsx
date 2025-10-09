'use client';

import { BarChart3 } from 'lucide-react';
import { useDevice } from '@/hooks/useDevice';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
}

export default function MobileHeader({ title, subtitle }: MobileHeaderProps) {
  const { isMobile } = useDevice();

  // Only show on mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 to-emerald-600 shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{title}</h1>
            {subtitle && <p className="text-xs text-blue-100">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}