import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { categories, tags } from './categories';

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  content: text('content').notNull().default('{}'),
  contentHtml: text('content_html'),
  status: text('status', { enum: ['draft', 'published', 'scheduled', 'trash'] })
    .notNull()
    .default('draft'),
  authorId: text('author_id')
    .notNull()
    .references(() => users.id),
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
  featuredImage: text('featured_image'),
  publishedAt: integer('published_at'),
  scheduledAt: integer('scheduled_at'),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  seoKeywords: text('seo_keywords'),
  ogImage: text('og_image'),
  readingTime: integer('reading_time'),
  aiGenerated: integer('ai_generated', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const postTags = sqliteTable('post_tags', {
  postId: text('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  tagId: text('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
});

export const postRevisions = sqliteTable('post_revisions', {
  id: text('id').primaryKey(),
  postId: text('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  title: text('title').notNull(),
  authorId: text('author_id')
    .notNull()
    .references(() => users.id),
  message: text('message'),
  createdAt: integer('created_at').notNull(),
});
