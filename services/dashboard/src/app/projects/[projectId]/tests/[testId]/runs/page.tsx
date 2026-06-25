import { redirect } from 'next/navigation';
import { getClient } from '@/lib/session';

export default async function RunHistoryPage({ params }: { params: { projectId: string; testId: string } }) {
  const { projectId, testId } = params;

  let client;
  try {
    client = getClient();
  } catch {
    redirect('/login');
  }

  const [test, runs] = await Promise.all([
    client.tests.get(testId),
    client.runs.list(testId),
  ]);

  const sorted = runs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function statusColor(s: string) {
    return s === 'passed' ? '#38a169' : s === 'failed' ? '#e53e3e' : s === 'error' ? '#dd6b20' : '#718096';
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <a href={`/projects/${projectId}/tests`} style={{ color: '#718096', fontSize: 14 }}>← Tests</a>
        <h1 style={{ fontSize: 20, margin: '8px 0' }}>Run history</h1>
        <div style={{ fontSize: 14, color: '#4a5568' }}>{test.description}</div>
        <div style={{ fontSize: 12, color: '#718096' }}>{testId}</div>
      </div>

      {sorted.length === 0 ? (
        <p style={{ color: '#718096' }}>No runs yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px' }}>Run ID</th>
              <th style={{ padding: '8px 12px' }}>Status</th>
              <th style={{ padding: '8px 12px' }}>Duration</th>
              <th style={{ padding: '8px 12px' }}>Target URL</th>
              <th style={{ padding: '8px 12px' }}>Completed</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((run) => (
              <tr key={run.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 12px' }}>
                  <a href={`/projects/${projectId}/runs/${run.id}`} style={{ color: '#2b6cb0', fontSize: 13 }}>{run.id}</a>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ color: statusColor(run.status), fontWeight: 600, fontSize: 13 }}>{run.status}</span>
                </td>
                <td style={{ padding: '10px 12px', fontSize: 13 }}>{run.durationMs != null ? `${(run.durationMs / 1000).toFixed(1)}s` : '–'}</td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: '#4a5568', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{run.targetUrl}</td>
                <td style={{ padding: '10px 12px', fontSize: 13 }}>{run.completedAt ? new Date(run.completedAt).toLocaleString() : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
