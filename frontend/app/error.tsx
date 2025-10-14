'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      <div className="text-center px-4 max-w-2xl">
        <AlertTriangle className="w-24 h-24 text-red-400 mx-auto mb-6" />
        <h1 className="text-6xl font-black text-white mb-4">Oops!</h1>
        <h2 className="text-3xl font-bold text-white mb-4">Something went wrong</h2>
        <p className="text-slate-300 mb-8">
          We encountered an unexpected error. Please try again or return to the dashboard.
        </p>
        {error.message && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-8">
            <p className="text-red-300 text-sm font-mono">{error.message}</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

