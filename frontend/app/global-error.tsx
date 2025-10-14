'use client';

import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
          <div className="text-center px-4 max-w-2xl">
            <AlertTriangle className="w-24 h-24 text-red-400 mx-auto mb-6" />
            <h1 className="text-6xl font-black text-white mb-4">500</h1>
            <h2 className="text-3xl font-bold text-white mb-4">Server Error</h2>
            <p className="text-slate-300 mb-8">
              We encountered a critical error. Please refresh the page or try again later.
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

