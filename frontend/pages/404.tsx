export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      color: 'white',
      textAlign: 'center',
      padding: '1rem'
    }}>
      <div>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem' }}>404</h1>
        <p style={{ opacity: 0.8 }}>Page not found</p>
      </div>
    </div>
  );
}


