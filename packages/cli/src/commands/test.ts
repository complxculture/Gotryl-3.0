import { readFileSync, mkdirSync, writeFileSync, createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import type { Command as CommandType } from 'commander';
import { Command } from 'commander';
import { GotrylError, type Run } from '@gotryl/sdk';
import { getClient } from '../lib/client.js';
import { readConfig } from '../lib/config.js';
import { printResult, printError, type OutputFormat } from '../lib/output.js';

const TERMINAL_STATUSES = new Set(['passed', 'failed', 'error', 'cancelled']);

async function pollUntilDone(
  client: ReturnType<typeof getClient>,
  runId: string,
  intervalMs = 2000,
  maxWaitMs = 600_000,
): Promise<Run> {
  const deadline = Date.now() + maxWaitMs;
  while (true) {
    const run = await client.runs.get(runId);
    if (TERMINAL_STATUSES.has(run.status)) return run;
    if (Date.now() >= deadline) throw new GotrylError(408, { error: { code: 'TIMEOUT', message: `Run ${runId} did not complete within ${maxWaitMs / 1000}s` } });
    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
  }
}

function runExitCode(status: string): number {
  return status === 'passed' ? 0 : 1;
}

interface FailureSummary {
  rootCauseHypothesis: string | null;
  fixTarget: unknown;
  failingStep: unknown;
}

async function saveRunLocally(
  run: Run,
  testDescription: string,
  rootCause: FailureSummary | null,
): Promise<string> {
  const cfg = readConfig();
  const apiKey = process.env['GOTRYL_API_KEY'] ?? cfg?.apiKey ?? '';
  const baseUrl = (process.env['GOTRYL_API_URL'] ?? cfg?.baseUrl ?? 'https://api.gotryl.com').replace(/\/$/, '');

  const runDir = join(process.cwd(), '.gotryl', 'runs', run.id);
  const artifactsDir = join(runDir, 'artifacts');
  mkdirSync(artifactsDir, { recursive: true });

  const summaryData = {
    runId: run.id,
    testId: run.testId,
    testDescription,
    status: run.status,
    targetUrl: run.targetUrl,
    durationMs: run.durationMs,
    completedAt: run.completedAt,
    savedAt: new Date().toISOString(),
    ...(rootCause ? { rootCauseHypothesis: rootCause.rootCauseHypothesis, fixTarget: rootCause.fixTarget } : {}),
  };
  writeFileSync(join(runDir, 'summary.json'), JSON.stringify(summaryData, null, 2));

  const icon = run.status === 'passed' ? '✓' : run.status === 'failed' ? '✗' : '⚠';
  const mdLines = [
    `# ${icon} ${run.status.toUpperCase()} — ${testDescription}`,
    '',
    `- **Run ID:** ${run.id}`,
    `- **Target:** ${run.targetUrl}`,
    `- **Duration:** ${run.durationMs != null ? `${(run.durationMs / 1000).toFixed(1)}s` : 'n/a'}`,
    `- **Completed:** ${run.completedAt ?? 'n/a'}`,
    '',
  ];
  if (run.status === 'failed' && rootCause?.rootCauseHypothesis) {
    mdLines.push('## What went wrong', '', rootCause.rootCauseHypothesis, '');
  }
  if (run.status === 'failed' && rootCause?.fixTarget) {
    mdLines.push('## Fix target', '', '```json', JSON.stringify(rootCause.fixTarget, null, 2), '```', '');
  }
  if (run.stdout?.trim()) {
    mdLines.push('## Output', '', '```', run.stdout.trim(), '```', '');
  }
  if (run.stderr?.trim()) {
    mdLines.push('## Errors', '', '```', run.stderr.trim(), '```', '');
  }
  writeFileSync(join(runDir, 'summary.md'), mdLines.join('\n'));

  // Download video best-effort (requires R2 to be configured)
  if (apiKey) {
    try {
      const resp = await fetch(`${baseUrl}/v1/artifacts/${run.id}/video/video_0.webm`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(30_000),
      });
      if (resp.ok && resp.body) {
        const dest = join(artifactsDir, 'video.webm');
        const writer = createWriteStream(dest);
        const readable = Readable.fromWeb(resp.body as import('stream/web').ReadableStream<Uint8Array>);
        await new Promise<void>((resolve, reject) => {
          readable.pipe(writer);
          writer.on('finish', resolve);
          writer.on('error', reject);
          readable.on('error', reject);
        });
      }
    } catch { /* best-effort — R2 may not be configured */ }
  }

  return runDir;
}

