import { redirect } from 'next/navigation';
import { getClient } from '@/lib/session';
import { createProjectAction } from '../actions';

function timeAgo(iso: string | null) {
  if (!iso) return null;
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default async function ProjectsPage() {
  let client;
  try { client = getClient(); } catch { redirect('/login'); }

  const projects = await client.projects.list();

  const coverageResults = await Promise.all(
    projects.map(async (p) => {
      try { return { id: p.id, cov: await client.projects.getCoverage(p.id) }; }
      catch { return { id: p.id, cov: null }; }
    }),
  );
  const covMap = new Map(coverageResults.map((r) => [r.id, r.cov]));

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Projects</h1>
        <form action={createProjectAction} style={{ display: 'flex', gap: 8 }}>
          <input
            name="name"
            placeholder="Project name"
            required
            style={{ padding: '7px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 14, width: 200 }}
          />
          <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
            New project
          </button>
        </form>
      </div>

      {/* Empty state */}
      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', border: '2px dashed #e5e7eb', borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>□</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>No projects yet</h2>
          <p style={{ color: '#6b7280', fontSize: 15, margin: '0 0 20px' }}>
            Create your first project to start running tests.
          </p>
          <p style={{ color: '#9ca3af', fontSize: 13, fontFamily: 'monospace' }}>
            or via CLI: gotryl project create --name &quot;My App&quot;
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {projects.map((p) => {
            const cov = covMap.get(p.id);
            const passing = cov ? Math.round((cov.passRate ?? 0) * (cov.testCount ?? 0)) : 0;
            const failing = cov ? (cov.testCount ?? 0) - passing : 0;
            const hasRuns = cov?.lastRunAt != null;
            const hasTests = (cov?.testCount ?? 0) > 0;
            const allPassing = hasRuns && failing === 0;
            const anyFailing = hasRuns && failing > 0;

            const dotColor = anyFailing ? '#dc2626' : allPassing ? '#16a34a' : '#9ca3af';

            let statusLine: string;
            if (!hasTests) statusLine = 'No tests yet';
            else if (!hasRuns) statusLine = `${cov?.testCount} test${cov?.testCount === 1 ? '' : 's'} · No runs yet`;
            else if (anyFailing) statusLine = `${passing} passing · ${failing} failing · last run ${timeAgo(cov?.lastRunAt ?? null)}`;
            else statusLine = `${passing} passing · last run ${timeAgo(cov?.lastRunAt ?? null)}`;

            const cta = !hasTests
              ? { label: 'Create first test →', href: `/projects/${p.id}/tests` }
              : { label: 'View tests →', href: `/projects/${p.id}/tests` };

            return (
              <div
                key={p.id}
                style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                  <span
                    style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, flexShrink: 0 }}
                    title={p.id}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{statusLine}</div>
                  </div>
                </div>
                <a
                  href={cta.href}
                  style={{ flexShrink: 0, fontSize: 14, color: '#2563eb', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  {cta.label}
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
