import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, BASE_URL } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string; step: string } },
) {
  const apiKey = request.cookies.get(SESSION_COOKIE)?.value;
  if (!apiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!/^\d+$/.test(params.step)) {
    return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
  }

  const resp = await fetch(
    `${BASE_URL}/v1/artifacts/${params.runId}/steps/${params.step}/screenshot`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );

  if (!resp.ok) {
    return NextResponse.json({ error: 'Screenshot not available' }, { status: resp.status });
  }

  const buf = await resp.arrayBuffer();
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
