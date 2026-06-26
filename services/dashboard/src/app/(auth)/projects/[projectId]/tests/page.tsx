import { redirect } from 'next/navigation';
import { getClient } from '@/lib/session';
import { createTestAction } from '../../../actions';

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  passed: { color: '#15803d', bg: '#dcfce7' },
  failed: { color: '#dc2626', bg: '#fee2e2' },
  error:  { color: '#d97706', bg: '#fef3c7' },
};

function statusBadge(status: string) {
  const s = STATUS_COLORS[status] ?? { color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 5, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
      {status}
    </span>
  );
}

export default async function TestsPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params;

  let client;
  try { client = getClient(); } catch { redirect('/login'); }

  const [project, tests] = await Promise.all([
    client.projects.get(projectId),
    client.tests.list(projectId),
  ]);

  const runsPerTest = await Promise.all(
    tests.map(async (t) => {
      try {
        const runs = await client.runs.list(t.id);
        const latest = runs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        return { testId: t.id, latest };
      } catch {
        return { testId: t.id, latest: undefined };
      }
    }),
  );
  const latestRunMap = new Map(runsPerTest.map((r) => [r.testId, r.latest]));

  return (
    <div>
      {/* Header — stacks on mobile */}
      <div className="tests-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16 }}>
        <div>
          <a href="/projects" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>← Projects</a>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: '6px 0 2px', letterSpacing: '-0.3px' }}>{project.name}</h1>
          <div style={{ fontSize: 12, color: '#9ca3af' }} title={project.id}>{project.id}</div>
        </div>
        <form className="tests-form" action={createTestAction} style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <input type="hidden" name="projectId" value={projectId} />
          <input
            name="description"
            placeholder="Describe a test…"
            required
            style={{ padding: '7px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 14, width: 260 }}
          />
          <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 14, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
            New test
          </button>
        </form>
      </div>

      {/* Empty state */}
      {tests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', border: '2px dashed #e5e7eb', borderRadius: 12 }}>
          <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>No tests yet — describe one above to get started.</p>
        </div>
      ) : (
        /* Card list — works on all screen sizes */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tests.map((t) => {
            const latestRun = latestRunMap.get(t.id);
            const runUrl = `/projects/${projectId}/tests/${t.id}/new-run${latestRun?.targetUrl ? `?targetUrl=${encodeURIComponent(latestRun.targetUrl)}` : ''}`;
            return (
              <div key={t.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 4 }}>{t.description}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{t.id}</div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {latestRun ? statusBadge(latestRun.status) : (
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>No runs yet</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <a
                    href={runUrl}
                    style={{ background: '#2563eb', color: '#fff', padding: '5px 14px', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
                  >
                    Run
                  </a>
                  <a href={`/projects/${projectId}/tests/${t.id}/runs`} style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>History</a>
                  {t.generatedCode && (
                    <a href={`/projects/${projectId}/tests/${t.id}/code`} style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>View code</a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
