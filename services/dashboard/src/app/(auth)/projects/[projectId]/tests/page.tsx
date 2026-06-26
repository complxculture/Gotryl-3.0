import { redirect } from 'next/navigation';
import { getClient } from '@/lib/session';

function statusBadge(status: string) {
  const colors: Record<string, string> = { passed: '#38a169', failed: '#e53e3e', error: '#dd6b20', pending: '#718096' };
  const bg = colors[status] ?? '#718096';
  return <span style={{ background: bg, color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{status}</span>;
}

export default async function TestsPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params;

  let client;
  try {
    client = getClient();
  } catch {
    redirect('/login');
  }

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
      <div style={{ marginBottom: 16 }}>
        <a href="/projects" style={{ color: '#718096', fontSize: 14 }}>← Projects</a>
        <h1 style={{ fontSize: 22, margin: '8px 0' }}>{project.name}</h1>
        <div style={{ fontSize: 13, color: '#718096' }}>{project.id}</div>
      </div>

      {tests.length === 0 ? (
        <p style={{ color: '#718096' }}>No tests yet. Create one via the CLI: <code>gotryl test create --project {projectId} --description &quot;...&quot;</code></p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px' }}>Description</th>
              <th style={{ padding: '8px 12px' }}>Last Result</th>
              <th style={{ padding: '8px 12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((t) => {
              const latestRun = latestRunMap.get(t.id);
              return (
                <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 500 }}>{t.description}</div>
                    <div style={{ fontSize: 12, color: '#718096' }}>{t.id}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {latestRun ? statusBadge(latestRun.status) : <span style={{ color: '#718096', fontSize: 13 }}>No runs</span>}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 14 }}>
                    <a href={`/projects/${projectId}/tests/${t.id}/runs`} style={{ color: '#2b6cb0', marginRight: 12 }}>Run history</a>
                    {t.generatedCode && (
                      <a href={`/projects/${projectId}/tests/${t.id}/code`} style={{ color: '#2b6cb0' }}>Source</a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
