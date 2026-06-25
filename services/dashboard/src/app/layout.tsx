import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gotryl Dashboard',
  description: 'Cloud Playwright Test Runner',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: '0 24px', maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto' }}>
        <header style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 0', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/projects" style={{ fontWeight: 700, fontSize: 18, color: '#1a202c', textDecoration: 'none' }}>Gotryl</a>
          <form action="/api/auth" method="POST">
            <input type="hidden" name="_method" value="DELETE" />
            <button type="submit" style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Sign out</button>
          </form>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
