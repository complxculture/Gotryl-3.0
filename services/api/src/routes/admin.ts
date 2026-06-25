import type { FastifyPluginAsync } from 'fastify';
import { db } from '../db/client.js';
import { tests, testDeletions } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export const adminRoute: FastifyPluginAsync = async (app) => {
  // All /v1/admin/* routes require x-internal-secret header (no bearer token needed)
  app.addHook('onRequest', async (request, reply) => {
    if (!request.url.startsWith('/v1/admin/')) return;
    const secret = (request.headers as Record<string, string | undefined>)['x-internal-secret'];
    if (!secret || secret !== process.env.INTERNAL_SERVICE_SECRET) {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Admin access requires x-internal-secret header' } });
    }
  });

  // DELETE /v1/admin/tests/:id — admin-only deletion with audit log
  app.delete('/v1/admin/tests/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const reason = ((request.body as Record<string, unknown> | null)?.['reason'] as string | undefined) ?? null;
    const accountId = ((request.body as Record<string, unknown> | null)?.['accountId'] as string | undefined) ?? 'admin';

    const [deleted] = await db
      .delete(tests)
      .where(eq(tests.id, id))
      .returning({ id: tests.id, accountId: tests.accountId });

    if (!deleted) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Test not found' } });
    }

    await db.insert(testDeletions).values({
      accountId: deleted.accountId ?? accountId,
      testId: deleted.id,
      reason,
    });

    request.log.info({ event: 'admin.test.deleted', testId: id, accountId: deleted.accountId, reason });
    return reply.code(204).send();
  });
};
