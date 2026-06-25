#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { GotrylClient, GotrylError } from '@gotryl/sdk';

// ── Client setup ─────────────────────────────────────────────────────────────

const API_KEY = process.env.API_KEY ?? process.env.GOTRYL_API_KEY ?? '';
const BASE_URL = process.env.GOTRYL_API_URL ?? 'https://api.gotryl.com';

function getClient(): GotrylClient {
  if (!API_KEY) throw new Error('API_KEY environment variable is required');
  return new GotrylClient({ apiKey: API_KEY, baseUrl: BASE_URL, timeoutMs: 60_000 });
}

// ── Filesystem helpers ────────────────────────────────────────────────────────

const GOTRYL_DIR = 'gotryl_tests';
const TMP_DIR = join(GOTRYL_DIR, 'tmp');

function ensureDirs() {
  mkdirSync(TMP_DIR, { recursive: true });
}

function writeJson(relPath: string, data: unknown): string {
  ensureDirs();
  const abs = resolve(process.cwd(), relPath);
  mkdirSync(resolve(abs, '..'), { recursive: true });
  writeFileSync(abs, JSON.stringify(data, null, 2));
  return abs;
}

function scanProjectFiles(projectPath: string, extensions: string[], maxFiles = 30): string[] {
  const results: string[] = [];

  function walk(dir: string, depth: number) {
    if (depth > 4 || results.length >= maxFiles) return;
    let entries: string[];
    try { entries = readdirSync(dir); } catch { return; }
    for (const entry of entries) {
      if (entry.startsWith('.') || entry === 'node_modules' || entry === 'dist' || entry === 'build') continue;
      const full = join(dir, entry);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (st.isDirectory()) {
        walk(full, depth + 1);
      } else if (extensions.some((ext) => entry.endsWith(ext))) {
        results.push(full);
      }
    }
  }

  walk(projectPath, 0);
  return results;
}

function detectFramework(projectPath: string): { name: string; version?: string } {
  const pkgPath = join(projectPath, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['next']) return { name: 'Next.js', version: deps['next'] };
      if (deps['nuxt']) return { name: 'Nuxt', version: deps['nuxt'] };
      if (deps['@angular/core']) return { name: 'Angular', version: deps['@angular/core'] };
      if (deps['react']) return { name: 'React', version: deps['react'] };
      if (deps['svelte']) return { name: 'Svelte', version: deps['svelte'] };
      if (deps['express']) return { name: 'Express', version: deps['express'] };
      if (deps['fastify']) return { name: 'Fastify', version: deps['fastify'] };
    } catch { /* ignore */ }
  }
  const reqTxt = join(projectPath, 'requirements.txt');
  if (existsSync(reqTxt)) {
    const content = readFileSync(reqTxt, 'utf8');
    if (content.includes('django')) return { name: 'Django' };
    if (content.includes('flask')) return { name: 'Flask' };
    if (content.includes('fastapi')) return { name: 'FastAPI' };
  }
  return { name: 'unknown' };
}

// ── Active tunnel (5.4) ──────────────────────────────────────────────────────

interface TunnelHandle {
  url: string;
  close: () => void;
}

let _activeTunnel: TunnelHandle | null = null;

async function startTunnel(port: number): Promise<string> {
  const { default: localtunnel } = await import('localtunnel');
  const tunnel = await localtunnel({ port });
  _activeTunnel?.close();
  _activeTunnel = { url: tunnel.url, close: () => tunnel.close() };
  return tunnel.url;
}

// ── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: 'gotryl_bootstrap_tests',
    description: 'Register a Gotryl project and optionally start a localtunnel for localhost testing. Returns projectId and optionally tunnelUrl.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string', description: 'Name for the new project (or existing project name if projectId provided)' },
        projectId: { type: 'string', description: 'Existing project ID (if omitted, a new project is created)' },
        localPort: { type: 'number', description: 'Local port to tunnel — enables localhost testing' },
      },
    },
  },
  {
    name: 'gotryl_generate_code_summary',
    description: 'Scan project source files and write a structured summary to gotryl_tests/tmp/code_summary.json.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Path to the project root (defaults to cwd)' },
      },
    },
  },
  {
    name: 'gotryl_generate_standardized_prd',
    description: 'Generate a normalized PRD scaffold from code analysis and write to gotryl_tests/standard_prd.json.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Path to the project root (defaults to cwd)' },
      },
    },
  },
  {
    name: 'gotryl_generate_frontend_test_plan',
    description: 'Generate a frontend test plan scaffold (UI flows, forms, auth) and write to gotryl_tests/tmp/frontend_test_plan.json.',
    inputSchema: {
      type: 'object',
      required: ['projectId'],
      properties: {
        projectId: { type: 'string', description: 'Gotryl project ID' },
      },
    },
  },
  {
    name: 'gotryl_generate_backend_test_plan',
    description: 'Generate a backend test plan scaffold (API endpoints, DB ops, error scenarios) and write to gotryl_tests/tmp/backend_test_plan.json.',
    inputSchema: {
      type: 'object',
      required: ['projectId'],
      properties: {
        projectId: { type: 'string', description: 'Gotryl project ID' },
      },
    },
  },
  {
    name: 'gotryl_generate_code_and_execute',
    description: 'Create a test, run it against targetUrl, wait for completion, and return the result with optional failure analysis.',
    inputSchema: {
      type: 'object',
      required: ['projectId', 'testDescription', 'targetUrl'],
      properties: {
        projectId: { type: 'string', description: 'Gotryl project ID' },
        testDescription: { type: 'string', description: 'Natural language description of what to test' },
        targetUrl: { type: 'string', description: 'HTTPS URL to run the test against' },
      },
    },
  },
  {
    name: 'gotryl_open_test_result_dashboard',
    description: 'Return the dashboard URL for a project and open it in the system default browser.',
    inputSchema: {
      type: 'object',
      required: ['projectId'],
      properties: {
        projectId: { type: 'string', description: 'Gotryl project ID' },
      },
    },
  },
  {
    name: 'gotryl_rerun_tests',
    description: 'Rerun all existing tests for a project against targetUrl and return aggregated pass/fail results.',
    inputSchema: {
      type: 'object',
      required: ['projectId', 'targetUrl'],
      properties: {
        projectId: { type: 'string', description: 'Gotryl project ID' },
        targetUrl: { type: 'string', description: 'HTTPS URL to test against' },
      },
    },
  },
];

// ── Tool handlers ─────────────────────────────────────────────────────────────

