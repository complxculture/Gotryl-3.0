import { cookies } from 'next/headers';
import { GotrylClient } from '@gotryl/sdk';

const SESSION_COOKIE = 'gotryl_session';
const BASE_URL = process.env.GOTRYL_API_URL ?? 'https://api.gotryl.com';

export function getSessionApiKey(): string | null {
  const cookieStore = cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export function getClient(): GotrylClient {
  const apiKey = getSessionApiKey();
  if (!apiKey) throw new Error('No session');
  return new GotrylClient({ apiKey, baseUrl: BASE_URL, timeoutMs: 30_000 });
}

export { SESSION_COOKIE, BASE_URL };
