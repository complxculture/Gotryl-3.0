import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command as CommandType } from 'commander';
import { Command } from 'commander';
import { GotrylError, type Run } from '@gotryl/sdk';
import { getClient } from '../lib/client.js';
import { printResult, printError, type OutputFormat } from '../lib/output.js';

const TERMINAL_STATUSES = new Set(['passed', 'failed', 'error', 'cancelled']);

async function pollUntilDone(
  client: ReturnType<typeof getClient>,
  runId: string,
  intervalMs = 2000,
): Promise<Run> {
  while (true) {
    const run = await client.runs.get(runId);
    if (TERMINAL_STATUSES.has(run.status)) return run;
    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
  }
}

function runExitCode(status: string): number {
  return status === 'passed' ? 0 : 1;
}

export function registerTestCommand(program: CommandType): void {
  const testCommand = new Command('test').description('Manage tests');

  testCommand
    .command('create')
    .description('Create a new test')
    .requiredOption('--project <id>', 'Project ID')
    .requiredOption('--description <text>', 'Test description')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'Skip API calls and return canned data')
    .action(async (opts: { project: string; description: string; output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      if (opts.dryRun) {
        const now = new Date().toISOString();
        printResult({ id: 'tst_dryrun00000000', projectId: opts.project, accountId: 'acc_dryrun00000000', description: opts.description, generatedCode: null, status: 'pending', createdAt: now, updatedAt: now }, format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        const result = await client.tests.create({ projectId: opts.project, description: opts.description });
        if (format === 'json') {
          printResult(result, format);
        } else {
          console.log(`Created test: ${result.id}`);
        }
      } catch (err) {
        if (err instanceof GotrylError) { printError(err.code, err.message, format); }
        else { printError('INTERNAL_ERROR', String(err), format); }
        process.exit(1);
      }
    });

  testCommand
    .command('create-batch')
    .description('Create multiple tests from a JSON file')
    .requiredOption('--project <id>', 'Project ID')
    .requiredOption('--file <path>', 'Path to JSON file containing array of { description: string }')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'Skip API calls and return canned data')
    .action(async (opts: { project: string; file: string; output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      let items: Array<{ description: string }>;
      try {
        const parsed: unknown = JSON.parse(readFileSync(opts.file, 'utf8'));
        if (!Array.isArray(parsed)) throw new Error('Expected a JSON array');
        items = parsed as Array<{ description: string }>;
      } catch (e) {
        printError('INVALID_FILE', `Could not read or parse file: ${String(e)}`, format);
        process.exit(2);
      }
      if (opts.dryRun) {
        const now = new Date().toISOString();
        printResult(items.map((t, i) => ({ id: `tst_dryrun${String(i).padStart(8, '0')}`, projectId: opts.project, accountId: 'acc_dryrun00000000', description: t.description, generatedCode: null, status: 'pending', createdAt: now, updatedAt: now })), format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        const result = await client.tests.createBatch({ projectId: opts.project, tests: items });
        if (format === 'json') {
          printResult(result, format);
        } else {
          console.log(`Created ${result.length} test(s).`);
          for (const t of result) {
            console.log(`  ${t.id}`);
          }
        }
      } catch (err) {
        if (err instanceof GotrylError) { printError(err.code, err.message, format); }
        else { printError('INTERNAL_ERROR', String(err), format); }
        process.exit(1);
      }
    });

  testCommand
    .command('list')
    .description('List tests in a project')
    .requiredOption('--project <id>', 'Project ID')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'Skip API calls and return canned data')
    .action(async (opts: { project: string; output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      if (opts.dryRun) {
        printResult([], format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        const result = await client.tests.list(opts.project);
        if (format === 'json') {
          printResult(result, format);
        } else {
          if (result.length === 0) {
            console.log('No tests found.');
          } else {
            for (const t of result) {
              console.log(`${t.id}  ${t.status}  ${t.description.slice(0, 60)}`);
            }
          }
        }
      } catch (err) {
        if (err instanceof GotrylError) { printError(err.code, err.message, format); }
        else { printError('INTERNAL_ERROR', String(err), format); }
        process.exit(1);
      }
    });

  testCommand
    .command('get <id>')
    .description('Get a test by ID')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'Skip API calls and return canned data')
    .action(async (id: string, opts: { output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      if (opts.dryRun) {
        const now = new Date().toISOString();
        printResult({ id, projectId: 'prj_dryrun00000000', accountId: 'acc_dryrun00000000', description: 'dry-run test', generatedCode: null, status: 'pending', createdAt: now, updatedAt: now }, format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        const result = await client.tests.get(id);
        if (format === 'json') {
          printResult(result, format);
        } else {
          console.log(`ID:          ${result.id}`);
          console.log(`Project:     ${result.projectId}`);
          console.log(`Status:      ${result.status}`);
          console.log(`Description: ${result.description}`);
          console.log(`Created:     ${result.createdAt}`);
          console.log(`Updated:     ${result.updatedAt}`);
        }
      } catch (err) {
        if (err instanceof GotrylError) { printError(err.code, err.message, format); }
        else { printError('INTERNAL_ERROR', String(err), format); }
        process.exit(1);
      }
    });

  testCommand
    .command('update <id>')
    .description('Update a test')
    .requiredOption('--description <text>', 'New test description')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'Skip API calls and return canned data')
    .action(async (id: string, opts: { description: string; output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      if (opts.dryRun) {
        const now = new Date().toISOString();
        printResult({ id, projectId: 'prj_dryrun00000000', accountId: 'acc_dryrun00000000', description: opts.description, generatedCode: null, status: 'pending', createdAt: now, updatedAt: now }, format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        const result = await client.tests.update(id, { description: opts.description });
        if (format === 'json') {
          printResult(result, format);
        } else {
          console.log(`Updated test: ${result.id}`);
        }
      } catch (err) {
        if (err instanceof GotrylError) { printError(err.code, err.message, format); }
        else { printError('INTERNAL_ERROR', String(err), format); }
        process.exit(1);
      }
    });

  testCommand
    .command('delete <id>')
    .description('Delete a test')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'Skip API calls and return canned data')
    .action(async (id: string, opts: { output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      if (opts.dryRun) {
        printResult({ dryRun: true, deleted: false, id }, format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        await client.tests.delete(id);
        if (format === 'json') {
          printResult({ deleted: true, id }, format);
        } else {
          console.log(`Deleted test: ${id}`);
        }
      } catch (err) {
        if (err instanceof GotrylError) { printError(err.code, err.message, format); }
        else { printError('INTERNAL_ERROR', String(err), format); }
        process.exit(1);
      }
    });

  // ── gotryl test run <testId> ──────────────────────────────────────────────────
  testCommand
    .command('run <id>')
    .description('Dispatch a test run')
    .requiredOption('--target-url <url>', 'Target URL (must be https://)')
    .option('--wait', 'Poll until the run reaches a terminal state')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'Skip API calls and return canned data')
    .action(async (id: string, opts: { targetUrl: string; wait?: boolean; output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      if (opts.dryRun) {
        const now = new Date().toISOString();
        const run = { id: 'run_dryrun00000000', testId: id, accountId: 'acc_dryrun00000000', targetUrl: opts.targetUrl, status: 'queued', durationMs: null, stdout: null, stderr: null, error: null, completedAt: null, createdAt: now, updatedAt: now };
        printResult(run, format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        let run = await client.runs.create({ testId: id, targetUrl: opts.targetUrl });
        if (opts.wait) {
          run = await pollUntilDone(client, run.id);
          if (format === 'json') {
            printResult({ runId: run.id, testId: run.testId, status: run.status, durationMs: run.durationMs, targetUrl: run.targetUrl, completedAt: run.completedAt }, format);
          } else {
            console.log(`Run ${run.id}: ${run.status} (${run.durationMs ?? 0}ms)`);
          }
          process.exit(runExitCode(run.status));
        }
        if (format === 'json') {
          printResult({ runId: run.id, status: run.status }, format);
        } else {
          console.log(`Dispatched run: ${run.id} (${run.status})`);
        }
      } catch (err) {
        if (err instanceof GotrylError) { printError(err.code, err.message, format); }
        else { printError('INTERNAL_ERROR', String(err), format); }
        process.exit(1);
      }
    });

  // ── gotryl test wait <runId> ──────────────────────────────────────────────────
  testCommand
    .command('wait <runId>')
    .description('Poll an existing run until it reaches a terminal state')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'Skip API calls and return canned data')
    .action(async (runId: string, opts: { output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      if (opts.dryRun) {
        const now = new Date().toISOString();
        printResult({ runId, status: 'passed', durationMs: 0, targetUrl: 'https://example.com', completedAt: now }, format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        const run = await pollUntilDone(client, runId);
        if (format === 'json') {
          printResult({ runId: run.id, testId: run.testId, status: run.status, durationMs: run.durationMs, targetUrl: run.targetUrl, completedAt: run.completedAt }, format);
        } else {
          console.log(`Run ${run.id}: ${run.status} (${run.durationMs ?? 0}ms)`);
        }
        process.exit(runExitCode(run.status));
      } catch (err) {
        if (err instanceof GotrylError) { printError(err.code, err.message, format); }
        else { printError('INTERNAL_ERROR', String(err), format); }
        process.exit(1);
      }
    });

  // ── gotryl test rerun <testId> ────────────────────────────────────────────────
  testCommand
    .command('rerun <id>')
    .description('Re-run a test using its existing generated code')
    .option('--target-url <url>', 'Target URL (defaults to the last run\'s URL)')
    .option('--wait', 'Poll until the run reaches a terminal state')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'Skip API calls and return canned data')
    .action(async (id: string, opts: { targetUrl?: string; wait?: boolean; output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      if (opts.dryRun) {
        const now = new Date().toISOString();
        const run = { id: 'run_dryrun00000000', testId: id, accountId: 'acc_dryrun00000000', targetUrl: opts.targetUrl ?? 'https://example.com', status: 'queued', durationMs: null, stdout: null, stderr: null, error: null, completedAt: null, createdAt: now, updatedAt: now };
        printResult(run, format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        let targetUrl = opts.targetUrl;
        if (!targetUrl) {
          const history = await client.runs.list(id);
          const last = history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          if (!last) {
            printError('NO_PRIOR_RUN', 'No prior run found. Provide --target-url to create the first run.', format);
            process.exit(1);
          }
          targetUrl = last.targetUrl;
        }
        let run = await client.runs.create({ testId: id, targetUrl });
        if (opts.wait) {
          run = await pollUntilDone(client, run.id);
          if (format === 'json') {
            printResult({ runId: run.id, testId: run.testId, status: run.status, durationMs: run.durationMs, targetUrl: run.targetUrl, completedAt: run.completedAt }, format);
          } else {
            console.log(`Rerun ${run.id}: ${run.status} (${run.durationMs ?? 0}ms)`);
          }
          process.exit(runExitCode(run.status));
        }
        if (format === 'json') {
          printResult({ runId: run.id, status: run.status }, format);
        } else {
          console.log(`Dispatched rerun: ${run.id} (${run.status})`);
        }
      } catch (err) {
        if (err instanceof GotrylError) { printError(err.code, err.message, format); }
        else { printError('INTERNAL_ERROR', String(err), format); }
        process.exit(1);
      }
    });

  // ── gotryl test result <testId> ───────────────────────────────────────────────
  testCommand
    .command('result <id>')
    .description('Get the latest run result for a test')
    .option('--history', 'Return all prior runs as a JSON array')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'Skip API calls and return canned data')
    .action(async (id: string, opts: { history?: boolean; output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      if (opts.dryRun) {
        const now = new Date().toISOString();
        const stub = { id: 'run_dryrun00000000', testId: id, accountId: 'acc_dryrun00000000', targetUrl: 'https://example.com', status: 'passed', durationMs: 0, stdout: '', stderr: '', error: null, completedAt: now, createdAt: now, updatedAt: now };
        printResult(opts.history ? [stub] : stub, format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        const history = await client.runs.list(id);
        const sorted = history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (opts.history) {
          printResult(sorted, format);
        } else {
          const latest = sorted[0];
          if (!latest) {
            printError('NOT_FOUND', 'No runs found for this test.', format);
            process.exit(1);
          }
          if (format === 'json') {
            printResult({ runId: latest.id, testId: latest.testId, status: latest.status, durationMs: latest.durationMs, targetUrl: latest.targetUrl, completedAt: latest.completedAt }, format);
          } else {
            console.log(`Run ${latest.id}: ${latest.status} (${latest.durationMs ?? 0}ms) @ ${latest.completedAt ?? 'pending'}`);
          }
          process.exit(runExitCode(latest.status));
        }
      } catch (err) {
        if (err instanceof GotrylError) { printError(err.code, err.message, format); }
        else { printError('INTERNAL_ERROR', String(err), format); }
        process.exit(1);
      }
    });

  // ── gotryl test code get/put/steps ───────────────────────────────────────────
  const codeCommand = new Command('code').description('Access and update generated test source');

  codeCommand
    .command('get <testId>')
    .description('Fetch the generated Python source for a test')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'Skip API calls and return canned data')
    .action(async (testId: string, opts: { output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      if (opts.dryRun) {
        printResult({ code: '# dry-run', etag: '"dryrun"' }, format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        const result = await client.tests.getCode(testId);
        if (format === 'json') {
          printResult(result, format);
        } else {
          console.log(`ETag: ${result.etag}`);
          console.log(result.code);
        }
      } catch (err) {
        if (err instanceof GotrylError) { printError(err.code, err.message, format); }
        else { printError('INTERNAL_ERROR', String(err), format); }
        process.exit(1);
      }
    });

  codeCommand
    .command('put <testId>')
    .description('Replace generated test source (requires ETag from code get)')
    .requiredOption('--file <path>', 'Path to updated .py file')
    .requiredOption('--etag <etag>', 'ETag value from code get (used for optimistic concurrency)')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'Skip API calls and return canned data')
    .action(async (testId: string, opts: { file: string; etag: string; output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      let code: string;
      try {
        code = readFileSync(opts.file, 'utf8');
      } catch (e) {
        printError('INVALID_FILE', `Could not read file: ${String(e)}`, format);
        process.exit(2);
      }
      if (opts.dryRun) {
        printResult({ code, etag: '"dryrun-new"' }, format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        const result = await client.tests.putCode(testId, code, opts.etag);
        if (format === 'json') {
          printResult(result, format);
        } else {
          console.log(`Updated. New ETag: ${result.etag}`);
        }
      } catch (err) {
        if (err instanceof GotrylError) {
          if (err.code === 'PRECONDITION_FAILED') {
            printError(err.code, 'Test code has changed. Fetch the latest and retry.', format);
          } else {
            printError(err.code, err.message, format);
          }
        } else {
          printError('INTERNAL_ERROR', String(err), format);
        }
        process.exit(1);
      }
    });

  codeCommand
    .command('steps <testId>')
    .description('List step artifacts (screenshots and DOM snapshots) from the latest run')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'Skip API calls and return canned data')
    .action(async (testId: string, opts: { output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      if (opts.dryRun) {
        printResult([], format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        const steps = await client.tests.getSteps(testId);
        if (format === 'json') {
          printResult(steps, format);
        } else {
          if (steps.length === 0) {
            console.log('No steps recorded for this test.');
          } else {
            for (const s of steps) {
              console.log(`Step ${s.step}: screenshot=${s.screenshotUrl}  dom=${s.domSnapshotUrl}`);
            }
          }
        }
      } catch (err) {
        if (err instanceof GotrylError) { printError(err.code, err.message, format); }
        else { printError('INTERNAL_ERROR', String(err), format); }
        process.exit(1);
      }
    });

  testCommand.addCommand(codeCommand);

  // ── gotryl test failure get <testId> ─────────────────────────────────────────
  const failureCommand = new Command('failure').description('Retrieve failure bundles');

  failureCommand
    .command('get <testId>')
    .description('Fetch the full failure bundle for the latest failed run of a test')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'Skip API calls and return canned data')
    .action(async (testId: string, opts: { output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      if (opts.dryRun) {
        printResult({ snapshotId: 'snap_dryrun0000000000', failingStep: { lineNo: 0, actionType: 'unknown', selector: '' }, screenshotUrls: [], domSnapshot: '', neighboringSteps: [], testSource: '', rootCauseHypothesis: null, fixTarget: null }, format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        const bundle = await client.failures.get(testId);
        if (format === 'json') {
          printResult(bundle, format);
        } else {
          console.log(`Snapshot:  ${bundle.snapshotId}`);
          console.log(`Failing line: ${bundle.failingStep.lineNo}`);
          console.log(`Screenshots: ${bundle.screenshotUrls.length}`);
          console.log(`Root cause: ${bundle.rootCauseHypothesis ?? '(not yet analyzed)'}`);
        }
      } catch (err) {
        if (err instanceof GotrylError) { printError(err.code, err.message, format); }
        else { printError('INTERNAL_ERROR', String(err), format); }
        process.exit(1);
      }
    });

  failureCommand
    .command('summary <testId>')
    .description('Fetch compact triage summary for the latest failed run of a test')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'Skip API calls and return canned data')
    .action(async (testId: string, opts: { output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      if (opts.dryRun) {
        printResult({ rootCauseHypothesis: null, fixTarget: null, failingStep: { lineNo: 0, actionType: 'unknown', selector: '' } }, format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        const summary = await client.failures.getSummary(testId);
        if (format === 'json') {
          printResult(summary, format);
        } else {
          console.log(`Failing line:  ${(summary.failingStep as { lineNo: number } | null)?.lineNo ?? 'unknown'}`);
          console.log(`Root cause:    ${summary.rootCauseHypothesis ?? '(not yet analyzed)'}`);
          console.log(`Fix target:    ${JSON.stringify(summary.fixTarget)}`);
        }
      } catch (err) {
        if (err instanceof GotrylError) { printError(err.code, err.message, format); }
        else { printError('INTERNAL_ERROR', String(err), format); }
        process.exit(1);
      }
    });

  testCommand.addCommand(failureCommand);

  // ── gotryl test artifact get <runId> ─────────────────────────────────────────
  const artifactCommand = new Command('artifact').description('Download run artifacts');

  artifactCommand
    .command('get <runId>')
    .description('Download the full failure bundle for a run')
    .option('--out <dir>', 'Directory to write bundle files (defaults to ./)')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'Skip API calls and return canned data')
    .action(async (runId: string, opts: { out?: string; output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      const outDir = opts.out ?? '.';
      if (opts.dryRun) {
        printResult({ dryRun: true, runId, outDir }, format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        const bundle = await client.failures.getArtifacts(runId);
        mkdirSync(outDir, { recursive: true });
        const dest = join(outDir, 'failure-bundle.json');
        writeFileSync(dest, JSON.stringify(bundle, null, 2));
        if (format === 'json') {
          printResult({ runId, path: dest }, format);
        } else {
          console.log(`Bundle written to ${dest}`);
        }
      } catch (err) {
        if (err instanceof GotrylError) { printError(err.code, err.message, format); }
        else { printError('INTERNAL_ERROR', String(err), format); }
        process.exit(1);
      }
    });

  testCommand.addCommand(artifactCommand);

  program.addCommand(testCommand);
}
