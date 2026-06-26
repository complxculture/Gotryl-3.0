import { NextResponse, type NextRequest } from 'next/server';
import { GotrylClient } from '@gotryl/sdk';
import { SESSION_COOKIE, BASE_URL } from '@/lib/session';

export async function POST(request: NextRequest) {
  const body = await request.json() as { apiKey?: string };
  const apiKey = body.apiKey?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 });
  }

  // Validate key against the API
  try {
    const client = new GotrylClient({ apiKey, baseUrl: BASE_URL, timeoutMs: 10_000 });
    await client.auth.getMe();
  } catch {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, apiKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  return response;
}

export async function DELETE(_request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
