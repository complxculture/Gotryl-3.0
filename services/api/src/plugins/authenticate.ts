import { createHash } from 'node:crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { apiKeys } from '../db/schema.js';

declare module 'fastify' {
  interface FastifyRequest {
    account: { id: string; accountId: string; email: string; createdAt: Date };
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (request.url === '/v1/health') return;
  if (request.method === 'POST' && request.url === '/v1/auth/keys') return;

  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    request.log.warn({ url: request.url }, 'auth failed: missing or malformed header');
    return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API key' } });
  }

  const rawKey = authHeader.slice(7);
  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash)).limit(1);

  if (!apiKey) {
    request.log.warn({ url: request.url }, 'auth failed: key not found');
    return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API key' } });
  }

  request.account = {
    id: apiKey.id,
    accountId: apiKey.accountId,
    email: apiKey.email,
    createdAt: apiKey.createdAt,
  };
}
