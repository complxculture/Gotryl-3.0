import { Worker, type Job } from 'bullmq';
import { connection } from './client.js';

import { db } from '../db/client.js';
import { runs, tests } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export interface RunJobData {
  runId: string;
  testId: string;
  testDescription: string;
  testCode: string | null;
  targetUrl: string;
}

interface ExecutorResult {
  status: string;
  durationMs: number;
  stdout: string;
  stderr: string;
  error?: string;
  generatedCode?: string;
  snapshotId?: string;
}

export function startRunWorker(): Worker<RunJobData> {
  const executorUrl = process.env.EXECUTOR_URL;
  if (!executorUrl) throw new Error('EXECUTOR_URL is required');

  const worker = new Worker<RunJobData>(
    'gotryl:runs',
    async (job: Job<RunJobData>) => {
      const { runId, testId, testDescription, testCode, targetUrl } = job.data;

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
          body: JSON.stringify({ runId, testCode: testCode ?? null, testDescription, targetUrl }),
          signal: AbortSignal.timeout(130_000),
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

      if (execResult.generatedCode) {
        try {
          await db
            .update(tests)
            .set({ generatedCode: execResult.generatedCode, updatedAt: new Date() })
            .where(eq(tests.id, testId));
        } catch (err) {
          console.warn('Failed to persist generated code for test %s — next run will regenerate: %s', testId, err);
        }
      }

      const VALID_TERMINAL_STATUSES = ['passed', 'failed', 'error'] as const;
      const terminalStatus = VALID_TERMINAL_STATUSES.includes(execResult.status as typeof VALID_TERMINAL_STATUSES[number])
        ? execResult.status
        : 'error';

      await db
        .update(runs)
        .set({
          status: terminalStatus,
          durationMs: execResult.durationMs,
          stdout: execResult.stdout,
          stderr: execResult.stderr,
          error: execResult.error ?? (terminalStatus !== execResult.status ? `Executor returned unknown status: ${execResult.status}` : null),
          snapshotId: execResult.snapshotId ?? null,
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
