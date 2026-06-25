import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import type { FastifyPluginAsync } from 'fastify';
import { db } from '../db/client.js';
import { runs, tests } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';

function makeR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT ?? '',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  });
}

async function fetchBundle(runId: string): Promise<Record<string, unknown> | null> {
  const bucket = process.env.R2_BUCKET;
  if (!bucket || !process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID) return null;
  try {
    const client = makeR2Client();
    const resp = await client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: `runs/${runId}/failure-bundle.json`,
    }));
    const body = await resp.Body?.transformToString('utf-8');
    return body ? (JSON.parse(body) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

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

    const bundle = await fetchBundle(run.id);
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

    const bundle = await fetchBundle(run.id);
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

    const bundle = await fetchBundle(run.id);
    if (!bundle) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Failure bundle not available' } });
    }

    return reply.send(bundle);
  });
};
