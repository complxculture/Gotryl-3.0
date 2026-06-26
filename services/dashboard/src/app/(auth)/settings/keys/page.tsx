'use client';
import { useState, useEffect } from 'react';

type Me = { accountId: string; email: string; createdAt: string };
type NewKey = { key: string; createdAt: string };

export default function KeysPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [newKey, setNewKey] = useState<NewKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setMe(d as Me))
      .catch(() => setError('Failed to load account info'));
  }, []);

  async function generateKey() {
    setGenerating(true);
    setError('');
    setNewKey(null);
    try {
      const res = await fetch('/api/keys', { method: 'POST' });
      const data = await res.json() as { key?: string; createdAt?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to generate key');
      } else {
        setNewKey({ key: data.key ?? '', createdAt: data.createdAt ?? '' });
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function copyKey(key: string) {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 22, marginBottom: 24 }}>API Keys</h1>

      {me && (
        <div style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 28 }}>
          <div style={{ fontSize: 13, color: '#718096', marginBottom: 4 }}>Account</div>
          <div style={{ fontWeight: 500 }}>{me.email}</div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{me.accountId}</div>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Generate a new key</h2>
        <p style={{ fontSize: 14, color: '#4a5568', margin: '0 0 16px' }}>
          New keys are shown once. Previous keys remain valid until you revoke them.
        </p>
        <button
          onClick={generateKey}
          disabled={generating}
          style={{ background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}
        >
          {generating ? 'Generating…' : 'Generate new API key'}
        </button>
        {error && <p style={{ color: '#e53e3e', fontSize: 14, marginTop: 10 }}>{error}</p>}
      </div>

      {newKey && (
        <div style={{ border: '1px solid #38a169', borderRadius: 8, padding: 16, background: '#f0fff4' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#276749' }}>New key generated</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <code style={{ flex: 1, background: '#fff', border: '1px solid #c6f6d5', borderRadius: 6, padding: '8px 12px', fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {newKey.key}
            </code>
            <button
              onClick={() => copyKey(newKey.key)}
              style={{ flexShrink: 0, background: copied ? '#38a169' : '#2b6cb0', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#276749', background: '#c6f6d5', borderRadius: 6, padding: '8px 12px' }}>
            Save this key now — it will not be shown again.
          </div>
        </div>
      )}
    </div>
  );
}
