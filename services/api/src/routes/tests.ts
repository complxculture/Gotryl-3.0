import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import { db } from '../db/client.js';
import { projects, runs, tests } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { fetchFailureBundle } from '../lib/r2.js';

const DescriptionField = z.string().trim().min(1).max(2000);
const CreateTestBody = z.object({
  projectId: z.string().min(1),
  description: DescriptionField,
});
const CreateBatchBody = z.object({
  projectId: z.string().min(1),
  tests: z.array(z.object({ description: DescriptionField })).min(1).max(100),
});
const UpdateTestBody = z.object({ description: DescriptionField });

export const testsRoute: FastifyPluginAsync = async (app) => {
  app.post('/v1/tests', async (request, reply) => {
    const parsed = CreateTestBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid request body' },
      });
    }
    const { projectId, description } = parsed.data;
    try {
      const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.accountId, request.account.accountId)))
        .limit(1);
      if (!project) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
      }
      const [inserted] = await db
        .insert(tests)
        .values({ projectId, accountId: request.account.accountId, description })
        .returning();
      return reply.code(201).send(inserted);
    } catch {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  });

  app.post('/v1/tests/batch', async (request, reply) => {
    const parsed = CreateBatchBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid request body' },
      });
    }
    const { projectId, tests: testItems } = parsed.data;
    try {
      const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.accountId, request.account.accountId)))
        .limit(1);
      if (!project) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
      }
      const rows = await db
        .insert(tests)
        .values(testItems.map(t => ({ projectId, accountId: request.account.accountId, description: t.description })))
        .returning();
      return reply.code(201).send(rows);
    } catch {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  });

  app.get('/v1/tests', async (request, reply) => {
    const rawProjectId = (request.query as Record<string, unknown>)['projectId'];
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
    if (!projectId || typeof projectId !== 'string') {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'projectId query parameter is required' } });
    }
    try {
      const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.accountId, request.account.accountId)))
        .limit(1);
      if (!project) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
      }
      const rows = await db
        .select()
        .from(tests)
        .where(and(eq(tests.projectId, projectId), eq(tests.accountId, request.account.accountId)));
      return reply.send(rows);
    } catch {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  });

  app.get('/v1/tests/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const [test] = await db
        .select()
        .from(tests)
        .where(and(eq(tests.id, id), eq(tests.accountId, request.account.accountId)))
        .limit(1);
      if (!test) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Test not found' } });
      }
      return reply.send(test);
    } catch {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  });

  app.patch('/v1/tests/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = UpdateTestBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid request body' },
      });
    }
    const { description } = parsed.data;
    try {
      const [updated] = await db
        .update(tests)
        .set({ description, updatedAt: new Date() })
        .where(and(eq(tests.id, id), eq(tests.accountId, request.account.accountId)))
        .returning();
      if (!updated) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Test not found' } });
      }
      return reply.send(updated);
    } catch {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  });

  app.delete('/v1/tests/:id', async (_request, reply) => {
    return reply.code(403).send({ error: { code: 'ADMIN_ONLY', message: 'Test deletion requires admin credentials. Use DELETE /v1/admin/tests/:id with x-internal-secret header.' } });
  });

  // Bulk delete is not supported — tests are permanent
  app.delete('/v1/projects/:projectId/tests', async (_request, reply) => {
    return reply.code(405).send({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Bulk test deletion is not supported. Tests are permanent.' } });
  });

  // GET /v1/tests/:id/code — return generated source with ETag
  app.get('/v1/tests/:id/code', async (request, reply) => {
    const { id } = request.params as { id: string };
    const [test] = await db
      .select({ id: tests.id, generatedCode: tests.generatedCode })
      .from(tests)
      .where(and(eq(tests.id, id), eq(tests.accountId, request.account.accountId)))
      .limit(1);
    if (!test) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Test not found' } });
    }
    if (!test.generatedCode) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'No generated code for this test' } });
    }
    const etag = `"${createHash('sha256').update(test.generatedCode).digest('hex')}"`;
    reply.header('ETag', etag);
    return reply.send({ code: test.generatedCode, etag });
  });

  // PUT /v1/tests/:id/code — replace source with optimistic concurrency via If-Match
  app.put('/v1/tests/:id/code', async (request, reply) => {
    const { id } = request.params as { id: string };
    const ifMatch = (request.headers as Record<string, string | undefined>)['if-match'];
    if (!ifMatch) {
      return reply.code(428).send({ error: { code: 'PRECONDITION_REQUIRED', message: 'If-Match header is required' } });
    }
    const body = z.object({ code: z.string().min(1) }).safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'code is required' } });
    }

    const [test] = await db
      .select({ id: tests.id, generatedCode: tests.generatedCode })
      .from(tests)
      .where(and(eq(tests.id, id), eq(tests.accountId, request.account.accountId)))
      .limit(1);
    if (!test) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Test not found' } });
    }

    const currentEtag = test.generatedCode
      ? `"${createHash('sha256').update(test.generatedCode).digest('hex')}"`
      : '"empty"';

    if (ifMatch !== currentEtag) {
      return reply.code(412).send({ error: { code: 'PRECONDITION_FAILED', message: 'Test code has changed. Fetch the latest and retry.' } });
    }

    const [updated] = await db
      .update(tests)
      .set({ generatedCode: body.data.code, updatedAt: new Date() })
      .where(and(eq(tests.id, id), eq(tests.accountId, request.account.accountId)))
      .returning({ id: tests.id, generatedCode: tests.generatedCode });

    const newEtag = `"${createHash('sha256').update(body.data.code).digest('hex')}"`;
    reply.header('ETag', newEtag);
    return reply.send({ code: updated!.generatedCode, etag: newEtag });
  });

  // GET /v1/tests/:id/steps — step artifacts from latest run's failure bundle
  app.get('/v1/tests/:id/steps', async (request, reply) => {
    const { id } = request.params as { id: string };
    const accountId = request.account.accountId;

    const [test] = await db
      .select({ id: tests.id })
      .from(tests)
      .where(and(eq(tests.id, id), eq(tests.accountId, accountId)))
      .limit(1);
    if (!test) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Test not found' } });
    }

    const [run] = await db
      .select({ id: runs.id, snapshotId: runs.snapshotId })
      .from(runs)
      .where(and(eq(runs.testId, id), eq(runs.accountId, accountId)))
      .orderBy(desc(runs.createdAt))
      .limit(1);

    if (!run?.snapshotId) {
      return reply.send([]);
    }

    const bundle = await fetchFailureBundle(run.id);
    const screenshotUrls = (bundle?.['screenshotUrls'] as string[] | undefined) ?? [];

    const steps = screenshotUrls.map((key) => {
      const match = /steps\/(\d+)\/screenshot\.png$/.exec(key);
      const step = match ? parseInt(match[1]!, 10) : 0;
      const domKey = key.replace('screenshot.png', 'dom.html');
      return { step, screenshotUrl: key, domSnapshotUrl: domKey };
    });

    return reply.send(steps);
  });
};
