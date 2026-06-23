import { GotrylClient } from '@gotryl/sdk';
import { readConfig } from './config.js';
import { printError, type OutputFormat } from './output.js';

export function getClient(format: OutputFormat = 'human'): GotrylClient {
  const config = readConfig();
  const apiKey = process.env.GOTRYL_API_KEY ?? config?.apiKey;
  if (!apiKey) {
    printError('NO_API_KEY', 'No API key configured. Run `gotryl setup`.', format);
    process.exit(2);
  }
  const baseUrl = process.env.GOTRYL_API_URL ?? config?.baseUrl ?? 'https://api.gotryl.com';
  return new GotrylClient({ apiKey, baseUrl });
}
