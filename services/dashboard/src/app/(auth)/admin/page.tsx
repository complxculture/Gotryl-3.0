import { redirect } from 'next/navigation';
import { getClient, BASE_URL } from '@/lib/session';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';

interface AdminStats {
  accounts: { total: number; last7d: number };
  projects: { total: number; last7d: number };
  tests: { total: number; last7d: number };
  runs: { total: number; last7d: number; passed: number; failed: number; running: number; queued: number };
  recentRuns: Array<{
    id: string;
    accountId: string;
    testId: string;
    targetUrl: string;
    status: string;
    durationMs: number | null;
    createdAt: string;
  }>;
  recentSignups: Array<{ accountId: string; email: string; createdAt: string }>;
}

async function fetchStats(): Promise<AdminStats | null> {
  const secret = process.env.INTERNAL_SERVICE_SECRET;
  if (!secret) return null;
  try {
    const res = await fetch(`${BASE_URL}/v1/admin/stats`, {
      headers: { 'x-internal-secret': secret },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<AdminStats>;
  } catch {
    return null;
  }
}

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function fmtDuration(ms: number | null) {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const STATUS_COLOR: Record<string, string> = {
  passed: '#16a34a',
  failed: '#dc2626',
  running: '#2563eb',
  queued: '#9ca3af',
};

function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '20px 24px' }}>
      <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>{sub}</div>
    </div>
  );
}

export default async function AdminPage() {
  let client;
  try { client = getClient(); } catch { redirect('/login'); }

  const me = await client.auth.getMe();
  if (!ADMIN_EMAIL || me.email !== ADMIN_EMAIL) {
    redirect('/projects');
  }

  const stats = await fetchStats();

  if (!stats) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280' }}>
        Failed to load stats. Check that INTERNAL_SERVICE_SECRET is set on the dashboard.
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Admin</h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Platform-wide activity overview</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
        <StatCard label="Accounts" value={stats.accounts.total} sub={`+${stats.accounts.last7d} this week`} />
        <StatCard label="Projects" value={stats.projects.total} sub={`+${stats.projects.last7d} this week`} />
        <StatCard label="Tests" value={stats.tests.total} sub={`+${stats.tests.last7d} this week`} />
        <StatCard label="Total runs" value={stats.runs.total} sub={`+${stats.runs.last7d} this week`} />
        <StatCard label="Passing" value={stats.runs.passed} sub="all time" />
        <StatCard label="Failing" value={stats.runs.failed} sub="all time" />
        <StatCard label="Running" value={stats.runs.running} sub="right now" />
        <StatCard label="Queued" value={stats.runs.queued} sub="right now" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent signups */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Recent signups</h2>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
            {stats.recentSignups.length === 0 ? (
              <div style={{ padding: '24px', color: '#9ca3af', fontSize: 14, textAlign: 'center' }}>No signups yet</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Email</th>
                    <th style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Signed up</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentSignups.map((s, i) => (
                    <tr key={s.accountId} style={{ borderBottom: i < stats.recentSignups.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <td style={{ padding: '10px 16px', color: '#111827', fontWeight: 500 }}>{s.email}</td>
                      <td style={{ padding: '10px 16px', color: '#6b7280', textAlign: 'right', whiteSpace: 'nowrap' }}>{timeAgo(s.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent runs */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Recent runs</h2>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
            {stats.recentRuns.length === 0 ? (
              <div style={{ padding: '24px', color: '#9ca3af', fontSize: 14, textAlign: 'center' }}>No runs yet</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Status</th>
                    <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Target</th>
                    <th style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Duration</th>
                    <th style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>When</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentRuns.map((r, i) => {
                    const host = (() => { try { return new URL(r.targetUrl).hostname; } catch { return r.targetUrl; } })();
                    return (
                      <tr key={r.id} style={{ borderBottom: i < stats.recentRuns.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[r.status] ?? '#9ca3af', marginRight: 6 }} />
                          <span style={{ color: STATUS_COLOR[r.status] ?? '#6b7280', fontWeight: 500 }}>{r.status}</span>
                        </td>
                        <td style={{ padding: '10px 16px', color: '#374151', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{host}</td>
                        <td style={{ padding: '10px 16px', color: '#6b7280', textAlign: 'right', whiteSpace: 'nowrap' }}>{fmtDuration(r.durationMs)}</td>
                        <td style={{ padding: '10px 16px', color: '#6b7280', textAlign: 'right', whiteSpace: 'nowrap' }}>{timeAgo(r.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
