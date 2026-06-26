'use client';
import { useState } from 'react';

export default function AuthHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header style={{ borderBottom: '1px solid #e5e7eb', background: '#fff', position: 'sticky', top: 0, zIndex: 40 }}>
      <div className="auth-header-inner" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/projects" style={{ fontWeight: 700, fontSize: 17, color: '#111827', textDecoration: 'none' }}>Gotryl</a>

        <div className="auth-nav">
          <a href="/projects" style={{ fontSize: 14, color: '#6b7280', textDecoration: 'none', fontWeight: 500 }}>Projects</a>
          <a href="/settings/keys" style={{ fontSize: 14, color: '#6b7280', textDecoration: 'none', fontWeight: 500 }}>API Keys</a>
          <form action="/api/auth" method="POST">
            <input type="hidden" name="_method" value="DELETE" />
            <button type="submit" style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 14, color: '#374151', fontWeight: 500 }}>
              Sign out
            </button>
          </form>
        </div>

        <button className="auth-mobile-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div className="auth-mobile-menu" style={{ display: 'flex' }}>
          <a href="/projects" onClick={() => setOpen(false)}>Projects</a>
          <a href="/settings/keys" onClick={() => setOpen(false)}>API Keys</a>
          <form action="/api/auth" method="POST">
            <input type="hidden" name="_method" value="DELETE" />
            <button type="submit">Sign out</button>
          </form>
        </div>
      )}
    </header>
  );
}
