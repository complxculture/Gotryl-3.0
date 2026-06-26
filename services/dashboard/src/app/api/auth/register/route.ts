import { NextResponse, type NextRequest } from 'next/server';
import { BASE_URL } from '@/lib/session';

export async function POST(request: NextRequest) {
  const body = await request.json() as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const res = await fetch(`${BASE_URL}/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await res.json() as unknown;
  return NextResponse.json(data, { status: res.status });
}
