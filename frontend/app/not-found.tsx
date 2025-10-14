'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="text-center px-4">
        <h1 className="text-9xl font-black text-white mb-4">404</h1>
        <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
        <p className="text-slate-300 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Home className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}

