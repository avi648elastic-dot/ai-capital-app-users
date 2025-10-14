'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom right, #0f172a, #7f1d1d, #0f172a)'
        }}>
          <div style={{ textAlign: 'center', padding: '1rem', maxWidth: '42rem' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 900, color: 'white', marginBottom: '1rem' }}>500</h1>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>Server Error</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '2rem' }}>
              We encountered a critical error. Please refresh the page or try again later.
            </p>
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
          </div>
        </div>
      </body>
    </html>
  );
}

