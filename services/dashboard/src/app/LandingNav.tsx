'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const MONO = "var(--font-plex), 'IBM Plex Mono', 'Courier New', monospace";

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    padding: scrolled ? '13px 0' : '20px 0',
    background: scrolled ? 'rgba(0,0,0,0.92)' : 'transparent',
    backdropFilter: scrolled ? 'blur(20px)' : 'none',
    WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
    borderBottom: scrolled ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
    transition: 'padding 0.3s, background 0.3s, border-color 0.3s',
  };

  const linkStyle: React.CSSProperties = {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.82)',
    textDecoration: 'none',
  };

  return (
    <header style={navStyle}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, border: '1px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>G</div>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', color: '#fff', textTransform: 'uppercase' }}>Gotryl</span>
        </Link>

        {/* Status badge — hidden on mobile via CSS */}
        <div className="nav-status-badge" style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.58)', textTransform: 'uppercase' }}>
          <span className="status-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.6)', display: 'inline-block', flexShrink: 0 }} aria-hidden="true" />
          CLOUD ACTIVE
        </div>

        {/* Desktop links */}
        <nav className="nav-desktop-links" aria-label="Main navigation">
          <a href="https://github.com/complxculture/Gotryl-3.0#readme" style={linkStyle}>Docs</a>
          <a href="https://github.com/complxculture/Gotryl-3.0" target="_blank" rel="noreferrer" style={linkStyle}>GitHub</a>
          <a href="https://discord.gg/yFnTYU3Hqr" target="_blank" rel="noreferrer" style={linkStyle}>Discord</a>
          <Link href="/login" style={linkStyle}>Sign in</Link>
          <Link href="/signup" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', padding: '7px 16px', border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none' }}>
            // GET STARTED
          </Link>
        </nav>

        {/* Hamburger */}
        <button className="nav-mobile-btn" onClick={() => setOpen(!open)} aria-label="Toggle navigation menu" aria-expanded={open}>
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 32px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.96)', gap: 0 }}>
          {[
            { label: 'Docs', href: 'https://github.com/complxculture/Gotryl-3.0#readme', external: true },
            { label: 'GitHub', href: 'https://github.com/complxculture/Gotryl-3.0', external: true },
            { label: 'Discord', href: 'https://discord.gg/yFnTYU3Hqr', external: true },
            { label: 'Sign in', href: '/login', external: false },
          ].map(({ label, href, external }) => (
            <a
              key={label}
              href={href}
              {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
              onClick={() => setOpen(false)}
              style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', textDecoration: 'none' }}
            >
              {label}
            </a>
          ))}
          <Link href="/signup" onClick={() => setOpen(false)} style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', padding: '12px 0', textDecoration: 'none' }}>
            // Get started →
          </Link>
        </div>
      )}
    </header>
  );
}
