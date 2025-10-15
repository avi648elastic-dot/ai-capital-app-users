export default function ErrorPage() {
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
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem' }}>Error</h1>
        <p style={{ opacity: 0.8 }}>An unexpected error occurred.</p>
      </div>
    </div>
  );
}


