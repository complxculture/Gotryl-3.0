'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { key?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong');
      } else {
        setApiKey(data.key ?? '');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (apiKey) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '32px', border: '1px solid #e2e8f0', borderRadius: 12 }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>✓</div>
        <h1 style={{ margin: '0 0 8px', fontSize: 22 }}>Your API key</h1>
        <p style={{ color: '#4a5568', fontSize: 14, marginBottom: 20 }}>
          Save this key — it won't be shown again. Use it to sign in and to authenticate the CLI.
        </p>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
          <code style={{ flex: 1, fontSize: 13, wordBreak: 'break-all', fontFamily: 'monospace' }}>{apiKey}</code>
          <button
            onClick={handleCopy}
            style={{ flexShrink: 0, background: copied ? '#38a169' : '#2b6cb0', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div style={{ background: '#fffbeb', border: '1px solid #f6e05e', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#744210' }}>
          Store this key in a safe place (password manager, .env file). You cannot retrieve it later.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link
            href="/login"
            style={{ background: '#2b6cb0', color: '#fff', padding: '10px', borderRadius: 6, textDecoration: 'none', fontSize: 15, fontWeight: 500, textAlign: 'center' }}
          >
            Sign in to dashboard
          </Link>
          <div style={{ fontSize: 13, color: '#718096', textAlign: 'center' }}>
            Or configure the CLI: <code style={{ fontFamily: 'monospace' }}>gotryl setup</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '24px', border: '1px solid #e2e8f0', borderRadius: 12 }}>
      <h1 style={{ margin: '0 0 8px', fontSize: 22 }}>Create an account</h1>
      <p style={{ color: '#4a5568', fontSize: 14, marginTop: 0, marginBottom: 24 }}>
        Enter your email to get an API key.
      </p>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
        />
        {error && <p style={{ color: '#e53e3e', marginTop: 8, fontSize: 14 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: 16, width: '100%', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 6, padding: '10px', fontSize: 15, cursor: 'pointer' }}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p style={{ marginTop: 20, fontSize: 14, color: '#718096', textAlign: 'center' }}>
        Already have a key?{' '}
        <Link href="/login" style={{ color: '#2b6cb0', textDecoration: 'none' }}>Sign in</Link>
      </p>
    </div>
  );
}
