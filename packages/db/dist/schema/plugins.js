import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const plugins = sqliteTable('plugins', {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    version: text('version').notNull(),
    description: text('description'),
    author: text('author'),
    entryPoint: text('entry_point').notNull(),
    config: text('config'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
    installedAt: integer('installed_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
});
export const themes = sqliteTable('themes', {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    version: text('version').notNull(),
    author: text('author'),
    previewUrl: text('preview_url'),
    config: text('config'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
    isBundled: integer('is_bundled', { mode: 'boolean' }).notNull().default(true),
    installedAt: integer('installed_at').notNull(),
});
//# sourceMappingURL=plugins.js.map