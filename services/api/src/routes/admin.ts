import type { FastifyPluginAsync } from 'fastify';
import { db } from '../db/client.js';
import { apiKeys, projects, tests, testDeletions, runs } from '../db/schema.js';
import { eq, and, gte, desc, count, countDistinct } from 'drizzle-orm';

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

  // GET /v1/admin/stats — platform-wide activity overview
  app.get('/v1/admin/stats', async (_request, reply) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      [accountsTotal],
      [accountsRecent],
      [projectsTotal],
      [projectsRecent],
      [testsTotal],
      [testsRecent],
      [runsTotal],
      [runsRecent],
      runsByStatus,
      recentRuns,
      recentSignups,
    ] = await Promise.all([
      db.select({ count: countDistinct(apiKeys.accountId) }).from(apiKeys),
      db.select({ count: countDistinct(apiKeys.accountId) }).from(apiKeys).where(gte(apiKeys.createdAt, sevenDaysAgo)),
      db.select({ count: count() }).from(projects),
      db.select({ count: count() }).from(projects).where(gte(projects.createdAt, sevenDaysAgo)),
      db.select({ count: count() }).from(tests),
      db.select({ count: count() }).from(tests).where(gte(tests.createdAt, sevenDaysAgo)),
      db.select({ count: count() }).from(runs),
      db.select({ count: count() }).from(runs).where(gte(runs.createdAt, sevenDaysAgo)),
      db.select({ status: runs.status, count: count() }).from(runs).groupBy(runs.status),
      db.select({
        id: runs.id,
        accountId: runs.accountId,
        testId: runs.testId,
        targetUrl: runs.targetUrl,
        status: runs.status,
        durationMs: runs.durationMs,
        createdAt: runs.createdAt,
      }).from(runs).orderBy(desc(runs.createdAt)).limit(20),
      db.select({
        accountId: apiKeys.accountId,
        email: apiKeys.email,
        createdAt: apiKeys.createdAt,
      }).from(apiKeys).orderBy(desc(apiKeys.createdAt)).limit(10),
    ]);

    const statusMap = Object.fromEntries(runsByStatus.map((r) => [r.status, r.count]));

    return reply.send({
      accounts: { total: accountsTotal?.count ?? 0, last7d: accountsRecent?.count ?? 0 },
      projects: { total: projectsTotal?.count ?? 0, last7d: projectsRecent?.count ?? 0 },
      tests: { total: testsTotal?.count ?? 0, last7d: testsRecent?.count ?? 0 },
      runs: {
        total: runsTotal?.count ?? 0,
        last7d: runsRecent?.count ?? 0,
        passed: statusMap['passed'] ?? 0,
        failed: statusMap['failed'] ?? 0,
        running: statusMap['running'] ?? 0,
        queued: statusMap['queued'] ?? 0,
      },
      recentRuns,
      recentSignups,
    });
  });
};
