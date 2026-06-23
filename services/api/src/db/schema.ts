import { pgTable, text, timestamp, index, integer } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey().$defaultFn(() => `key_${nanoid(16)}`),
  accountId: text('account_id').notNull(),
  email: text('email').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => `prj_${nanoid(16)}`),
  accountId: text('account_id').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  accountIdIdx: index('projects_account_id_idx').on(t.accountId),
}));

export const tests = pgTable('tests', {
  id: text('id').primaryKey().$defaultFn(() => `tst_${nanoid(16)}`),
  projectId: text('project_id').notNull(),
  accountId: text('account_id').notNull(),
  description: text('description').notNull(),
  generatedCode: text('generated_code'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  projectIdIdx: index('tests_project_id_idx').on(t.projectId),
  accountIdIdx: index('tests_account_id_idx').on(t.accountId),
}));

export const runs = pgTable('runs', {
  id: text('id').primaryKey().$defaultFn(() => `run_${nanoid(16)}`),
  testId: text('test_id').notNull(),
  accountId: text('account_id').notNull(),
  targetUrl: text('target_url').notNull(),
  status: text('status').notNull().default('queued'),
  durationMs: integer('duration_ms'),
  stdout: text('stdout'),
  stderr: text('stderr'),
  error: text('error'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  testIdIdx: index('runs_test_id_idx').on(t.testId),
  accountIdIdx: index('runs_account_id_idx').on(t.accountId),
  statusIdx: index('runs_status_idx').on(t.status),
}));
