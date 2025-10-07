'use client';

import { useMemo, useState } from 'react';
import { LogOut, User, Settings, TrendingUp, BarChart3 } from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface HeaderProps {
  userName?: string;
  showNavigation?: boolean;
  isAdmin?: boolean;
}

export default function Header({ userName, showNavigation = true, isAdmin = false }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/');
  };

  const TreeLogo = () => {
    const bills = useMemo(() => Array.from({ length: 14 }).map((_, i) => ({
      duration: 2.8 + Math.random() * 2.8,
      delay: Math.random() * 1.8,
    })), []);

    return (
      <div className="relative flex items-center space-x-3">
        <div className="relative w-14 h-14">
          {/* Brand image fallback-safe */}
          <Image src="/brand/tree.png" alt="logo" fill sizes="40px" className="object-contain" priority />
          {/* Dollar rain */}
          {bills.map((b, idx) => (
            <span
              key={idx}
              className="absolute text-emerald-300/80"
              style={{ left: '50%', transform: 'translateX(-50%)', top: '6px', animation: `fall ${b.duration}s linear ${b.delay}s infinite` }}
            >
              $
            </span>
          ))}
          <style jsx>{`
            @keyframes fall { from { transform: translate(-50%,0); opacity: .9 } to { transform: translate(-50%,28px); opacity: 0 } }
          `}</style>
        </div>
        <div>
          <h1 className="logo-text text-xl">AI-Capital</h1>
          <p className="text-xs text-slate-400 font-medium">Professional Portfolio Management</p>
        </div>
      </div>
    );
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Branding */}
          <div className="flex items-center">
            <TreeLogo />
          </div>

          {/* Navigation */}
          {showNavigation && (
            <nav className="hidden md:flex space-x-8">
              <a
                href="/dashboard"
                className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors duration-200"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </a>
              <a
                href="/portfolio"
                className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors duration-200"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Portfolio</span>
              </a>
              <a
                href="/analytics"
                className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors duration-200"
              >
                <Settings className="w-4 h-4" />
                <span>Analytics</span>
              </a>
            </nav>
          )}

          {/* User Menu */}
          {userName && (
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-slate-200">Welcome, {userName}</p>
                <p className="text-xs text-slate-400">Portfolio Manager</p>
              </div>
              
              {/* User Avatar */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
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
    </header>
  );
}
