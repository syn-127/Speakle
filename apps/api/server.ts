import type { IncomingMessage, ServerResponse } from 'http';
import { setDb } from '@speakle/db';
import * as schema from '@speakle/db/schema';
import { createApp } from './src/app.js';

export const config = { runtime: 'nodejs' };

// Lazy-init Turso once per cold start
let dbReady = false;
async function ensureDb() {
  if (dbReady) return;
  dbReady = true;
  if (process.env['TURSO_DATABASE_URL']) {
    const { createClient } = await import('@libsql/client');
    const { drizzle } = await import('drizzle-orm/libsql');
    const client = createClient({
      url: process.env['TURSO_DATABASE_URL'],
      authToken: process.env['TURSO_AUTH_TOKEN'],
    });
    setDb(drizzle(client, { schema }) as unknown as Parameters<typeof setDb>[0]);
  }
}

const app = createApp();

// Manual Node.js → Web API bridge (avoids @hono/node-server stream issues)
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await ensureDb();

  // Read body from stream
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const body = chunks.length > 0 ? Buffer.concat(chunks) : null;

  // Build URL
  const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https';
  const host = req.headers['host'] ?? 'localhost';
  const url = new URL(req.url ?? '/', `${proto}://${host}`);

  // Create Web Request for Hono
  const request = new Request(url.toString(), {
    method: req.method ?? 'GET',
    headers: req.headers as HeadersInit,
    body: body && body.length > 0 ? body : undefined,
  });

  // Run through Hono
  const response = await app.fetch(request);

  // Write status + headers
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));

  // Write body
  const buf = await response.arrayBuffer();
  res.end(Buffer.from(buf));
}
