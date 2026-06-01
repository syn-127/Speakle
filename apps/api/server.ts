import { handle } from 'hono/vercel';
import { setDb } from '@speakle/db';
import * as schema from '@speakle/db/schema';
import { createApp } from './src/app.js';

export const config = { runtime: 'nodejs' };

// Swap in Turso before handling any requests when TURSO_DATABASE_URL is set.
// Top-level await is valid here — this is the serverless entry, not a shared module.
if (process.env['TURSO_DATABASE_URL']) {
  const { createClient } = await import('@libsql/client');
  const { drizzle } = await import('drizzle-orm/libsql');
  const client = createClient({
    url: process.env['TURSO_DATABASE_URL'],
    authToken: process.env['TURSO_AUTH_TOKEN'],
  });
  // LibSQLDatabase and BetterSQLite3Database are structurally incompatible at the
  // type level (async vs sync mode) but share the same drizzle query API at runtime.
  // The double cast through unknown is required — and safe — here.
  setDb(drizzle(client, { schema }) as unknown as Parameters<typeof setDb>[0]);
}

const app = createApp();
export default handle(app);
