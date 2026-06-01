import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: text('role', { enum: ['admin', 'editor', 'viewer'] }).notNull().default('editor'),
    avatarUrl: text('avatar_url'),
    displayName: text('display_name'),
    bio: text('bio'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
});
export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: integer('expires_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: integer('created_at').notNull(),
});
//# sourceMappingURL=users.js.map