import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, BASE_URL } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } },
) {
  const apiKey = request.cookies.get(SESSION_COOKIE)?.value;
  if (!apiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resp = await fetch(`${BASE_URL}/v1/artifacts/${params.runId}/video/url`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!resp.ok) {
    return NextResponse.json({ error: 'Video not available' }, { status: resp.status });
  }

  const { url } = await resp.json() as { url: string };
  return NextResponse.redirect(url);
}
