'use client';

import { Menu, BarChart3 } from 'lucide-react';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
}

export default function MobileHeader({ title, subtitle }: MobileHeaderProps) {
  return (
    <>
      {/* Mobile Header - Always Visible */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-emerald-600 shadow-lg">
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
          
          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Spacer for mobile header */}
      <div className="lg:hidden h-16"></div>
    </>
  );
}
