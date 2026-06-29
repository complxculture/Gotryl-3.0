'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';

type LT = 'prompt' | 'info' | 'pass' | 'fail' | 'diag';
interface TLine { type: LT; text: string }

const SEQS: TLine[][] = [
  [
    { type: 'prompt', text: 'gotryl test run tst_k7m --target https://acme.app --wait' },
    { type: 'info',   text: 'Generating Playwright script...' },
    { type: 'info',   text: 'Container ready. Running Chrome...' },
    { type: 'pass',   text: '✓  Run passed  (3.8s)' },
  ],
  [
    { type: 'prompt', text: 'gotryl test run tst_9qx --target https://acme.app --wait' },
    { type: 'info',   text: 'Generating Playwright script...' },
    { type: 'info',   text: 'Container ready. Running Chrome...' },
    { type: 'fail',   text: '✕  Run failed  (2.1s)' },
    { type: 'diag',   text: '"Submit" button not found. Login form may\nhave changed. Try --regenerate to update.' },
  ],
];

export default function LandingHero() {
  const reduce = useReducedMotion();
  const [seq, setSeq]     = useState(0);
  const [count, setCount] = useState(0);
  const [fading, setFading] = useState(false);
  const lines = SEQS[seq];

  useEffect(() => {
    if (reduce) { setCount(lines.length); return; }
    let t: ReturnType<typeof setTimeout>;
    if (count < lines.length) {
      t = setTimeout(() => setCount(c => c + 1), 820);
    } else {
      t = setTimeout(() => {
        setFading(true);
        setTimeout(() => {
          setSeq(s => (s + 1) % SEQS.length);
          setCount(0);
          setFading(false);
        }, 500);
      }, 3200);
    }
    return () => clearTimeout(t);
  }, [count, lines.length, reduce, seq]);

  return (
    <section
      style={{
        background: 'linear-gradient(160deg,#0a0e1a 0%,#0f172a 100%)',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(100px,12vh,130px) 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow - draws eye toward terminal */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 50% at 72% 42%, rgba(37,99,235,0.11) 0%, transparent 60%)',
        }}
      />

      <div className="hero-grid" style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>

        {/* ── Left: copy ── */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.22)',
            color: '#93c5fd',
            fontSize: 12, fontWeight: 600,
            padding: '5px 14px', borderRadius: 20,
            marginBottom: 28, letterSpacing: '0.04em',
          }}>
            <span
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }}
              className="status-dot"
            />
            AI-powered cloud testing
          </div>

          <h1 style={{
            fontSize: 'clamp(38px,5vw,56px)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-2px',
            color: '#f8fafc',
            margin: '0 0 20px',
          }}>
            Test anything.<br />
            In plain English.
          </h1>

          <p style={{
            fontSize: 17,
            color: '#94a3b8',
            lineHeight: 1.72,
            maxWidth: 400,
            margin: '0 0 36px',
          }}>
            Describe what to test. Gotryl generates the Playwright code,
            runs it in the cloud, and tells you exactly what broke.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }} className="hero-ctas">
            <Link
              href="/signup"
              style={{
                background: '#2563eb', color: '#fff',
                padding: '12px 28px', borderRadius: 8,
                textDecoration: 'none', fontSize: 15, fontWeight: 600,
                display: 'inline-block',
              }}
            >
              Get started free
            </Link>
            <a
              href="#how-it-works"
              style={{
                background: 'rgba(255,255,255,0.07)', color: '#e2e8f0',
                padding: '12px 24px', borderRadius: 8,
                textDecoration: 'none', fontSize: 15, fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'inline-block',
              }}
            >
              See how it works
            </a>
          </div>
        </motion.div>

        {/* ── Right: looping animated terminal ── */}
        <motion.div
          initial={reduce ? false : { opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{
            background: '#0d1117',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 32px 90px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
            overflow: 'hidden',
          }}>
            {/* Traffic lights */}
            <div style={{
              background: '#161b22',
              padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 7,
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
              <span style={{
                marginLeft: 8, fontSize: 11, color: '#4b5563',
                fontFamily: 'var(--font-plex),monospace',
              }}>
                gotryl
              </span>
            </div>

            {/* Terminal body - fades out between sequences */}
            <motion.div
              animate={{ opacity: fading ? 0 : 1 }}
              transition={{ duration: 0.48, ease: 'easeInOut' }}
              style={{
                padding: '18px 20px 20px',
                fontFamily: 'var(--font-plex),"JetBrains Mono",monospace',
                fontSize: 13, lineHeight: 1.85,
                minHeight: 220,
              }}
            >
              {lines.slice(0, count).map((line, i) => (
                <motion.div
                  key={`${seq}-${i}`}
                  initial={reduce ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  style={{ marginBottom: line.type === 'diag' ? 0 : 1 }}
                >
                  {line.type === 'prompt' && (
                    <span>
                      <span style={{ color: '#4ade80', userSelect: 'none' }}>$ </span>
                      <span style={{ color: '#e2e8f0' }}>{line.text}</span>
                    </span>
                  )}
                  {line.type === 'info' && (
                    <span style={{ color: '#475569', paddingLeft: 14, display: 'block' }}>{line.text}</span>
                  )}
                  {line.type === 'pass' && (
                    <span style={{ color: '#4ade80', fontWeight: 600 }}>{line.text}</span>
                  )}
                  {line.type === 'fail' && (
                    <span style={{ color: '#f87171', fontWeight: 600 }}>{line.text}</span>
                  )}
                  {line.type === 'diag' && (
                    <div style={{
                      background: 'rgba(251,191,36,0.06)',
                      borderLeft: '2px solid rgba(251,191,36,0.35)',
                      color: '#fcd34d',
                      padding: '8px 12px',
                      borderRadius: '0 6px 6px 0',
                      marginTop: 6,
                      fontSize: 12,
                      lineHeight: 1.65,
                      whiteSpace: 'pre',
                    }}>
                      {line.text}
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Blinking cursor — communicates the terminal is active */}
              {!fading && count < lines.length && (
                <span className="terminal-cursor" style={{ color: '#64748b', fontFamily: 'monospace' }}>_</span>
              )}
            </motion.div>
          </div>

          {/* Subtle label below terminal */}
          <p style={{
            textAlign: 'center', fontSize: 12,
            color: '#334155', marginTop: 12,
            fontFamily: 'var(--font-plex),monospace',
            letterSpacing: '0.03em',
          }}>
            real cloud run · no local install needed
          </p>
        </motion.div>
      </div>
    </section>
  );
}
