import { redirect } from 'next/navigation';
import { getClient } from '@/lib/session';
import type { FailureBundle } from '@gotryl/sdk';
import { RunPoller } from './RunPoller';
import { LiveRunProgress } from './LiveRunProgress';

function fmt(ms: number) { return `${(ms / 1000).toFixed(1)}s`; }
function fmtDate(d: string) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  passed:  { label: 'Passed',  color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: '✓' },
  failed:  { label: 'Failed',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '✕' },
  error:   { label: 'Error',   color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '⚠' },
  queued:  { label: 'Queued',  color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', icon: '○' },
  running: { label: 'Running', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '⟳' },
};

export default async function RunDetailPage({ params }: { params: { projectId: string; runId: string } }) {
  const { projectId, runId } = params;

  let client;
  try { client = getClient(); } catch { redirect('/login'); }

  const run = await client.runs.get(runId);

  let test = { description: '' };
  try { test = await client.tests.get(run.testId); } catch { /* best effort */ }

  let bundle: FailureBundle | null = null;
  if ((run.status === 'failed' || run.status === 'error') && run.snapshotId) {
    try { bundle = await client.failures.getArtifacts(runId); } catch { /* no bundle */ }
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? process.env.GOTRYL_API_URL ?? 'http://localhost:3001';
  const cfg = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.queued;
  const testLabel = test.description
    ? (test.description.length > 60 ? test.description.slice(0, 57) + '…' : test.description)
    : run.testId;
  const isInfraError = run.status === 'error';

  const isLive = run.status === 'queued' || run.status === 'running';

  return (
    <div style={{ maxWidth: 800 }}>
      <RunPoller status={run.status} />

      {/* Breadcrumb */}
      <a
        href={`/projects/${projectId}/tests/${run.testId}/runs`}
        style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}
      >
        ← {testLabel}
      </a>

      {isLive && <LiveRunProgress createdAt={run.createdAt} />}

      {/* Status hero */}
      <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: '28px 32px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 32, color: cfg.color, fontWeight: 700, lineHeight: 1 }}>{cfg.icon}</span>
          <span style={{ fontSize: 28, fontWeight: 800, color: cfg.color, letterSpacing: '-0.5px' }}>{cfg.label}</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
          {test.description || 'Test run'}
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: '#6b7280' }}>
          <span>Target: <a href={run.targetUrl} style={{ color: '#2563eb' }}>{run.targetUrl}</a></span>
          {run.completedAt && <span>Ran {fmtDate(run.completedAt)}</span>}
          {run.durationMs != null && <span>Duration: {fmt(run.durationMs)}</span>}
        </div>
      </div>

      {/* Failure diagnosis — leads for PM */}
      {run.status === 'failed' && (
        <div style={{ border: '1px solid #fecaca', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ background: '#fef2f2', padding: '20px 24px', borderBottom: '1px solid #fecaca' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#991b1b', margin: '0 0 8px' }}>What went wrong</h2>
            {bundle?.rootCauseHypothesis ? (
              <p style={{ margin: 0, fontSize: 15, color: '#1f2937', lineHeight: 1.65 }}>
                {bundle.rootCauseHypothesis}
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: 15, color: '#6b7280', lineHeight: 1.65 }}>
                The test failed but no AI diagnosis is available for this run. Check the technical details below.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recording — available for all completed runs */}
      {!isLive && run.status !== 'error' && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 20px', marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Artifacts:</span>
          <a
            href={`${apiBase}/v1/artifacts/${runId}/video/video_0.webm`}
            target="_blank" rel="noreferrer"
            style={{ fontSize: 14, color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}
          >
            Watch recording →
          </a>
          {run.snapshotId && (
            <a
              href={`${apiBase}/v1/artifacts/${runId}/steps/0/screenshot`}
              target="_blank" rel="noreferrer"
              style={{ fontSize: 14, color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}
            >
              View screenshot →
            </a>
          )}
        </div>
      )}

      {/* Infra error — different message */}
      {isInfraError && (
        <div style={{ border: '1px solid #fde68a', borderRadius: 12, padding: '20px 24px', background: '#fffbeb', marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#92400e', margin: '0 0 8px' }}>Runner error</h2>
          <p style={{ margin: 0, fontSize: 15, color: '#1f2937', lineHeight: 1.65 }}>
            The test runner encountered an error before completing. This is not a test failure — try re-running.
          </p>
        </div>
      )}

      {/* Re-run — only show once test is finished */}
      {!isLive && (
        <div style={{ marginBottom: 32 }}>
          <a
            href={`/projects/${projectId}/tests/${run.testId}/new-run?targetUrl=${encodeURIComponent(run.targetUrl)}`}
            style={{ display: 'inline-block', background: '#2563eb', color: '#fff', padding: '9px 20px', borderRadius: 7, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}
          >
            Re-run this test
          </a>
        </div>
      )}

      {/* Technical details — auto-open when live so stdout appears immediately on completion */}
      <details open={isLive || undefined} style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        <summary style={{ padding: '14px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#374151', background: '#f9fafb', listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Technical details
          <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400 }}>stdout · stderr · run ID</span>
        </summary>
        <div style={{ padding: '20px', background: '#fff' }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16, fontFamily: 'monospace' }}>Run ID: {runId}</div>
          {run.stdout && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>stdout</div>
              <pre style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: 12, fontSize: 12, overflow: 'auto', margin: 0 }}>{run.stdout}</pre>
            </div>
          )}
          {run.stderr && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>stderr</div>
              <pre style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: 12, fontSize: 12, overflow: 'auto', margin: 0, color: '#991b1b' }}>{run.stderr}</pre>
            </div>
          )}
          {!run.stdout && !run.stderr && (
            <p style={{ margin: 0, fontSize: 14, color: '#9ca3af' }}>No output captured for this run.</p>
          )}
        </div>
      </details>

    </div>
  );
}
