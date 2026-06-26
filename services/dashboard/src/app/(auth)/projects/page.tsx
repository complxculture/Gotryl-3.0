import { redirect } from 'next/navigation';
import { getClient } from '@/lib/session';

export default async function ProjectsPage() {
  let client;
  try {
    client = getClient();
  } catch {
    redirect('/login');
  }

  const [projects, coverageResults] = await Promise.all([
    client.projects.list(),
    (async () => {
      const list = await client.projects.list();
      return Promise.all(
        list.map(async (p) => {
          try {
            return { id: p.id, coverage: await client.projects.getCoverage(p.id) };
          } catch {
            return { id: p.id, coverage: null };
          }
        }),
      );
    })(),
  ]);

  const coverageMap = new Map(coverageResults.map((r) => [r.id, r.coverage]));

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Projects</h1>
      {projects.length === 0 ? (
        <p style={{ color: '#718096' }}>No projects yet. Create one via the CLI: <code>gotryl project create --name &quot;My App&quot;</code></p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px' }}>Name</th>
              <th style={{ padding: '8px 12px' }}>Tests</th>
              <th style={{ padding: '8px 12px' }}>Last Run</th>
              <th style={{ padding: '8px 12px' }}>Pass Rate</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => {
              const cov = coverageMap.get(p.id);
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <a href={`/projects/${p.id}/tests`} style={{ color: '#2b6cb0', fontWeight: 500 }}>{p.name}</a>
                    <div style={{ fontSize: 12, color: '#718096' }}>{p.id}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{cov?.testCount ?? '–'}</td>
                  <td style={{ padding: '10px 12px' }}>{cov?.lastRunAt ? new Date(cov.lastRunAt).toLocaleDateString() : '–'}</td>
                  <td style={{ padding: '10px 12px' }}>{cov?.passRate != null ? `${(cov.passRate * 100).toFixed(0)}%` : '–'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
