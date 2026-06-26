'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? 'Invalid API key');
      } else {
        router.push(params.get('from') ?? '/projects');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '28px', border: '1px solid #e5e7eb', borderRadius: 12 }}>
      <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800 }}>Sign in to Gotryl</h1>
      <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 24px' }}>
        Use your API key to access the dashboard.
      </p>

      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="gk_..."
          required
          style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
        />
        {error && <p style={{ color: '#dc2626', marginTop: 8, fontSize: 14 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: 16, width: '100%', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, padding: '10px', fontSize: 15, cursor: 'pointer', fontWeight: 700 }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '24px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>First time here?</div>
          <Link href="/signup" style={{ fontSize: 14, color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
            → Create an account
          </Link>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Lost your API key?</div>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
            If you still have access to your account, go to{' '}
            <strong>Settings → API Keys</strong> to generate a new one. Otherwise, contact your team admin or{' '}
            <Link href="/signup" style={{ color: '#2563eb', textDecoration: 'none' }}>create a new account</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
