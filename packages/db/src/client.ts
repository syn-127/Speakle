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

// TypeScript always sees BetterSQLite3Database — fully typed, all overloads resolve.
// In production the Vercel entry calls setDb() with a LibSQLDatabase before serving
// any requests. Both drivers share the same drizzle query API so callers work unchanged.
export let db = createLocalDb();

export function setDb(newDb: typeof db) {
  db = newDb;
}

export type DB = typeof db;
