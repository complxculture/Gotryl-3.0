import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import { db } from '../db/client.js';
import { projects } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const CreateProjectBody = z.object({ name: z.string().trim().min(1).max(255) });
const UpdateProjectBody = z.object({ name: z.string().trim().min(1).max(255) });

export const projectsRoute: FastifyPluginAsync = async (app) => {
  app.post('/v1/projects', async (request, reply) => {
    const parsed = CreateProjectBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid request body' },
      });
    }
    const { name } = parsed.data;
    try {
      const [inserted] = await db
        .insert(projects)
        .values({ accountId: request.account.accountId, name })
        .returning();
      return reply.code(201).send(inserted);
    } catch {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  });

  app.get('/v1/projects', async (request, reply) => {
    try {
      const rows = await db
        .select()
        .from(projects)
        .where(eq(projects.accountId, request.account.accountId));
      return reply.send(rows);
    } catch {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  });

  app.get('/v1/projects/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, id), eq(projects.accountId, request.account.accountId)))
        .limit(1);
      if (!project) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
      }
      return reply.send(project);
    } catch {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  });

  app.patch('/v1/projects/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = UpdateProjectBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid request body' },
      });
    }
    const { name } = parsed.data;
    try {
      const [updated] = await db
        .update(projects)
        .set({ name, updatedAt: new Date() })
        .where(and(eq(projects.id, id), eq(projects.accountId, request.account.accountId)))
        .returning();
      if (!updated) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
      }
      return reply.send(updated);
    } catch {
      return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  });
};
