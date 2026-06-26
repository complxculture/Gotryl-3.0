# Gotryl

AI-powered cloud testing. Describe what to test in plain English — Gotryl generates the Playwright code, runs it in the cloud, and returns screenshots, video, and AI-diagnosed failure reports.

**Live:** [gotryl.com](https://gotryl.com) · API: `https://api.gotryl.com`

---

## How it works

1. **Describe** — Write what you want to test in plain English
2. **Generate** — Claude AI writes a Python Playwright test tailored to your description and target URL
3. **Run** — Tests execute in isolated cloud containers (no local Playwright needed)
4. **Diagnose** — Failures return screenshots, video recordings, and AI root-cause analysis

---

## Quick start

### Install the CLI

```bash
npm install -g @gotryl/cli
```

### Authenticate

```bash
gotryl setup
# Enter your API key when prompted (get one at gotryl.com → Settings → API Keys)
```

### Run your first test

```bash
# Create a project
gotryl project create --name "My App"
# → Created project: prj_xxxxxxxxxxxx

# Create a test
gotryl test create \
  --project prj_xxxxxxxxxxxx \
  --description "user can sign up with email and see the dashboard"
# → Created test tst_xxxxxxxxxxxx

# Run it and wait for results
gotryl test run tst_xxxxxxxxxxxx \
  --target-url https://myapp.com \
  --wait
# → Run run_xxxxxxxxxxxx: passed (4231ms)
# → Run saved → .gotryl/runs/run_xxxxxxxxxxxx/
```

On a failed run, the CLI prints the AI root-cause hypothesis and saves `summary.md`, `summary.json`, and the browser recording to `.gotryl/runs/<run-id>/`.

---

## CLI reference

### Projects

```
gotryl project create  --name <name>
gotryl project list
gotryl project get     <projectId>
```

### Tests

```
gotryl test create     --project <id> --description <text>
gotryl test list       --project <id>
gotryl test get        <testId>
gotryl test update     <testId> --description <text>
```

### Running tests

```
gotryl test run        <testId> --target-url <url> [--wait] [--output json]
gotryl test run        --project <id> --target-url <url> [--wait]   # run all tests in a project
gotryl test rerun      <testId> [--target-url <url>] [--wait]
gotryl test wait       <runId>                                       # poll an existing run
gotryl test result     <testId> [--history]                          # latest run result
```

### Generated code

```
gotryl test code get   <testId>              # view generated Playwright source
gotryl test code put   <testId> --file <path> --etag <etag>   # replace source
gotryl test code steps <testId>              # list step screenshots/DOM snapshots
```

### Failures & artifacts

```
gotryl test failure get     <testId>         # full AI failure bundle
gotryl test failure summary <testId>         # root cause + fix target only
gotryl test artifact get    <runId>          # download run artifacts
```

### Other

```
gotryl setup           [--from-env] [--yes]  # authenticate
gotryl logout                                # clear saved credentials
```

Pass `--output json` to any command for machine-readable output (useful in scripts and CI).

---

## CI/CD — GitHub Actions

Copy [`examples/gotryl-ci.yml`](examples/gotryl-ci.yml) into your `.github/workflows/` directory.

Add these to your repository secrets/variables:

| Name | Type | Value |
|---|---|---|
| `GOTRYL_API_KEY` | Secret | Your API key |
| `GOTRYL_PROJECT_ID` | Variable | `prj_xxxxxxxxxxxx` |
| `GOTRYL_TARGET_URL` | Variable | `https://myapp.com` |

On every push and pull request, Gotryl runs all tests in the project and posts results as a PR comment.

---

## MCP — Claude Code / Cursor integration

Add Gotryl to your MCP config so Claude Code or Cursor can trigger tests mid-session:

```json
{
  "mcpServers": {
    "gotryl": {
      "command": "npx",
      "args": ["-y", "@gotryl/mcp"],
      "env": {
        "GOTRYL_API_KEY": "gk_your_key_here"
      }
    }
  }
}
```

Available MCP tools: `create_project`, `list_projects`, `create_test`, `list_tests`, `run_test`, `get_run`, `list_runs`.

---

## Monorepo structure

```
packages/
  cli/          @gotryl/cli    — Node.js CLI (commander)
  mcp/          @gotryl/mcp    — MCP server for Claude Code / Cursor
  sdk/          @gotryl/sdk    — TypeScript API client

services/
  api/                         — Fastify 4 REST API (Node 20 + TypeScript)
  dashboard/                   — Next.js 14 web dashboard
  executor/                    — Python 3.12 + Playwright test runner

infra/
  Dockerfile.api
  Dockerfile.dashboard
  Dockerfile.executor
  Caddyfile

examples/
  gotryl-ci.yml               — GitHub Actions workflow
```

**Tech stack:** PostgreSQL 16, Redis + BullMQ v5, Drizzle ORM, pnpm workspaces, NodeNext ESM

---

## Self-hosting

### Prerequisites

- Docker + Docker Compose
- A domain pointing to your server (A record)
- Cloudflare R2 bucket with an API token that has **Admin Read & Write** permissions

### Environment variables

Create a `.env` file at the repo root:

```env
DOMAIN=gotryl.com
POSTGRES_PASSWORD=change-me
INTERNAL_SERVICE_SECRET=change-me-random-32-chars

ANTHROPIC_API_KEY=sk-ant-...

R2_BUCKET=gotryl-artifacts
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

### Deploy

```bash
docker compose -f docker-compose.prod.yml up -d
```

Services: `postgres`, `redis`, `migrate` (runs once on startup), `api`, `executor`, `dashboard`, `caddy`

Caddy automatically provisions a Let's Encrypt TLS certificate for your domain on first request. Only ports 80 and 443 are exposed.

---

## Local development

```bash
# Prerequisites: Node 20+, pnpm 9+, Docker

pnpm install

# Start dependencies
docker compose up -d postgres redis

# Run migrations
pnpm --filter @gotryl/api db:migrate

# Start services (in separate terminals)
pnpm --filter @gotryl/api dev       # http://localhost:3001
pnpm --filter @gotryl/dashboard dev # http://localhost:3000
```

The executor runs as a Docker container — build and start it with:

```bash
docker compose build executor && docker compose up -d executor
```

---

## License

MIT
