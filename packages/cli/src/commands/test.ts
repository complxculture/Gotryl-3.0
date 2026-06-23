import { readFileSync } from 'node:fs';
import type { Command as CommandType } from 'commander';
import { Command } from 'commander';
import { GotrylError } from '@gotryl/sdk';
import { getClient } from '../lib/client.js';
import { printResult, printError, type OutputFormat } from '../lib/output.js';

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

  program.addCommand(testCommand);
}
