import { Command } from 'commander';
import { createRequire } from 'node:module';
import { registerSetupCommand } from './commands/setup.js';
import { registerAuthCommand } from './commands/auth.js';
import { registerProjectCommand } from './commands/project.js';
import { registerTestCommand } from './commands/test.js';

const { version } = createRequire(import.meta.url)('../package.json') as { version: string };

export const program = new Command();

program
  .name('gotryl')
  .description('Gotryl cloud test runner — AI-powered Playwright testing')
  .version(version)
  .option('-o, --output <format>', 'output format: human or json', 'human');

registerSetupCommand(program);
registerAuthCommand(program);
registerProjectCommand(program);
registerTestCommand(program);

program
  .command('agent')
  .description('Install Gotryl agent skills into your coding agent')
  .action(() => {
    console.log('Not yet implemented. Run gotryl agent --help for usage.');
  });
