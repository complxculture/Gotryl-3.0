import { GotrylError } from './errors.js';
import type { FailureBundle, Project, Run, RunStatus, Test } from './types.js';

type RequestFn = <T>(method: string, path: string, body?: unknown, extraHeaders?: Record<string, string>) => Promise<T>;

class AuthResource {
  constructor(private req: RequestFn) {}

  getMe(): Promise<{ accountId: string; email: string; createdAt: string }> {
    return this.req('GET', '/v1/auth/me');
  }
}

class ProjectsResource {
  constructor(private req: RequestFn) {}

  create(body: { name: string }): Promise<Project> {
    return this.req('POST', '/v1/projects', body);
  }

  list(): Promise<Project[]> {
    return this.req('GET', '/v1/projects');
  }

  get(id: string): Promise<Project> {
    return this.req('GET', `/v1/projects/${id}`);
  }

  update(id: string, body: { name: string }): Promise<Project> {
    return this.req('PATCH', `/v1/projects/${id}`, body);
  }
}

class TestsResource {
  constructor(private req: RequestFn) {}

  create(body: { projectId: string; description: string }): Promise<Test> {
    return this.req('POST', '/v1/tests', body);
  }

  list(projectId: string): Promise<Test[]> {
    return this.req('GET', `/v1/tests?projectId=${encodeURIComponent(projectId)}`);
  }

  get(id: string): Promise<Test> {
    return this.req('GET', `/v1/tests/${id}`);
  }

  update(id: string, body: Partial<{ description: string }>): Promise<Test> {
    return this.req('PATCH', `/v1/tests/${id}`, body);
  }

  delete(id: string): Promise<void> {
    return this.req('DELETE', `/v1/tests/${id}`);
  }

  createBatch(body: { projectId: string; tests: Array<{ description: string }> }): Promise<Test[]> {
    return this.req('POST', '/v1/tests/batch', body);
  }

  getCode(id: string): Promise<{ code: string; etag: string }> {
    return this.req('GET', `/v1/tests/${id}/code`);
  }

  putCode(id: string, code: string, ifMatch: string): Promise<{ code: string; etag: string }> {
    return this.req('PUT', `/v1/tests/${id}/code`, { code }, { 'If-Match': ifMatch });
  }

  getSteps(id: string): Promise<Array<{ step: number; screenshotUrl: string; domSnapshotUrl: string }>> {
    return this.req('GET', `/v1/tests/${id}/steps`);
  }
}

class RunsResource {
  constructor(private req: RequestFn) {}

  create(body: { testId: string; targetUrl: string; runId?: string }): Promise<Run> {
    return this.req('POST', '/v1/runs', body);
  }

  get(id: string): Promise<Run> {
    return this.req('GET', `/v1/runs/${id}`);
  }

  list(testId: string): Promise<Run[]> {
    return this.req('GET', `/v1/runs?testId=${encodeURIComponent(testId)}`);
  }
}

class FailuresResource {
  constructor(private req: RequestFn) {}

  get(testId: string): Promise<FailureBundle> {
    return this.req('GET', `/v1/failures/${testId}`);
  }

  getSummary(testId: string): Promise<{
    rootCauseHypothesis: string;
    fixTarget: unknown;
    failingStep: unknown;
  }> {
    return this.req('GET', `/v1/failures/${testId}/summary`);
  }

  /** @param runId - A Run ID (`run_…`), not a Test ID (`tst_…`) */
  getArtifacts(runId: string): Promise<FailureBundle> {
    return this.req('GET', `/v1/artifacts/${runId}`);
  }
}

export class GotrylClient {
  private apiKey: string;
  private baseUrl: string;
  private timeoutMs: number;

  auth: AuthResource;
  projects: ProjectsResource;
  tests: TestsResource;
  runs: RunsResource;
  failures: FailuresResource;

  constructor(opts: { apiKey: string; baseUrl: string; timeoutMs?: number }) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl.replace(/\/$/, ''); // strip trailing slash to avoid double-slash paths
    this.timeoutMs = opts.timeoutMs ?? 30_000;
    const req = this.request.bind(this) as RequestFn;
    this.auth = new AuthResource(req);
    this.projects = new ProjectsResource(req);
    this.tests = new TestsResource(req);
    this.runs = new RunsResource(req);
    this.failures = new FailuresResource(req);
  }

  private async request<T>(method: string, path: string, body?: unknown, extraHeaders?: Record<string, string>): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        // omit Content-Type on bodyless requests — avoids CORS preflights on GET/DELETE
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...extraHeaders,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!res.ok) {
      let envelope: { error: { code: string; message: string; details?: unknown } };
      try {
        const raw: unknown = await res.json();
        if (raw && typeof raw === 'object' && 'error' in raw && (raw as { error: unknown }).error) {
          envelope = raw as typeof envelope;
        } else {
          envelope = { error: { code: 'UNKNOWN_ERROR', message: `HTTP ${res.status}` } };
        }
      } catch {
        // body was not JSON (e.g. HTML error page from gateway), or HTTP/2 with empty statusText
        envelope = { error: { code: 'UNKNOWN_ERROR', message: `HTTP ${res.status}` } };
      }
      throw new GotrylError(res.status, envelope);
    }

    // Treat any empty body as void — covers 204, 201/202 with no payload, and content-length: 0
    if (res.status === 204 || res.headers.get('content-length') === '0') return undefined as T;
    const text = await res.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }
}
