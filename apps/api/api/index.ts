import { handle } from 'hono/vercel';
import { setDb } from '@speakle/db';
import { createApp } from '../src/app';

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
  // Cast is safe: LibSQLDatabase and BetterSQLite3Database share the same query API
  setDb(drizzle(client, { schema: await import('@speakle/db/schema') }) as Parameters<typeof setDb>[0]);
}

const app = createApp();
export default handle(app);
