'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: 'rgba(10,14,26,0.85)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      height: 64,
      display: 'flex',
      alignItems: 'center',
    }}>
      <div
        className="auth-header-inner"
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '0 24px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <Link
            href="/"
            style={{
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: '-0.5px',
              color: '#f8fafc',
              textDecoration: 'none',
            }}
          >
            Gotryl
          </Link>

          <nav className="nav-desktop-links">
            <a
              href="https://github.com/complxculture/Gotryl-3.0#readme"
              style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none', fontWeight: 500 }}
            >
              Docs
            </a>
            <a
              href="https://github.com/complxculture/Gotryl-3.0"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none', fontWeight: 500 }}
            >
              GitHub
            </a>
            <a
              href="https://discord.gg/yFnTYU3Hqr"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'none', fontWeight: 500 }}
            >
              Discord
            </a>
          </nav>
        </div>

        <div className="nav-desktop-ctas">
          <Link
            href="/login"
            style={{
              fontSize: 14, color: '#94a3b8',
              textDecoration: 'none', fontWeight: 500,
              padding: '6px 14px',
            }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            style={{
              fontSize: 14,
              background: '#2563eb',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              padding: '7px 18px',
              borderRadius: 7,
              display: 'inline-block',
            }}
          >
            Get started free
          </Link>
        </div>

        <button
          className="nav-mobile-btn"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          style={{ color: '#94a3b8' }}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div
          className="nav-mobile-menu"
          style={{
            position: 'absolute',
            top: 64,
            left: 0,
            right: 0,
            background: '#0a0e1a',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {[
            { label: 'Docs', href: 'https://github.com/complxculture/Gotryl-3.0#readme' },
            { label: 'GitHub', href: 'https://github.com/complxculture/Gotryl-3.0' },
            { label: 'Discord', href: 'https://discord.gg/yFnTYU3Hqr' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              style={{
                display: 'block', padding: '10px 0',
                fontSize: 15, color: '#94a3b8',
                textDecoration: 'none', fontWeight: 500,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {label}
            </a>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              style={{
                flex: 1, textAlign: 'center', padding: '10px',
                fontSize: 14, color: '#94a3b8',
                textDecoration: 'none', fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 7,
              }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              style={{
                flex: 1, textAlign: 'center', padding: '10px',
                fontSize: 14, background: '#2563eb', color: '#fff',
                textDecoration: 'none', fontWeight: 600,
                borderRadius: 7,
              }}
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
