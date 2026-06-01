import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { posts } from './posts';
export const comments = sqliteTable('comments', {
    id: text('id').primaryKey(),
    postId: text('post_id')
        .notNull()
        .references(() => posts.id, { onDelete: 'cascade' }),
    parentId: text('parent_id'),
    authorName: text('author_name').notNull(),
    authorEmail: text('author_email').notNull(),
    authorUrl: text('author_url'),
    content: text('content').notNull(),
    status: text('status', { enum: ['pending', 'approved', 'spam', 'trash'] })
        .notNull()
        .default('pending'),
    ipAddress: text('ip_address'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
});
//# sourceMappingURL=comments.js.map