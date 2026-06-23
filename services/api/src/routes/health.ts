import type { FastifyPluginAsync } from 'fastify';

export const healthRoute: FastifyPluginAsync = async (app) => {
  app.get('/v1/health', async () => ({
    status: 'ok',
    version: process.env.npm_package_version ?? '0.1.0',
  }));
};
