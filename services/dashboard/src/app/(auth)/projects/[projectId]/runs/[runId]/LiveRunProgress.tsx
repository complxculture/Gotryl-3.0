'use client';
import { useState, useEffect } from 'react';

const PHASES = [
  { after: 0,  label: 'Queued — waiting for a runner' },
  { after: 5,  label: 'Starting browser environment' },
  { after: 14, label: 'Running test steps with Playwright' },
  { after: 50, label: 'Uploading artifacts & analyzing results' },
];

export function LiveRunProgress({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState(() =>
    Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  const currentPhaseIdx = [...PHASES].reduce((acc, p, i) => (elapsed >= p.after ? i : acc), 0);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const elapsedStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div style={{ border: '1px solid #bfdbfe', borderRadius: 10, background: '#eff6ff', padding: '18px 24px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{
          display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
          background: '#2563eb', flexShrink: 0,
        }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: '#1e40af' }}>
          Live — {elapsedStr} elapsed
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PHASES.map((phase, i) => {
          const reached = elapsed >= phase.after;
          const active = i === currentPhaseIdx;
          const done = reached && i < currentPhaseIdx;

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: reached ? 1 : 0.3 }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${done ? '#22c55e' : active ? '#2563eb' : '#d1d5db'}`,
                background: done ? '#22c55e' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: '#fff', lineHeight: 1,
              }}>
                {done ? '✓' : active ? '·' : ''}
              </span>
              <span style={{
                fontSize: 13,
                color: done ? '#15803d' : active ? '#1e40af' : '#9ca3af',
                fontWeight: active ? 600 : 400,
              }}>
                {phase.label}
              </span>
              {active && (
                <span style={{ fontSize: 11, color: '#93c5fd', marginLeft: 'auto' }}>
                  {elapsedStr}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
