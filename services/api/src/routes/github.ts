import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { App } from '@octokit/app';
import { db } from '../db/client.js';
import { githubIntegrations, tests, runs } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { runQueue } from '../queue/client.js';

function getGitHubApp(): App | null {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!appId || !privateKey) return null;
  return new App({ appId, privateKey, webhooks: { secret: process.env.GITHUB_WEBHOOK_SECRET ?? '' } });
}

function verifyWebhookSignature(body: string, signature: string | undefined): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

async function postOrUpdatePrComment(
  octokit: Awaited<ReturnType<App['getInstallationOctokit']>>,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
) {
  const BOT_MARKER = '<!-- gotryl-bot -->';
  const comments = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}/comments', {
    owner,
    repo,
    issue_number: pullNumber,
    per_page: 100,
  });

  const existing = (comments.data as Array<{ id: number; body?: string }>).find((c) => c.body?.includes(BOT_MARKER));
  const fullBody = `${BOT_MARKER}\n${body}`;

  if (existing) {
    await octokit.request('PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}', {
      owner, repo, comment_id: existing.id, body: fullBody,
    });
  } else {
    await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
      owner, repo, issue_number: pullNumber, body: fullBody,
    });
  }
}

const CreateIntegrationBody = z.object({
  projectId: z.string().min(1),
  repoFullName: z.string().regex(/^[\w.-]+\/[\w.-]+$/, 'Must be in "owner/repo" format'),
  installationId: z.string().min(1),
  targetUrl: z.string().url(),
});