async function handleTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const client = getClient();

  switch (name) {
    case 'gotryl_bootstrap_tests': {
      let projectId = args['projectId'] as string | undefined;
      let project;
      if (projectId) {
        project = await client.projects.get(projectId);
      } else {
        const pName = (args['projectName'] as string | undefined) ?? 'gotryl-project';
        project = await client.projects.create({ name: pName });
        projectId = project.id;
      }

      const result: Record<string, unknown> = {
        projectId,
        projectName: project.name,
        dashboardUrl: `${BASE_URL.replace(/^https:\/\/api\./, 'https://')}/projects/${projectId}`,
      };

      const localPort = args['localPort'] as number | undefined;
      if (localPort) {
        try {
          result['tunnelUrl'] = await startTunnel(localPort);
        } catch (e) {
          result['tunnelError'] = `Cannot connect to localhost:${localPort}: ${String(e)}`;
        }
      }

      return result;
    }

    case 'gotryl_generate_code_summary': {
      const projectPath = resolve(process.cwd(), (args['projectPath'] as string | undefined) ?? '.');
      const framework = detectFramework(projectPath);
      const sourceFiles = scanProjectFiles(projectPath, ['.ts', '.tsx', '.js', '.jsx', '.py', '.vue', '.svelte']);
      const configFiles = ['package.json', 'pyproject.toml', 'requirements.txt', 'next.config.ts', 'next.config.js', 'vite.config.ts']
        .filter((f) => existsSync(join(projectPath, f)));

      const summary = {
        generatedAt: new Date().toISOString(),
        framework,
        sourceFiles: sourceFiles.map((f) => f.replace(projectPath + '/', '')),
        configFiles,
        featureMap: 'TODO: review source files and describe features',
        architectureNotes: 'TODO: describe the architecture based on source files',
      };

      const outPath = writeJson(join(TMP_DIR, 'code_summary.json'), summary);
      return { path: outPath, summary };
    }

    case 'gotryl_generate_standardized_prd': {
      const projectPath = resolve(process.cwd(), (args['projectPath'] as string | undefined) ?? '.');
      const codeSummaryPath = join(process.cwd(), TMP_DIR, 'code_summary.json');
      let codeSummary: unknown = null;
      if (existsSync(codeSummaryPath)) {
        try { codeSummary = JSON.parse(readFileSync(codeSummaryPath, 'utf8')); } catch { /* ignore */ }
      }

      const prd = {
        generatedAt: new Date().toISOString(),
        projectPath,
        codeSummary,
        userStories: [] as string[],
        features: [] as string[],
        acceptanceCriteria: [] as string[],
        notes: 'Review gotryl_tests/tmp/code_summary.json and fill in userStories, features, and acceptanceCriteria.',
      };

      const outPath = writeJson(join(GOTRYL_DIR, 'standard_prd.json'), prd);
      return { path: outPath, prd };
    }

    case 'gotryl_generate_frontend_test_plan': {
      const projectId = args['projectId'] as string;
      const existing = await client.tests.list(projectId);
      const plan = {
        generatedAt: new Date().toISOString(),
        projectId,
        existingTestCount: existing.length,
        uiFlows: [] as string[],
        formTests: [] as string[],
        authFlows: [] as string[],
        notes: 'Fill in uiFlows, formTests, and authFlows from standard_prd.json, then use gotryl_generate_code_and_execute to run each.',
      };
      const outPath = writeJson(join(TMP_DIR, 'frontend_test_plan.json'), plan);
      return { path: outPath, plan };
    }

    case 'gotryl_generate_backend_test_plan': {
      const projectId = args['projectId'] as string;
      const existing = await client.tests.list(projectId);
      const plan = {
        generatedAt: new Date().toISOString(),
        projectId,
        existingTestCount: existing.length,
        apiEndpoints: [] as string[],
        dbOperations: [] as string[],
        errorScenarios: [] as string[],
        notes: 'Fill in endpoints and scenarios from standard_prd.json, then use gotryl_generate_code_and_execute.',
      };
      const outPath = writeJson(join(TMP_DIR, 'backend_test_plan.json'), plan);
      return { path: outPath, plan };
    }

    case 'gotryl_generate_code_and_execute': {
      const projectId = args['projectId'] as string;
      const testDescription = args['testDescription'] as string;
      const targetUrl = args['targetUrl'] as string;

      const test = await client.tests.create({ projectId, description: testDescription });
      let run = await client.runs.create({ testId: test.id, targetUrl });

      const TERMINAL = new Set(['passed', 'failed', 'error', 'cancelled']);
      while (!TERMINAL.has(run.status)) {
        await new Promise<void>((r) => setTimeout(r, 2000));
        run = await client.runs.get(run.id);
      }

      const result: Record<string, unknown> = {
        testId: test.id,
        runId: run.id,
        status: run.status,
        durationMs: run.durationMs,
        passCount: run.status === 'passed' ? 1 : 0,
        failCount: run.status === 'failed' ? 1 : 0,
        reportPath: `${BASE_URL.replace(/^https:\/\/api\./, 'https://')}/projects/${projectId}/runs/${run.id}`,
      };

      if (run.status === 'failed') {
        try {
          const bundle = await client.failures.get(test.id);
          result['rootCauseHypothesis'] = bundle.rootCauseHypothesis;
          result['fixTarget'] = bundle.fixTarget;
          result['failingStep'] = bundle.failingStep;
        } catch { /* bundle may not be available yet */ }
      }

      return result;
    }

    case 'gotryl_open_test_result_dashboard': {
      const projectId = args['projectId'] as string;
      const dashboardUrl = `${BASE_URL.replace(/^https:\/\/api\./, 'https://')}/projects/${projectId}`;
      try {
        const { default: open } = await import('open');
        await open(dashboardUrl);
      } catch { /* ignore — URL still returned */ }
      return { projectId, dashboardUrl };
    }

    case 'gotryl_rerun_tests': {
      const projectId = args['projectId'] as string;
      const targetUrl = args['targetUrl'] as string;
      const tests = await client.tests.list(projectId);

      const TERMINAL = new Set(['passed', 'failed', 'error', 'cancelled']);
      const results = await Promise.all(
        tests.map(async (test) => {
          let run = await client.runs.create({ testId: test.id, targetUrl });
          while (!TERMINAL.has(run.status)) {
            await new Promise<void>((r) => setTimeout(r, 2000));
            run = await client.runs.get(run.id);
          }
          return { testId: test.id, description: test.description, runId: run.id, status: run.status, durationMs: run.durationMs };
        }),
      );

      const passCount = results.filter((r) => r.status === 'passed').length;
      const failCount = results.filter((r) => r.status !== 'passed').length;
      return { projectId, totalTests: tests.length, passCount, failCount, results };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── Server bootstrap ─────────────────────────────────────────────────────────

const server = new Server(
  { name: 'gotryl', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: rawArgs } = request.params;
  const args = (rawArgs ?? {}) as Record<string, unknown>;

  try {
    const result = await handleTool(name, args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    const msg = err instanceof GotrylError ? `GotrylError ${err.code}: ${err.message}` : String(err);
    return {
      content: [{ type: 'text', text: `Error: ${msg}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
