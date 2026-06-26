import { redirect } from 'next/navigation';
import { getClient } from '@/lib/session';
import { createRunAction } from '../../../../../actions';

export default async function NewRunPage({
  params,
  searchParams,
}: {
  params: { projectId: string; testId: string };
  searchParams: { targetUrl?: string };
}) {
  const { projectId, testId } = params;

  let client;
  try {
    client = getClient();
  } catch {
    redirect('/login');
  }

  const test = await client.tests.get(testId);
  const prefillUrl = searchParams.targetUrl ?? '';

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 20 }}>
        <a href={`/projects/${projectId}/tests`} style={{ color: '#718096', fontSize: 14 }}>← Tests</a>
        <h1 style={{ fontSize: 20, margin: '8px 0' }}>Run test</h1>
        <div style={{ fontSize: 14, color: '#4a5568', marginBottom: 4 }}>{test.description}</div>
        <div style={{ fontSize: 12, color: '#718096' }}>{testId}</div>
      </div>

      <form action={createRunAction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input type="hidden" name="testId" value={testId} />
        <input type="hidden" name="projectId" value={projectId} />

        <div>
          <label style={{ display: 'block', fontWeight: 500, fontSize: 14, marginBottom: 6 }}>
            Target URL
          </label>
          <input
            name="targetUrl"
            type="url"
            defaultValue={prefillUrl}
            placeholder="https://myapp.com"
            required
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
          />
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>Must be an HTTPS URL reachable from the internet</div>
        </div>

        <button
          type="submit"
          style={{ background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 15, cursor: 'pointer', fontWeight: 500, alignSelf: 'flex-start' }}
        >
          Start run
        </button>
      </form>
    </div>
  );
}