export const githubRoute: FastifyPluginAsync = async (app) => {
  // Capture the raw request body as a string before JSON parsing so the webhook
  // handler can verify the HMAC signature against the exact bytes GitHub signed.
  app.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
    (req as FastifyRequest & { rawBody: string }).rawBody = body as string;
    try {
      done(null, JSON.parse(body as string));
    } catch (e) {
      done(e as Error, undefined);
    }
  });

  // POST /v1/github/integrations — link a project to a GitHub repo
  app.post('/v1/github/integrations', async (request, reply) => {
    const parsed = CreateIntegrationBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid body' } });
    }
    const { projectId, repoFullName, installationId, targetUrl } = parsed.data;
    const accountId = request.account.accountId;

    try {
      const [existing] = await db
        .select({ id: githubIntegrations.id })
        .from(githubIntegrations)
        .where(eq(githubIntegrations.projectId, projectId))
        .limit(1);

      let integration;
      let statusCode: 200 | 201;
      if (existing) {
        [integration] = await db
          .update(githubIntegrations)
          .set({ repoFullName, installationId, targetUrl, updatedAt: new Date() })
          .where(eq(githubIntegrations.id, existing.id))
          .returning();
        statusCode = 200;
      } else {
        [integration] = await db
          .insert(githubIntegrations)
          .values({ accountId, projectId, repoFullName, installationId, targetUrl })
          .returning();
        statusCode = 201;
      }

      return reply.code(statusCode).send(integration);
    } catch {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  });

  // POST /v1/github/webhook — receives GitHub PR/push events
  app.post('/v1/github/webhook', async (request, reply) => {
    const signature = request.headers['x-hub-signature-256'] as string | undefined;
    // Use the captured raw body string for HMAC — JSON.stringify of a parsed object
    // can differ from GitHub's exact bytes (Unicode escapes, key ordering).
    const rawBody = (request as FastifyRequest & { rawBody?: string }).rawBody ?? JSON.stringify(request.body);

    if (!verifyWebhookSignature(rawBody, signature)) {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid webhook signature' } });
    }

    const event = request.headers['x-github-event'] as string | undefined;
    const payload = request.body as Record<string, unknown>;

    // Respond immediately — process async
    void (async () => {
      try {
        if (event !== 'pull_request') return;

        const action = payload['action'] as string;
        if (!['opened', 'synchronize', 'reopened'].includes(action)) return;

        const pr = payload['pull_request'] as Record<string, unknown>;
        const prNumber = pr['number'] as number;
        const repoObj = payload['repository'] as Record<string, unknown>;
        const repoFullName = repoObj['full_name'] as string;
        const [owner, repo] = repoFullName.split('/');

        if (!owner || !repo) return;

        const [integration] = await db
          .select()
          .from(githubIntegrations)
          .where(eq(githubIntegrations.repoFullName, repoFullName))
          .limit(1);

        if (!integration) return;

        const ghApp = getGitHubApp();
        if (!ghApp) {
          app.log.warn('GitHub App not configured — GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY missing');
          return;
        }

        const octokit = await ghApp.getInstallationOctokit(parseInt(integration.installationId, 10));

        const projectTests = await db
          .select({ id: tests.id, description: tests.description, generatedCode: tests.generatedCode })
          .from(tests)
          .where(eq(tests.projectId, integration.projectId));

        if (projectTests.length === 0) {
          await postOrUpdatePrComment(octokit, owner, repo, prNumber, '**Gotryl**: No tests found for this project.');
          return;
        }

        // Kick off runs
        await postOrUpdatePrComment(octokit, owner, repo, prNumber,
          `**Gotryl**: Running ${projectTests.length} test(s) against \`${integration.targetUrl}\`…`);

        const TERMINAL = new Set(['passed', 'failed', 'error', 'cancelled']);
        const baseUrl = process.env.DASHBOARD_URL ?? 'https://app.gotryl.com';
        const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

        const results = await Promise.all(
          projectTests.map(async (t) => {
            const [run] = await db.insert(runs).values({
              testId: t.id,
              accountId: integration.accountId,
              targetUrl: integration.targetUrl,
            }).returning();

            try {
              await runQueue.add(
                'execute',
                {
                  runId: run.id,
                  testId: t.id,
                  testDescription: t.description,
                  testCode: t.generatedCode,
                  targetUrl: integration.targetUrl,
                },
                { jobId: run.id },
              );
            } catch (queueErr) {
              await db.delete(runs).where(eq(runs.id, run.id));
              throw queueErr;
            }

            // Poll until done with a 10-minute hard deadline
            let current = run!;
            const deadline = Date.now() + POLL_TIMEOUT_MS;
            while (!TERMINAL.has(current.status)) {
              if (Date.now() >= deadline) {
                app.log.warn({ runId: current.id }, 'github webhook: poll deadline exceeded');
                return { testId: t.id, description: t.description, runId: current.id, status: 'error' as const };
              }
              await new Promise<void>((r) => setTimeout(r, 3000));
              const [updated] = await db
                .select()
                .from(runs)
                .where(eq(runs.id, current.id))
                .limit(1);
              if (updated) current = updated;
            }

            return { testId: t.id, description: t.description, runId: current.id, status: current.status };
          }),
        );

        const passed = results.filter((r) => r.status === 'passed').length;
        const failed = results.length - passed;
        const icon = failed === 0 ? '✅' : '❌';

        const lines = [
          `${icon} **Gotryl**: ${passed}/${results.length} tests passed`,
          '',
          '| Test | Status | Run |',
          '|------|--------|-----|',
          ...results.map((r) => {
            const statusIcon = r.status === 'passed' ? '✅' : '❌';
            const runLink = `[${r.runId}](${baseUrl}/projects/${integration.projectId}/runs/${r.runId})`;
            return `| ${r.description.slice(0, 60)} | ${statusIcon} ${r.status} | ${runLink} |`;
          }),
        ];

        // Append root-cause for failed tests
        for (const r of results.filter((x) => x.status === 'failed')) {
          const [latestRun] = await db
            .select({ snapshotId: runs.snapshotId })
            .from(runs)
            .where(and(eq(runs.testId, r.testId), eq(runs.status, 'failed')))
            .orderBy(desc(runs.createdAt))
            .limit(1);

          if (latestRun?.snapshotId) {
            lines.push('', `**${r.description.slice(0, 60)}** failure details available in [dashboard](${baseUrl}/projects/${integration.projectId}/runs/${r.runId}).`);
          }
        }

        await postOrUpdatePrComment(octokit, owner, repo, prNumber, lines.join('\n'));
      } catch (err) {
        app.log.error({ event: 'github.webhook.error', err: String(err) });
      }
    })();

    return reply.code(200).send({ ok: true });
  });
};
