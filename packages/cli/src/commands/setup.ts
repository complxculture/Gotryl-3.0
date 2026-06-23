import readline from 'node:readline';
import type { Command } from 'commander';
import { GotrylClient, GotrylError } from '@gotryl/sdk';
import { writeConfig, readConfig } from '../lib/config.js';
import { printResult, printError, type OutputFormat } from '../lib/output.js';

export function registerSetupCommand(program: Command): void {
  program
    .command('setup')
    .description('Configure the Gotryl CLI with your API key')
    .option('--from-env', 'read API key from GOTRYL_API_KEY env var')
    .option('--yes', 'skip confirmation prompts')
    .option('--dry-run', 'validate config without writing changes')
    .action(async (opts: { fromEnv?: boolean; yes?: boolean; dryRun?: boolean }) => {
      const format = (program.opts().output ?? 'human') as OutputFormat;
      const baseUrl = process.env.GOTRYL_API_URL ?? 'https://api.gotryl.com';

      if (opts.dryRun) {
        const existingKey = process.env.GOTRYL_API_KEY ?? readConfig()?.apiKey;
        if (!existingKey) {
          printError('NO_API_KEY', 'No API key configured. Run `gotryl setup`.', format);
          process.exit(2);
        }
        printResult({ dryRun: true, configured: true }, format);
        process.exit(0);
      }

      let apiKey: string;

      if (opts.fromEnv) {
        const envKey = process.env.GOTRYL_API_KEY?.trim();
        if (!envKey) {
          printError('NO_API_KEY', 'GOTRYL_API_KEY is not set or is empty.', format);
          process.exit(2);
        }
        apiKey = envKey;
      } else {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        apiKey = await new Promise<string>((resolve) => {
          rl.question('Enter your Gotryl API key (gk_...): ', (answer) => {
            rl.close();
            resolve(answer.trim());
          });
        });

        if (!apiKey) {
          printError('INVALID_INPUT', 'API key cannot be empty.', format);
          process.exit(2);
        }
      }

      try {
        const client = new GotrylClient({ apiKey, baseUrl });
        const me = await client.auth.getMe();
        writeConfig({ apiKey, baseUrl });
        if (format === 'json') {
          printResult({ configured: true, accountId: me.accountId, email: me.email }, format);
        } else {
          console.log(`API key configured successfully. Logged in as ${me.email}.`);
        }
      } catch (err) {
        if (err instanceof GotrylError) {
          printError(err.code, err.message, format);
        } else {
          printError('INTERNAL_ERROR', String(err), format);
        }
        process.exit(1);
      }
      process.exit(0);
    });
}
