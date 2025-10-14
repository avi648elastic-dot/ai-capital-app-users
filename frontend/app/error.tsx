'use client';

import { useEffect } from 'react';

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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom right, #0f172a, #7f1d1d, #0f172a)'
    }}>
      <div style={{ textAlign: 'center', padding: '1rem', maxWidth: '42rem' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 900, color: 'white', marginBottom: '1rem' }}>Oops!</h1>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>Something went wrong</h2>
        <p style={{ color: '#cbd5e1', marginBottom: '2rem' }}>
          We encountered an unexpected error. Please try again or return to the dashboard.
        </p>
        {error.message && (
          <div style={{
            background: 'rgba(127, 29, 29, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '2rem'
          }}>
            <p style={{ color: '#fca5a5', fontSize: '0.875rem', fontFamily: 'monospace' }}>{error.message}</p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
          <button
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#2563eb',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#334155',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

