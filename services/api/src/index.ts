import { buildApp } from './app.js';

const port = parseInt(process.env.PORT ?? '3001', 10);
const host = process.env.HOST ?? '0.0.0.0';

const app = await buildApp();

const shutdown = async () => {
  await app.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
