'use server';
import { redirect } from 'next/navigation';
import { getClient } from '@/lib/session';

export async function createProjectAction(formData: FormData): Promise<void> {
  const name = (formData.get('name') as string)?.trim();
  if (!name) return;
  const client = getClient();
  await client.projects.create({ name });
  redirect('/projects');
}

export async function createTestAction(formData: FormData): Promise<void> {
  const projectId = formData.get('projectId') as string;
  const description = (formData.get('description') as string)?.trim();
  if (!description || !projectId) return;
  const client = getClient();
  await client.tests.create({ projectId, description });
  redirect(`/projects/${projectId}/tests`);
}

export async function createRunAction(formData: FormData): Promise<void> {
  const testId = formData.get('testId') as string;
  const projectId = formData.get('projectId') as string;
  const targetUrl = (formData.get('targetUrl') as string)?.trim();
  if (!testId || !targetUrl) return;
  const client = getClient();
  const run = await client.runs.create({ testId, targetUrl });
  redirect(`/projects/${projectId}/runs/${run.id}`);
}
