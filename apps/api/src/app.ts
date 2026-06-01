import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { serveStatic } from '@hono/node-server/serve-static';
import { authRouter } from './routes/auth/index.js';
import { postsRouter } from './routes/posts/index.js';
import { categoriesRouter, tagsRouter } from './routes/categories/index.js';
import { mediaRouter } from './routes/media/index.js';
import { settingsRouter } from './routes/settings/index.js';
import { pluginsRouter, themesRouter } from './routes/plugins/index.js';
import { aiRouter } from './routes/ai/index.js';
import { blogRouter } from './routes/blog/index.js';
import { commentsRouter } from './routes/comments/index.js';

const WEB_URL = process.env['WEB_URL'] ?? 'http://localhost:5173';

export function createApp() {
  const app = new Hono();

  app.use('*', logger());
  app.use('*', secureHeaders());
  app.use(
    '*',
    cors({
      origin: [WEB_URL, 'http://localhost:5173'],
      credentials: true,
      allowHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // Static file serving for uploads
  app.use('/uploads/*', serveStatic({ root: '.' }));

  // Health check
  app.get('/api/health', (c) =>
    c.json({
      status: 'ok',
      version: '1.0.0',
      uptime: process.uptime(),
    }),
  );

  // API routes
  app.route('/api/auth', authRouter);
  app.route('/api/posts', postsRouter);
  app.route('/api/categories', categoriesRouter);
  app.route('/api/tags', tagsRouter);
  app.route('/api/media', mediaRouter);
  app.route('/api/settings', settingsRouter);
  app.route('/api/plugins', pluginsRouter);
  app.route('/api/themes', themesRouter);
  app.route('/api/ai', aiRouter);
  app.route('/api/blog', blogRouter);
  app.route('/api/comments', commentsRouter);

  // 404 handler
  app.notFound((c) => c.json({ error: 'Not found' }, 404));

  // Error handler
  app.onError((err, c) => {
    console.error('Unhandled error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  });

  return app;
}
