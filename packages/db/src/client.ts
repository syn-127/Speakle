import * as schema from './schema/index';

// Top-level await + dynamic imports so @libsql/client is never loaded in local dev
// and better-sqlite3 is never loaded in production (Vercel + Turso).
async function initDb() {
  if (process.env['TURSO_DATABASE_URL']) {
    const { createClient } = await import('@libsql/client');
    const { drizzle } = await import('drizzle-orm/libsql');
    const client = createClient({
      url: process.env['TURSO_DATABASE_URL'],
      authToken: process.env['TURSO_AUTH_TOKEN'],
    });
    return drizzle(client, { schema });
  }

  const { default: Database } = await import('better-sqlite3');
  const { drizzle } = await import('drizzle-orm/better-sqlite3');
  const { resolve } = await import('path');
  const dbPath = process.env['DATABASE_PATH'] ?? resolve(process.cwd(), 'speakle.db');
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

export const db = await initDb();
export type DB = typeof db;
