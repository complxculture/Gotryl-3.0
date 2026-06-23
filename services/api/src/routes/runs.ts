import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import { db } from '../db/client.js';
import { runs, tests } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { runQueue } from '../queue/client.js';

const CreateRunBody = z.object({
  testId: z.string().min(1),
  targetUrl: z.string().url(),
  runId: z.string().optional(),
});

export const runsRoute: FastifyPluginAsync = async (app) => {
  app.post('/v1/runs', async (request, reply) => {
    const parsed = CreateRunBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid request body' },
      });
    }
    const { testId, targetUrl, runId: clientRunId } = parsed.data;

    try {
      const [test] = await db
        .select()
        .from(tests)
        .where(and(eq(tests.id, testId), eq(tests.accountId, request.account.accountId)))
        .limit(1);
      if (!test) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Test not found' } });
      }

      if (clientRunId) {
        const [existing] = await db
          .select()
          .from(runs)
          .where(and(eq(runs.id, clientRunId), eq(runs.accountId, request.account.accountId)))
          .limit(1);
        if (existing) return reply.send(existing);
      }

      const [run] = await db
        .insert(runs)
        .values({ testId, accountId: request.account.accountId, targetUrl })
        .returning();

      await runQueue.add('execute', { runId: run.id, testCode: test.generatedCode, targetUrl }, { jobId: run.id });

      return reply.code(201).send(run);
    } catch {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  });

  app.get('/v1/runs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const [run] = await db
        .select()
        .from(runs)
        .where(and(eq(runs.id, id), eq(runs.accountId, request.account.accountId)))
        .limit(1);
      if (!run) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Run not found' } });
      }
      return reply.send(run);
    } catch {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  });
};
