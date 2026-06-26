import { redirect } from 'next/navigation';
import { getClient } from '@/lib/session';

const STATUS: Record<string, { color: string; bg: string }> = {
  passed:  { color: '#15803d', bg: '#dcfce7' },
  failed:  { color: '#dc2626', bg: '#fee2e2' },
  error:   { color: '#d97706', bg: '#fef3c7' },
  queued:  { color: '#6b7280', bg: '#f3f4f6' },
  running: { color: '#2563eb', bg: '#eff6ff' },
};

function statusBadge(s: string) {
  const c = STATUS[s] ?? STATUS.queued;
  return <span style={{ background: c.bg, color: c.color, borderRadius: 5, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{s}</span>;
}

function fmt(ms: number) { return `${(ms / 1000).toFixed(1)}s`; }

export default async function RunHistoryPage({ params }: { params: { projectId: string; testId: string } }) {
  const { projectId, testId } = params;

  let client;
  try { client = getClient(); } catch { redirect('/login'); }

  const [test, runs] = await Promise.all([
    client.tests.get(testId),
    client.runs.list(testId),
  ]);

  const sorted = runs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <a href={`/projects/${projectId}/tests`} style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>← Tests</a>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: '6px 0 4px', letterSpacing: '-0.3px' }}>Run history</h1>
        <div style={{ fontSize: 14, color: '#374151', marginBottom: 2 }}>{test.description}</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
          <a
            href={`/projects/${projectId}/tests/${testId}/new-run${sorted[0]?.targetUrl ? `?targetUrl=${encodeURIComponent(sorted[0].targetUrl)}` : ''}`}
            style={{ background: '#2563eb', color: '#fff', padding: '6px 16px', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
          >
            Run again
          </a>
          {test.generatedCode && (
            <a href={`/projects/${projectId}/tests/${testId}/code`} style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>View code</a>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', border: '2px dashed #e5e7eb', borderRadius: 12 }}>
          <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>No runs yet. Hit "Run again" to start the first one.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map((run) => (
            <a
              key={run.id}
              href={`/projects/${projectId}/runs/${run.id}`}
              style={{ display: 'block', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {statusBadge(run.status)}
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                    {run.completedAt ? new Date(run.completedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'In progress'}
                  </span>
                  {run.durationMs != null && (
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>{fmt(run.durationMs)}</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {run.targetUrl}
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#d1d5db', fontFamily: 'monospace', marginTop: 6 }}>{run.id}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
