'use client';
import { useState } from 'react';
import Link from 'next/link';

const STEPS = [
  { n: 1, label: 'Install the CLI', code: 'npm install -g @gotryl/cli' },
  { n: 2, label: 'Authenticate', code: 'gotryl setup', note: 'Paste your key above when prompted' },
  { n: 3, label: 'Create a project', code: 'gotryl project create --name "My App"' },
  { n: 4, label: 'Run your first test', code: 'gotryl test create --project <id> \\\n  --description "homepage loads correctly"\ngotryl test run <id> \\\n  --target-url https://yourapp.com --wait' },
];

function OnboardingSuccess({ apiKey }: { apiKey: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ maxWidth: 560, margin: '48px auto', padding: '0 24px' }}>

      {/* Key display */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '28px', marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.3px' }}>
          You&apos;re in. Here&apos;s your API key.
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 20px' }}>
          Save this — it won&apos;t be shown again. You&apos;ll use it to sign in and authenticate the CLI.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px', marginBottom: 12 }}>
          <code style={{ flex: 1, fontSize: 13, wordBreak: 'break-all', fontFamily: '"JetBrains Mono", "Fira Code", monospace', color: '#111827' }}>
            {apiKey}
          </code>
          <button
            onClick={copy}
            style={{ flexShrink: 0, background: copied ? '#16a34a' : '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600, transition: 'background 0.15s' }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 7, padding: '10px 14px', fontSize: 13, color: '#92400e' }}>
          Store this in a password manager or .env file — you cannot retrieve it later.
        </div>
      </div>

      {/* Onboarding steps */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '20px 24px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Run your first test in 2 minutes</h2>
        </div>
        <div style={{ padding: '8px 0' }}>
          {STEPS.map((step, i) => (
            <div key={step.n} style={{ padding: '16px 24px', borderBottom: i < STEPS.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  {step.n}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 8 }}>{step.label}</div>
                  <pre style={{ margin: 0, background: '#0f172a', borderRadius: 7, padding: '10px 14px', fontSize: 12, color: '#e2e8f0', fontFamily: '"JetBrains Mono", "Fira Code", monospace', overflowX: 'auto', whiteSpace: 'pre' }}>
                    {step.code}
                  </pre>
                  {step.note && (
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>{step.note}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Link
          href="/projects"
          style={{ flex: 1, background: '#2563eb', color: '#fff', padding: '11px', borderRadius: 7, textDecoration: 'none', fontSize: 15, fontWeight: 700, textAlign: 'center' }}
        >
          Go to dashboard →
        </Link>
        <Link
          href="/login"
          style={{ padding: '11px 20px', borderRadius: 7, textDecoration: 'none', fontSize: 15, fontWeight: 500, color: '#6b7280', border: '1px solid #e5e7eb', textAlign: 'center' }}
        >
          Sign in later
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
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
      if (!res.ok) setError(data.error ?? 'Something went wrong');
      else setApiKey(data.key ?? '');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (apiKey) return <OnboardingSuccess apiKey={apiKey} />;

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '28px 24px', border: '1px solid #e5e7eb', borderRadius: 12 }}>
      <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800 }}>Create an account</h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginTop: 0, marginBottom: 24 }}>
        Enter your email to get an API key instantly.
      </p>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
        />
        {error && <p style={{ color: '#dc2626', marginTop: 8, fontSize: 14 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: 16, width: '100%', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, padding: '10px', fontSize: 15, cursor: 'pointer', fontWeight: 700 }}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p style={{ marginTop: 20, fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
        Already have a key?{' '}
        <Link href="/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
      </p>
    </div>
  );
}
