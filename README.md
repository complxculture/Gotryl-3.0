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
# Enter your API key when prompted (get one at gotryl.com)
```

### Run your first test

```bash
# Create a project
gotryl project create --name "My App"
# → Created project: My App (prj_xxxxxxxxxxxx)

# Create a test
gotryl test create \
  --project prj_xxxxxxxxxxxx \
  --description "user can sign up with email and see the dashboard"
# → Created test tst_xxxxxxxxxxxx

# Run it
gotryl test run tst_xxxxxxxxxxxx \
  --target-url https://myapp.com \
  --wait
# → ✓ Run passed (4231ms)
```

---

## CLI reference

```
gotryl project create  --name <name>
gotryl project list

gotryl test create     --project <id> --description <text>
gotryl test list       --project <id>
gotryl test run        <testId> --target-url <url> [--wait] [--output json]

gotryl run list        --test <id>
gotryl run get         <runId>

gotryl setup           [--from-env] [--yes]
```

Pass `--output json` to any command for machine-readable output.

---

## CI/CD — GitHub Actions

Copy [`examples/gotryl-ci.yml`](examples/gotryl-ci.yml) into your `.github/workflows/` directory.

Add two secrets/variables to your repository:

| Name | Where | Value |
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
- A domain with Cloudflare DNS (Flexible SSL mode)
- Cloudflare R2 bucket for artifact storage (screenshots, video)

### Environment variables

Create a `.env` file at the repo root:

```env
DATABASE_URL=postgresql://gotryl:password@postgres:5432/gotryl
REDIS_URL=redis://redis:6379
ANTHROPIC_API_KEY=sk-ant-...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=gotryl-artifacts
R2_PUBLIC_URL=https://pub-xxxx.r2.dev
JWT_SECRET=change-me-32-chars-minimum
DOMAIN=gotryl.com
```

### Deploy

```bash
docker compose -f docker-compose.prod.yml up -d
```

Services: `postgres`, `redis`, `migrate` (runs once), `api`, `executor`, `dashboard`, `caddy`

Only Caddy exposes ports 80/443. Configure Cloudflare to proxy your domain to the server IP in Flexible SSL mode.

---

## Local development

```bash
# Prerequisites: Node 20+, pnpm 9+, Docker

pnpm install

# Start dependencies
docker compose up -d postgres redis

# Run migrations
pnpm --filter @gotryl/api db:migrate

# Start services
pnpm --filter @gotryl/api dev       # http://localhost:3001
pnpm --filter @gotryl/dashboard dev # http://localhost:3000
```

The executor runs as a Docker container — build it with `docker compose build executor`.

---

## License

MIT
