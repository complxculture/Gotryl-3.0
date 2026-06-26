export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto 24px' }}>
        <a href="/projects" style={{ fontWeight: 700, fontSize: 18, color: '#1a202c', textDecoration: 'none' }}>Gotryl</a>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="/settings/keys" style={{ fontSize: 14, color: '#4a5568', textDecoration: 'none' }}>API Keys</a>
        <form action="/api/auth" method="POST">
          <input type="hidden" name="_method" value="DELETE" />
          <button type="submit" style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Sign out</button>
        </form>
        </div>
      </header>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>{children}</main>
    </>
  );
}
