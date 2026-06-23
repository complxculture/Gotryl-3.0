import { Worker, type Job } from 'bullmq';
import { connection } from './client.js';

import { db } from '../db/client.js';
import { runs } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export interface RunJobData {
  runId: string;
  testCode: string | null;
  targetUrl: string;
}

interface ExecutorResult {
  status: string;
  durationMs: number;
  stdout: string;
  stderr: string;
  error?: string;
}

export function startRunWorker(): Worker<RunJobData> {
  const executorUrl = process.env.EXECUTOR_URL;
  if (!executorUrl) throw new Error('EXECUTOR_URL is required');

  const worker = new Worker<RunJobData>(
    'gotryl:runs',
    async (job: Job<RunJobData>) => {
      const { runId, testCode, targetUrl } = job.data;

      await db
        .update(runs)
        .set({ status: 'running', updatedAt: new Date() })
        .where(eq(runs.id, runId));

      let execResult: ExecutorResult;

      try {
        const resp = await fetch(`${executorUrl}/v1/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET ?? '',
          },
          body: JSON.stringify({ runId, testCode: testCode ?? '', targetUrl }),
        });

        if (!resp.ok) {
          throw new Error(`Executor responded ${resp.status}`);
        }

        execResult = (await resp.json()) as ExecutorResult;
      } catch (err) {
        await db
          .update(runs)
          .set({ status: 'error', error: String(err), updatedAt: new Date(), completedAt: new Date() })
          .where(eq(runs.id, runId));
        return;
      }

      await db
        .update(runs)
        .set({
          status: execResult.status,
          durationMs: execResult.durationMs,
          stdout: execResult.stdout,
          stderr: execResult.stderr,
          error: execResult.error ?? null,
          updatedAt: new Date(),
          completedAt: new Date(),
        })
        .where(eq(runs.id, runId));
    },
    { connection },
  );

  // Safety net: if the job processor itself throws (e.g. first DB update fails),
  // BullMQ marks the job failed — update run status to error
  worker.on('failed', async (job: Job<RunJobData> | undefined, err: Error) => {
    if (!job) return;
    try {
      await db
        .update(runs)
        .set({ status: 'error', error: err.message, updatedAt: new Date(), completedAt: new Date() })
        .where(eq(runs.id, job.data.runId));
    } catch {
      // best-effort
    }
  });

  return worker;
}
