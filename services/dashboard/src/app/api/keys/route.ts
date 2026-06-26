import { NextResponse, type NextRequest } from 'next/server';
import { getSessionApiKey, BASE_URL } from '@/lib/session';

export async function POST(_request: NextRequest) {
  const apiKey = getSessionApiKey();
  if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${BASE_URL}/v1/auth/me/keys`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const data = await res.json() as unknown;
  return NextResponse.json(data, { status: res.status });
}
