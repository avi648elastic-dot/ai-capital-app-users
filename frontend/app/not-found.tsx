export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom right, #0f172a, #1e3a8a, #0f172a)'
    }}>
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <h1 style={{ fontSize: '9rem', fontWeight: 900, color: 'white', marginBottom: '1rem' }}>404</h1>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>Page Not Found</h2>
        <p style={{ color: '#cbd5e1', marginBottom: '2rem', maxWidth: '28rem', margin: '0 auto 2rem' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#2563eb',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: 600
          }}
        >
          <span>Back to Dashboard</span>
        </a>
      </div>
    </div>
  );
}

