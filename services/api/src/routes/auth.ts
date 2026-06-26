import { createHash } from 'node:crypto';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import type { FastifyPluginAsync } from 'fastify';
import { db } from '../db/client.js';
import { apiKeys } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const CreateKeyBody = z.object({
  accountId: z.string().min(1),
  email: z.string().email(),
});

const RegisterBody = z.object({
  email: z.string().email(),
});

export const authRoute: FastifyPluginAsync = async (app) => {
  app.post('/v1/auth/keys', async (request, reply) => {
    const secret = process.env.INTERNAL_SERVICE_SECRET;
    if (!secret || request.headers['x-internal-secret'] !== secret) {
      return reply.code(403).send({
        error: { code: 'FORBIDDEN', message: 'Invalid or missing internal secret' },
      });
    }

    const parsed = CreateKeyBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid request body' },
      });
    }

    const { accountId, email } = parsed.data;
    const rawKey = `gk_${nanoid(32)}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');

    const [inserted] = await db
      .insert(apiKeys)
      .values({ accountId, email, keyHash })
      .returning();

    if (!inserted) {
      return reply.code(500).send({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create API key' },
      });
    }

    return reply.code(201).send({
      id: inserted.id,
      accountId: inserted.accountId,
      email: inserted.email,
      createdAt: inserted.createdAt,
      key: rawKey,
    });
  });

  app.post('/v1/auth/register', async (request, reply) => {
    const parsed = RegisterBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid request body' },
      });
    }

    const { email } = parsed.data;

    const [existing] = await db
      .select({ accountId: apiKeys.accountId })
      .from(apiKeys)
      .where(eq(apiKeys.email, email))
      .limit(1);

    if (existing) {
      return reply.code(409).send({
        error: {
          code: 'EMAIL_TAKEN',
          message: 'An account already exists for this email. Sign in with your existing API key, or generate a new one from your API Keys settings.',
        },
      });
    }

    const accountId = `acc_${nanoid(16)}`;
    const rawKey = `gk_${nanoid(32)}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');

    const [inserted] = await db
      .insert(apiKeys)
      .values({ accountId, email, keyHash })
      .returning();

    if (!inserted) {
      return reply.code(500).send({
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create account' },
      });
    }

    return reply.code(201).send({
      accountId: inserted.accountId,
      email: inserted.email,
      key: rawKey,
    });
  });

  app.get('/v1/auth/me', async (request, reply) => {
    return reply.send({
      accountId: request.account.accountId,
      email: request.account.email,
      createdAt: request.account.createdAt,
    });
  });

  app.post('/v1/auth/me/keys', async (request, reply) => {
    const rawKey = `gk_${nanoid(32)}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');

    const [inserted] = await db
      .insert(apiKeys)
      .values({ accountId: request.account.accountId, email: request.account.email, keyHash })
      .returning();

    if (!inserted) {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create API key' } });
    }

    return reply.code(201).send({
      id: inserted.id,
      accountId: inserted.accountId,
      email: inserted.email,
      createdAt: inserted.createdAt,
      key: rawKey,
    });
  });
};
