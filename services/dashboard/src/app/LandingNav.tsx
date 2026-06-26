'use client';
import { useState } from 'react';
import Link from 'next/link';

const DARK = '#0f172a';

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e5e7eb' }}>
      <div className="auth-header-inner" style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link href="/" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', color: DARK, textDecoration: 'none' }}>
            Gotryl
          </Link>
          <nav className="nav-desktop-links">
            <a href="#how-it-works" style={{ fontSize: 14, color: '#6b7280', textDecoration: 'none', fontWeight: 500 }}>Docs</a>
            <a href="https://github.com/complxculture/Gotryl-3.0" target="_blank" rel="noreferrer" style={{ fontSize: 14, color: '#6b7280', textDecoration: 'none', fontWeight: 500 }}>GitHub</a>
          </nav>
        </div>

        <div className="nav-desktop-ctas">
          <Link href="/login" style={{ fontSize: 14, color: '#111827', textDecoration: 'none', fontWeight: 500, padding: '6px 14px' }}>
            Sign in
          </Link>
          <Link href="/signup" style={{ fontSize: 14, background: '#2563eb', color: '#fff', textDecoration: 'none', fontWeight: 600, padding: '7px 18px', borderRadius: 7 }}>
            Get started free
          </Link>
        </div>

        <button className="nav-mobile-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div className="nav-mobile-menu" style={{ display: 'flex' }}>
          <a href="#how-it-works" onClick={() => setOpen(false)}>Docs</a>
          <a href="https://github.com/complxculture/Gotryl-3.0" target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>GitHub</a>
          <Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>
          <Link href="/signup" className="nav-cta" onClick={() => setOpen(false)}>Get started free</Link>
        </div>
      )}
    </header>
  );
}
