import type { Command as CommandType } from 'commander';
import { Command } from 'commander';
import { GotrylError } from '@gotryl/sdk';
import { getClient } from '../lib/client.js';
import { printResult, printError, type OutputFormat } from '../lib/output.js';

export function registerProjectCommand(program: CommandType): void {
  const projectCommand = new Command('project').description('Manage projects');

  projectCommand
    .command('create')
    .description('Create a new project')
    .requiredOption('--name <name>', 'Project name')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'skip API calls and return canned data')
    .action(async (opts: { name: string; output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      if (opts.dryRun) {
        const now = new Date().toISOString();
        printResult({ id: 'prj_dryrun00000000', name: opts.name, accountId: 'acc_dryrun00000000', createdAt: now, updatedAt: now }, format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        const result = await client.projects.create({ name: opts.name });
        if (format === 'json') {
          printResult(result, format);
        } else {
          console.log(`Created project: ${result.name} (${result.id})`);
        }
      } catch (err) {
        if (err instanceof GotrylError) { printError(err.code, err.message, format); }
        else { printError('INTERNAL_ERROR', String(err), format); }
        process.exit(1);
      }
    });

  projectCommand
    .command('list')
    .description('List all projects')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'skip API calls and return canned data')
    .action(async (opts: { output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      if (opts.dryRun) {
        printResult([], format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        const result = await client.projects.list();
        if (format === 'json') {
          printResult(result, format);
        } else {
          if (result.length === 0) {
            console.log('No projects found.');
          } else {
            for (const project of result) {
              console.log(`${project.id}  ${project.name}`);
            }
          }
        }
      } catch (err) {
        if (err instanceof GotrylError) { printError(err.code, err.message, format); }
        else { printError('INTERNAL_ERROR', String(err), format); }
        process.exit(1);
      }
    });

  projectCommand
    .command('get <id>')
    .description('Get a project by ID')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'skip API calls and return canned data')
    .action(async (id: string, opts: { output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      if (opts.dryRun) {
        const now = new Date().toISOString();
        printResult({ id, name: 'dry-run-project', accountId: 'acc_dryrun00000000', createdAt: now, updatedAt: now }, format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        const result = await client.projects.get(id);
        if (format === 'json') {
          printResult(result, format);
        } else {
          console.log(`ID:         ${result.id}`);
          console.log(`Name:       ${result.name}`);
          console.log(`Created:    ${result.createdAt}`);
          console.log(`Updated:    ${result.updatedAt}`);
        }
      } catch (err) {
        if (err instanceof GotrylError) { printError(err.code, err.message, format); }
        else { printError('INTERNAL_ERROR', String(err), format); }
        process.exit(1);
      }
    });

  projectCommand
    .command('update <id>')
    .description('Update a project')
    .requiredOption('--name <name>', 'New project name')
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'skip API calls and return canned data')
    .action(async (id: string, opts: { name: string; output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      if (opts.dryRun) {
        const now = new Date().toISOString();
        printResult({ id, name: opts.name, accountId: 'acc_dryrun00000000', createdAt: now, updatedAt: now }, format);
        process.exit(0);
      }
      try {
        const client = getClient(format);
        const result = await client.projects.update(id, { name: opts.name });
        if (format === 'json') {
          printResult(result, format);
        } else {
          console.log(`Updated project: ${result.name} (${result.id})`);
        }
      } catch (err) {
        if (err instanceof GotrylError) { printError(err.code, err.message, format); }
        else { printError('INTERNAL_ERROR', String(err), format); }
        process.exit(1);
      }
    });

  program.addCommand(projectCommand);
}
