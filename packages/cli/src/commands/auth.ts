import type { Command } from 'commander';
import { GotrylError } from '@gotryl/sdk';
import { readConfig, deleteConfig } from '../lib/config.js';
import { getClient } from '../lib/client.js';
import { printResult, printError, type OutputFormat } from '../lib/output.js';

export function registerAuthCommand(program: Command): void {
  const auth = program
    .command('auth')
    .description('Manage CLI authentication');

  auth
    .command('status')
    .description('Show authentication status')
    .option('--dry-run', 'skip API calls and return current config state')
    .action(async (opts: { dryRun?: boolean }) => {
      const format = (program.opts().output ?? 'human') as OutputFormat;
      const apiKey = process.env.GOTRYL_API_KEY ?? readConfig()?.apiKey;

      if (opts.dryRun) {
        printResult({ dryRun: true, configured: !!apiKey }, format);
        process.exit(0);
      }

      if (!apiKey) {
        printResult({ configured: false }, format);
        process.exit(0);
      }

      try {
        const client = getClient(format);
        const me = await client.auth.getMe();
        printResult({ configured: true, accountId: me.accountId, email: me.email }, format);
        process.exit(0);
      } catch (err) {
        if (err instanceof GotrylError) {
          printError(err.code, err.message, format);
        } else {
          printError('INTERNAL_ERROR', String(err), format);
        }
        process.exit(1);
      }
    });

  auth
    .command('remove')
    .description('Remove stored API key')
    .option('--dry-run', 'simulate removal without deleting config')
    .action((opts: { dryRun?: boolean }) => {
      const format = (program.opts().output ?? 'human') as OutputFormat;

      if (opts.dryRun) {
        printResult({ dryRun: true, removed: false }, format);
        process.exit(0);
      }

      deleteConfig();
      if (format === 'json') {
        printResult({ removed: true }, format);
      } else {
        console.log('API key removed.');
      }
      process.exit(0);
    });
}
