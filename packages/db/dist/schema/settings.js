import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const settings = sqliteTable('settings', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
    category: text('category', { enum: ['general', 'seo', 'ai', 'appearance'] }).notNull(),
    updatedAt: integer('updated_at').notNull(),
});
//# sourceMappingURL=settings.js.map