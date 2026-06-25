import { redirect } from 'next/navigation';
import { getClient } from '@/lib/session';
import type { FailureBundle } from '@gotryl/sdk';

function statusColor(s: string) {
  return s === 'passed' ? '#38a169' : s === 'failed' ? '#e53e3e' : s === 'error' ? '#dd6b20' : '#718096';
}

export default async function RunDetailPage({ params }: { params: { projectId: string; runId: string } }) {
  const { projectId, runId } = params;

  let client;
  try {
    client = getClient();
  } catch {
    redirect('/login');
  }

  const run = await client.runs.get(runId);

  let bundle: FailureBundle | null = null;
  let steps: Array<{ step: number; screenshotUrl: string; domSnapshotUrl: string }> = [];

  if (run.status === 'failed' && run.snapshotId) {
    try {
      bundle = await client.failures.getArtifacts(runId);
    } catch { /* no bundle */ }
    try {
      steps = await client.tests.getSteps(run.testId);
    } catch { /* no steps */ }
  }

  const apiBase = process.env.GOTRYL_API_URL ?? 'https://api.gotryl.com';
  const videoApiBase = `${apiBase}/v1/artifacts/${runId}/video`;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <a href={`/projects/${projectId}/tests/${run.testId}/runs`} style={{ color: '#718096', fontSize: 14 }}>← Run history</a>
        <h1 style={{ fontSize: 20, margin: '8px 0' }}>
          Run <span style={{ fontFamily: 'monospace', fontSize: 16 }}>{runId}</span>
        </h1>
      </div>

      {/* Run summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          ['Status', <span key="s" style={{ color: statusColor(run.status), fontWeight: 700, fontSize: 18 }}>{run.status}</span>],
          ['Duration', run.durationMs != null ? `${(run.durationMs / 1000).toFixed(1)}s` : '–'],
          ['Target URL', <a key="u" href={run.targetUrl} style={{ color: '#2b6cb0', wordBreak: 'break-all', fontSize: 13 }}>{run.targetUrl}</a>],
          ['Completed', run.completedAt ? new Date(run.completedAt).toLocaleString() : '–'],
        ].map(([label, value]) => (
          <div key={String(label)} style={{ background: '#f7fafc', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, color: '#718096', marginBottom: 4 }}>{label}</div>
            <div style={{ fontWeight: 500 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Video player */}
      {run.status === 'passed' || run.status === 'failed' ? (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Recording</h2>
          <video
            controls
            style={{ width: '100%', maxWidth: 800, borderRadius: 8, background: '#000' }}
            src={`${videoApiBase}/video_0.webm`}
          >
            Your browser does not support video playback.
          </video>
        </div>
      ) : null}

      {/* Step list */}
      {steps.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Steps</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {steps.map((s, i) => {
              const isFailing = bundle?.failingStep?.lineNo != null && i === steps.length - 1;
              return (
                <div key={s.step} style={{ border: `1px solid ${isFailing ? '#e53e3e' : '#e2e8f0'}`, borderRadius: 8, padding: 12, background: isFailing ? '#fff5f5' : '#fff' }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: isFailing ? '#e53e3e' : '#1a202c' }}>Step {s.step}{isFailing ? ' — FAILING' : ''}</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <a href={s.screenshotUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#2b6cb0' }}>Screenshot</a>
                    <a href={s.domSnapshotUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#2b6cb0' }}>DOM snapshot</a>
                  </div>
                  {isFailing && bundle?.rootCauseHypothesis && (
                    <div style={{ marginTop: 12, padding: 12, background: '#fed7d7', borderRadius: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Root cause hypothesis</div>
                      <div style={{ fontSize: 14, lineHeight: 1.5 }}>{bundle.rootCauseHypothesis}</div>
                      {bundle.fixTarget && (
                        <div style={{ marginTop: 8, fontSize: 13, color: '#c53030' }}>
                          Fix target: {bundle.fixTarget.file} lines {bundle.fixTarget.lineRange[0]}–{bundle.fixTarget.lineRange[1]}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stdout / stderr */}
      {(run.stdout || run.stderr) && (
        <div>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Output</h2>
          {run.stdout && (
            <pre style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 12, fontSize: 12, overflow: 'auto', marginBottom: 12 }}>
              {run.stdout}
            </pre>
          )}
          {run.stderr && (
            <pre style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 6, padding: 12, fontSize: 12, overflow: 'auto', color: '#c53030' }}>
              {run.stderr}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
