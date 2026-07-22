import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const loginAttempts = sqliteTable('login_attempts', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  createdAt: integer('created_at').notNull(),
});
