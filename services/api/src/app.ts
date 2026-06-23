import Fastify from 'fastify';
import { healthRoute } from './routes/health.js';
import { authRoute } from './routes/auth.js';
import { projectsRoute } from './routes/projects.js';
import { testsRoute } from './routes/tests.js';
import { runsRoute } from './routes/runs.js';
import { authenticate } from './plugins/authenticate.js';
import { sql } from './db/client.js';
import { startRunWorker } from './queue/worker.js';

export async function buildApp() {
  if (!process.env.INTERNAL_SERVICE_SECRET) {
    throw new Error('INTERNAL_SERVICE_SECRET is required');
  }
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is required');
  }
  if (!process.env.EXECUTOR_URL) {
    throw new Error('EXECUTOR_URL is required');
  }

  const app = Fastify({ logger: true });

  app.addHook('onRequest', authenticate);

  await app.register(healthRoute);
  await app.register(authRoute);
  await app.register(projectsRoute);
  await app.register(testsRoute);
  await app.register(runsRoute);

  const worker = startRunWorker();

  app.addHook('onClose', async () => {
    await worker.close();
    await sql.end();
  });

  return app;
}
