import { serve } from '@hono/node-server';
import { createApp } from './app.js';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);

const app = createApp();

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`\n🚀 Speakle API running on http://localhost:${info.port}\n`);
  },
);
