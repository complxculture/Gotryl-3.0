import { redirect } from 'next/navigation';
import { getClient } from '@/lib/session';

export default async function TestCodePage({ params }: { params: { projectId: string; testId: string } }) {
  const { projectId, testId } = params;

  let client;
  try {
    client = getClient();
  } catch {
    redirect('/login');
  }

  const test = await client.tests.get(testId);
  let code = test.generatedCode;
  if (!code) {
    return (
      <div>
        <a href={`/projects/${projectId}/tests`} style={{ color: '#718096', fontSize: 14 }}>← Tests</a>
        <p style={{ marginTop: 24, color: '#718096' }}>No generated code yet for this test.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <a href={`/projects/${projectId}/tests`} style={{ color: '#718096', fontSize: 14 }}>← Tests</a>
        <h1 style={{ fontSize: 20, margin: '8px 0' }}>Generated source</h1>
        <div style={{ fontSize: 14, color: '#4a5568' }}>{test.description}</div>
      </div>
      <pre style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, overflow: 'auto', fontSize: 13, lineHeight: 1.6 }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
