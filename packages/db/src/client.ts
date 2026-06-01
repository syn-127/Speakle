import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { resolve } from 'path';
import * as schema from './schema/index';

function createLocalDb() {
  const dbPath = process.env['DATABASE_PATH'] ?? resolve(process.cwd(), 'speakle.db');
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

// Skip SQLite when TURSO_DATABASE_URL is set — the Vercel entry calls setDb()
// with a LibSQLDatabase before any requests are served. Avoids trying to
// create a file on Vercel's read-only /var/task/ filesystem.
export let db: ReturnType<typeof createLocalDb> = process.env['TURSO_DATABASE_URL']
  ? (null as unknown as ReturnType<typeof createLocalDb>)
  : createLocalDb();

export function setDb(newDb: typeof db) {
  db = newDb;
}

export type DB = typeof db;