function printRunResult(run: Run, rootCause: FailureSummary | null, format: OutputFormat, runDir: string): void {
  if (format === 'json') return; // JSON callers handle their own output
  const durationStr = `${run.durationMs ?? 0}ms`;
  const statusLine = `Run ${run.id}: ${run.status} (${durationStr})`;
  console.log(statusLine);
  if (run.status === 'failed' && rootCause?.rootCauseHypothesis) {
    console.log(`\nRoot cause: ${rootCause.rootCauseHypothesis}`);
    if (rootCause.fixTarget) {
      console.log(`Fix target: ${JSON.stringify(rootCause.fixTarget)}`);
    }
  }
  console.log(`\nRun saved → ${runDir}/`);
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

  // ── gotryl test run [testId] ─────────────────────────────────────────────────
  testCommand
    .command('run [id]')
    .description('Dispatch a test run (provide testId, or --project to run all tests for a project)')
    .option('--target-url <url>', 'Target URL (must be https://); falls back to GOTRYL_TARGET_URL env var')
    .option('--project <id>', 'Run all tests for a project (CI mode)')
    .option('--wait', 'Poll until the run(s) reach a terminal state')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'Skip API calls and return canned data')
    .action(async (id: string | undefined, opts: { targetUrl?: string; project?: string; wait?: boolean; output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      const targetUrl = opts.targetUrl ?? process.env['GOTRYL_TARGET_URL'];
      if (!targetUrl && !opts.dryRun) {
        printError('MISSING_ARG', '--target-url is required (or set GOTRYL_TARGET_URL env var)', format);
        process.exit(2);
      }

      // Project-wide run (CI mode)
      if (opts.project) {
        if (opts.dryRun) {
          printResult({ dryRun: true, projectId: opts.project, results: [], passCount: 0, failCount: 0 }, format);
          process.exit(0);
        }
        try {
          const client = getClient(format);
          const tests = await client.tests.list(opts.project);
          if (tests.length === 0) {
            printError('NOT_FOUND', 'No tests found for this project.', format);
            process.exit(1);
          }
          const runs = await Promise.all(tests.map((t) => client.runs.create({ testId: t.id, targetUrl: targetUrl! })));
          let completed = opts.wait ? await Promise.all(runs.map((r) => pollUntilDone(client, r.id))) : runs;
          const results = completed.map((r, i) => ({ runId: r.id, testId: tests[i]!.id, status: r.status, durationMs: r.durationMs }));
          const passCount = results.filter((r) => r.status === 'passed').length;
          const failCount = results.length - passCount;
          if (format === 'json') {
            printResult({ projectId: opts.project, totalTests: results.length, passCount, failCount, results }, format);
          } else {
            console.log(`${passCount}/${results.length} tests passed`);
            for (const r of results) console.log(`  ${r.testId}: ${r.status} (${r.durationMs ?? 0}ms)`);
          }
          process.exit(failCount > 0 ? 1 : 0);
        } catch (err) {
          if (err instanceof GotrylError) { printError(err.code, err.message, format); }
          else { printError('INTERNAL_ERROR', String(err), format); }
          process.exit(1);
        }
      }

      if (!id) {
        printError('MISSING_ARG', 'Provide a testId or use --project <id> for project-wide run', format);
        process.exit(2);
      }

      if (opts.dryRun) {
        const now = new Date().toISOString();
        const run = { id: 'run_dryrun00000000', testId: id, accountId: 'acc_dryrun00000000', targetUrl: targetUrl ?? 'https://example.com', status: 'queued', durationMs: null, stdout: null, stderr: null, error: null, completedAt: null, createdAt: now, updatedAt: now };
        printResult(run, format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        let run = await client.runs.create({ testId: id, targetUrl: targetUrl! });
        if (opts.wait) {
          run = await pollUntilDone(client, run.id);
          let rootCause: FailureSummary | null = null;
          if (run.status === 'failed') {
            try { rootCause = await client.failures.getSummary(run.testId) as FailureSummary; } catch { /* best-effort */ }
          }
          let testDescription = run.testId;
          try { testDescription = (await client.tests.get(run.testId)).description; } catch { /* best-effort */ }
          const runDir = await saveRunLocally(run, testDescription, rootCause);
          if (format === 'json') {
            printResult({ runId: run.id, testId: run.testId, status: run.status, durationMs: run.durationMs, targetUrl: run.targetUrl, completedAt: run.completedAt, runDir }, format);
          } else {
            printRunResult(run, rootCause, format, runDir);
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
        let rootCause: FailureSummary | null = null;
        if (run.status === 'failed') {
          try { rootCause = await client.failures.getSummary(run.testId) as FailureSummary; } catch { /* best-effort */ }
        }
        let testDescription = run.testId;
        try { testDescription = (await client.tests.get(run.testId)).description; } catch { /* best-effort */ }
        const runDir = await saveRunLocally(run, testDescription, rootCause);
        if (format === 'json') {
          printResult({ runId: run.id, testId: run.testId, status: run.status, durationMs: run.durationMs, targetUrl: run.targetUrl, completedAt: run.completedAt, runDir }, format);
        } else {
          printRunResult(run, rootCause, format, runDir);
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
          let rootCause: FailureSummary | null = null;
          if (run.status === 'failed') {
            try { rootCause = await client.failures.getSummary(run.testId) as FailureSummary; } catch { /* best-effort */ }
          }
          let testDescription = run.testId;
          try { testDescription = (await client.tests.get(run.testId)).description; } catch { /* best-effort */ }
          const runDir = await saveRunLocally(run, testDescription, rootCause);
          if (format === 'json') {
            printResult({ runId: run.id, testId: run.testId, status: run.status, durationMs: run.durationMs, targetUrl: run.targetUrl, completedAt: run.completedAt, runDir }, format);
          } else {
            printRunResult(run, rootCause, format, runDir);
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
    .option('--out <dir>', 'Save bundle JSON to a directory (for CI artifact upload)')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'Skip API calls and return canned data')
    .action(async (testId: string, opts: { out?: string; output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      if (opts.dryRun) {
        const stub = { snapshotId: 'snap_dryrun0000000000', failingStep: { lineNo: 0, actionType: 'unknown', selector: '' }, screenshotUrls: [], domSnapshot: '', neighboringSteps: [], testSource: '', rootCauseHypothesis: null, fixTarget: null };
        if (opts.out) {
          mkdirSync(opts.out, { recursive: true });
          const dest = join(opts.out, `${testId}.json`);
          writeFileSync(dest, JSON.stringify(stub, null, 2));
          printResult({ dryRun: true, path: dest }, format);
        } else {
          printResult(stub, format);
        }
        process.exit(0);
      }
      try {
        const client = getClient(format);
        const bundle = await client.failures.get(testId);
        if (opts.out) {
          mkdirSync(opts.out, { recursive: true });
          const dest = join(opts.out, `${testId}.json`);
          writeFileSync(dest, JSON.stringify(bundle, null, 2));
          if (format === 'json') {
            printResult({ testId, path: dest }, format);
          } else {
            console.log(`Bundle saved to ${dest}`);
          }
        } else if (format === 'json') {
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
