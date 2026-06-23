import Fastify from 'fastify';
import { healthRoute } from './routes/health.js';
import { sql } from './db/client.js';

export async function buildApp() {
  const app = Fastify({ logger: true });
  await app.register(healthRoute);

  app.addHook('onClose', async () => {
    await sql.end();
  });

  return app;
}
