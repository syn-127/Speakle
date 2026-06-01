import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const media = sqliteTable('media', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  url: text('url').notNull(),
  altText: text('alt_text'),
  caption: text('caption'),
  uploadedBy: text('uploaded_by')
    .notNull()
    .references(() => users.id),
  createdAt: integer('created_at').notNull(),
});
