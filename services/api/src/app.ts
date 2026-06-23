import Fastify from 'fastify';
import { healthRoute } from './routes/health.js';
import { authRoute } from './routes/auth.js';
import { projectsRoute } from './routes/projects.js';
import { testsRoute } from './routes/tests.js';
import { authenticate } from './plugins/authenticate.js';
import { sql } from './db/client.js';

export async function buildApp() {
  if (!process.env.INTERNAL_SERVICE_SECRET) {
    throw new Error('INTERNAL_SERVICE_SECRET is required');
  }

  const app = Fastify({ logger: true });

  app.addHook('onRequest', authenticate);

  await app.register(healthRoute);
  await app.register(authRoute);
  await app.register(projectsRoute);
  await app.register(testsRoute);

  app.addHook('onClose', async () => {
    await sql.end();
  });

  return app;
}
