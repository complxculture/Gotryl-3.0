import type { FastifyPluginAsync } from 'fastify';
import { db } from '../db/client.js';
import { runs, tests } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { fetchFailureBundle, streamR2Object, getR2PresignedUrl, r2ObjectExists } from '../lib/r2.js';

export const failuresRoute: FastifyPluginAsync = async (app) => {
  // GET /v1/failures/:testId — full bundle for the latest failed run of a test
  app.get('/v1/failures/:testId', async (request, reply) => {
    const { testId } = request.params as { testId: string };
    const accountId = request.account.accountId;

    const [test] = await db
      .select({ id: tests.id })
      .from(tests)
      .where(and(eq(tests.id, testId), eq(tests.accountId, accountId)))
      .limit(1);
    if (!test) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Test not found' } });
    }

    const [run] = await db
      .select({ id: runs.id, snapshotId: runs.snapshotId })
      .from(runs)
      .where(and(eq(runs.testId, testId), eq(runs.status, 'failed'), eq(runs.accountId, accountId)))
      .orderBy(desc(runs.createdAt))
      .limit(1);

    if (!run?.snapshotId) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'No failure bundle found for this test' } });
    }

    const bundle = await fetchFailureBundle(run.id);
    if (!bundle) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Failure bundle not available' } });
    }

    return reply.send({ ...bundle, rootCauseHypothesis: bundle['rootCauseHypothesis'] ?? null, fixTarget: bundle['fixTarget'] ?? null });
  });

  // GET /v1/failures/:testId/summary — compact triage data only
  app.get('/v1/failures/:testId/summary', async (request, reply) => {
    const { testId } = request.params as { testId: string };
    const accountId = request.account.accountId;

    const [test] = await db
      .select({ id: tests.id })
      .from(tests)
      .where(and(eq(tests.id, testId), eq(tests.accountId, accountId)))
      .limit(1);
    if (!test) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Test not found' } });
    }

    const [run] = await db
      .select({ id: runs.id, snapshotId: runs.snapshotId })
      .from(runs)
      .where(and(eq(runs.testId, testId), eq(runs.status, 'failed'), eq(runs.accountId, accountId)))
      .orderBy(desc(runs.createdAt))
      .limit(1);

    if (!run?.snapshotId) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'No failure bundle found for this test' } });
    }

    const bundle = await fetchFailureBundle(run.id);
    if (!bundle) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Failure bundle not available' } });
    }

    return reply.send({
      rootCauseHypothesis: bundle['rootCauseHypothesis'] ?? null,
      fixTarget: bundle['fixTarget'] ?? null,
      failingStep: bundle['failingStep'] ?? null,
    });
  });

  // GET /v1/artifacts/:runId — full bundle by run ID
  app.get('/v1/artifacts/:runId', async (request, reply) => {
    const { runId } = request.params as { runId: string };
    const accountId = request.account.accountId;

    const [run] = await db
      .select({ id: runs.id, snapshotId: runs.snapshotId })
      .from(runs)
      .where(and(eq(runs.id, runId), eq(runs.accountId, accountId)))
      .limit(1);

    if (!run) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Run not found' } });
    }
    if (!run.snapshotId) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'No failure bundle for this run' } });
    }

    const bundle = await fetchFailureBundle(run.id);
    if (!bundle) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Failure bundle not available' } });
    }

    return reply.send(bundle);
  });

  // GET /v1/artifacts/:runId/steps/:step/screenshot — proxy step screenshot from R2
  app.get('/v1/artifacts/:runId/steps/:step/screenshot', async (request, reply) => {
    const { runId, step } = request.params as { runId: string; step: string };
    const accountId = request.account.accountId;

    if (!/^\d+$/.test(step)) {
      return reply.code(400).send({ error: { code: 'INVALID_STEP', message: 'Step must be a non-negative integer' } });
    }

    const [run] = await db
      .select({ id: runs.id })
      .from(runs)
      .where(and(eq(runs.id, runId), eq(runs.accountId, accountId)))
      .limit(1);

    if (!run) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Run not found' } });
    }

    const stream = await streamR2Object(`runs/${runId}/steps/${step}/screenshot.png`);
    if (!stream) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Screenshot not available' } });
    }

    reply.header('Content-Type', 'image/png');
    reply.header('Cache-Control', 'public, max-age=3600');
    return reply.send(stream.body);
  });

  // GET /v1/artifacts/:runId/steps/:step/dom — proxy step DOM snapshot from R2
  app.get('/v1/artifacts/:runId/steps/:step/dom', async (request, reply) => {
    const { runId, step } = request.params as { runId: string; step: string };
    const accountId = request.account.accountId;

    if (!/^\d+$/.test(step)) {
      return reply.code(400).send({ error: { code: 'INVALID_STEP', message: 'Step must be a non-negative integer' } });
    }

    const [run] = await db
      .select({ id: runs.id })
      .from(runs)
      .where(and(eq(runs.id, runId), eq(runs.accountId, accountId)))
      .limit(1);

    if (!run) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Run not found' } });
    }

    const stream = await streamR2Object(`runs/${runId}/steps/${step}/dom.html`);
    if (!stream) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'DOM snapshot not available' } });
    }

    reply.header('Content-Type', 'text/html; charset=utf-8');
    reply.header('Cache-Control', 'public, max-age=3600');
    return reply.send(stream.body);
  });

  // GET /v1/artifacts/:runId/video/exists — check if video_0.webm was uploaded
  app.get('/v1/artifacts/:runId/video/exists', async (request, reply) => {
    const { runId } = request.params as { runId: string };
    const accountId = request.account.accountId;

    const [run] = await db
      .select({ id: runs.id })
      .from(runs)
      .where(and(eq(runs.id, runId), eq(runs.accountId, accountId)))
      .limit(1);

    if (!run) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Run not found' } });
    }

    const exists = await r2ObjectExists(`runs/${runId}/video_0.webm`);
    return reply.send({ exists });
  });

  // GET /v1/artifacts/:runId/video/url — return a short-lived presigned URL for video_0.webm
  app.get('/v1/artifacts/:runId/video/url', async (request, reply) => {
    const { runId } = request.params as { runId: string };
    const accountId = request.account.accountId;

    const [run] = await db
      .select({ id: runs.id })
      .from(runs)
      .where(and(eq(runs.id, runId), eq(runs.accountId, accountId)))
      .limit(1);

    if (!run) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Run not found' } });
    }

    const url = await getR2PresignedUrl(`runs/${runId}/video_0.webm`, 3600);
    if (!url) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Video not available' } });
    }

    return reply.send({ url });
  });

  // GET /v1/artifacts/:runId/video/:filename — proxy video from R2
  app.get('/v1/artifacts/:runId/video/:filename', async (request, reply) => {
    const { runId, filename } = request.params as { runId: string; filename: string };
    const accountId = request.account.accountId;

    // Sanitize filename (only allow .webm files with safe names)
    if (!/^[\w-]+\.webm$/.test(filename)) {
      return reply.code(400).send({ error: { code: 'INVALID_FILENAME', message: 'Invalid filename' } });
    }

    const [run] = await db
      .select({ id: runs.id })
      .from(runs)
      .where(and(eq(runs.id, runId), eq(runs.accountId, accountId)))
      .limit(1);

    if (!run) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Run not found' } });
    }

    const stream = await streamR2Object(`runs/${runId}/${filename}`);
    if (!stream) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Video not available' } });
    }

    reply.header('Content-Type', stream.contentType);
    reply.header('Cache-Control', 'public, max-age=3600');
    return reply.send(stream.body);
  });
};
