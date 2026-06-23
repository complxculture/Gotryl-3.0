import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey().$defaultFn(() => `key_${nanoid(16)}`),
  accountId: text('account_id').notNull(),
  email: text('email').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
