import { getRequestListener } from '@hono/node-server';
import { setDb } from '@speakle/db';
import * as schema from '@speakle/db/schema';
import { createApp } from './src/app.js';

// Vercel Node.js runtime — use @hono/node-server's getRequestListener which
// converts IncomingMessage/ServerResponse to Web Request/Response for Hono.
// hono/vercel's handle() is Edge-only and fails with Node.js IncomingMessage.
export const config = { runtime: 'nodejs' };

if (process.env['TURSO_DATABASE_URL']) {
  const { createClient } = await import('@libsql/client');
  const { drizzle } = await import('drizzle-orm/libsql');
  const client = createClient({
    url: process.env['TURSO_DATABASE_URL'],
    authToken: process.env['TURSO_AUTH_TOKEN'],
  });
  setDb(drizzle(client, { schema }) as unknown as Parameters<typeof setDb>[0]);
}

const app = createApp();
export default getRequestListener(app.fetch);
