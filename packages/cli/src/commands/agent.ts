import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Command as CommandType } from 'commander';
import { Command } from 'commander';
import { printResult, printError, type OutputFormat } from '../lib/output.js';

const SUPPORTED_AGENTS = ['claude', 'cursor', 'codex', 'cline', 'antigravity'] as const;
type AgentName = typeof SUPPORTED_AGENTS[number];

const SKILL_FILENAME: Record<AgentName, string> = {
  claude: 'gotryl-skill.md',
  cursor: '.cursor/rules/gotryl-skill.md',
  codex: 'gotryl-skill.md',
  cline: '.clinerules/gotryl-skill.md',
  antigravity: 'gotryl-skill.md',
};

const INSTALLED_RECORD = '.gotryl-agents.json';

function buildSkillContent(agent: AgentName): string {
  const name = agent.charAt(0).toUpperCase() + agent.slice(1);
  return `# Gotryl Agent Skill — ${name}

This skill teaches you the full Gotryl test→run→fix loop for cloud-hosted Playwright tests.

## Overview

Gotryl runs Playwright tests in the cloud against live URLs. You interact with it via \`gotryl\` CLI.
All tests belong to a **Project**. Each test has a **description** (what to verify) and optional generated Python Playwright code.

## Full Loop

### 1. Coverage detection — check before creating

\`\`\`bash
gotryl test list --project <projectId> --output json
\`\`\`

If a test already covers the behavior, **rerun** it instead of creating a new one:

\`\`\`bash
gotryl test rerun <testId> --target-url https://example.com --wait
\`\`\`

### 2. Create a new test (if no coverage)

\`\`\`bash
gotryl test create --project <projectId> --description "User can log in and see their dashboard"
\`\`\`

### 3. Run the test

\`\`\`bash
gotryl test run <testId> --target-url https://example.com --wait --output json
\`\`\`

Exit code: 0 = passed, 1 = failed/error.

### 4. On failure — retrieve failure bundle

\`\`\`bash
gotryl test failure get <testId> --output json
\`\`\`

Returns: \`{ snapshotId, failingStep, screenshotUrls, domSnapshot, testSource, rootCauseHypothesis, fixTarget }\`

### 5. Fix and rerun

Use \`rootCauseHypothesis\` and \`fixTarget\` to inform code changes.
After fixing, rerun the test:

\`\`\`bash
gotryl test rerun <testId> --wait --output json
\`\`\`

### 6. Update test code (optional)

Fetch the current test source with its ETag, then replace it:

\`\`\`bash
gotryl test code get <testId> --output json
gotryl test code put <testId> --file updated_test.py --etag "<etag-from-get>"
\`\`\`

## Key Rules

- Always check coverage before creating new tests.
- Use \`--wait\` to block until completion; check the exit code.
- Passing tests bank permanently — never delete passing tests.
- Use \`--output json\` when the result needs to be parsed programmatically.
- The \`targetUrl\` must be an \`https://\` URL (no localhost).

## Useful Commands

| Command | Purpose |
|---------|---------|
| \`gotryl test list --project <id> --output json\` | Coverage check |
| \`gotryl test run <id> --target-url <url> --wait\` | Run and wait |
| \`gotryl test failure get <id> --output json\` | Full failure bundle |
| \`gotryl test failure summary <id> --output json\` | Compact triage |
| \`gotryl test code get <id>\` | Fetch generated source + ETag |
| \`gotryl test code put <id> --file <f> --etag <e>\` | Replace source safely |
| \`gotryl test artifact get <runId> --out ./artifacts/\` | Download artifacts |
`;
}

function loadInstalled(): Array<{ agent: string; path: string; installedAt: string }> {
  if (!existsSync(INSTALLED_RECORD)) return [];
  try {
    return JSON.parse(readFileSync(INSTALLED_RECORD, 'utf8')) as Array<{ agent: string; path: string; installedAt: string }>;
  } catch {
    return [];
  }
}

function saveInstalled(records: Array<{ agent: string; path: string; installedAt: string }>): void {
  writeFileSync(INSTALLED_RECORD, JSON.stringify(records, null, 2));
}

export function registerAgentCommand(program: CommandType): void {
  const agentCommand = new Command('agent').description('Install and manage Gotryl Agent Skills');

  agentCommand
    .command('install <agent>')
    .description(`Install a Gotryl skill for a coding agent (${SUPPORTED_AGENTS.join(', ')})`)
    .option('--output <format>', 'Output format: human or json')
    .option('--dry-run', 'Show what would be written without writing')
    .action(async (agentName: string, opts: { output?: string; dryRun?: boolean }) => {
      const format = (opts.output ?? program.opts().output ?? 'human') as OutputFormat;

      if (!SUPPORTED_AGENTS.includes(agentName as AgentName)) {
        printError('INVALID_AGENT', `Unknown agent "${agentName}". Supported: ${SUPPORTED_AGENTS.join(', ')}`, format);
        process.exit(2);
      }

      const agent = agentName as AgentName;
      const filename = SKILL_FILENAME[agent];
      const destPath = resolve(process.cwd(), filename);
      const content = buildSkillContent(agent);

      if (opts.dryRun) {
        printResult({ dryRun: true, agent, path: destPath, bytes: content.length }, format);
        process.exit(0);
      }

      // Ensure parent directory exists for nested paths (e.g. .cursor/rules/)
      const { mkdirSync } = await import('node:fs');
      const { dirname } = await import('node:path');
      mkdirSync(dirname(destPath), { recursive: true });

      writeFileSync(destPath, content, 'utf8');

      const records = loadInstalled().filter((r) => r.agent !== agent);
      records.push({ agent, path: destPath, installedAt: new Date().toISOString() });
      saveInstalled(records);

      if (format === 'json') {
        printResult({ agent, path: destPath, installedAt: records.at(-1)!.installedAt }, format);
      } else {
        console.log(`Installed Gotryl skill for ${agent} → ${destPath}`);
      }
    });

  agentCommand
    .command('list')
    .description('List installed Gotryl Agent Skills')
    .option('--output <format>', 'Output format: human or json')
    .action((_opts: { output?: string }) => {
      const format = (_opts.output ?? program.opts().output ?? 'human') as OutputFormat;
      const records = loadInstalled();
      if (format === 'json') {
        printResult(records, format);
      } else {
        if (records.length === 0) {
          console.log('No Gotryl agent skills installed. Run `gotryl agent install <agent>` to get started.');
        } else {
          for (const r of records) {
            const exists = existsSync(r.path) ? '' : ' (missing)';
            console.log(`${r.agent}  ${r.path}${exists}`);
          }
        }
      }
    });

  program.addCommand(agentCommand);
}
