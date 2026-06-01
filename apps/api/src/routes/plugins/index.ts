import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db, plugins, themes } from '@speakle/db';
import { eq, asc } from 'drizzle-orm';
import { authMiddleware, adminOnly } from '../../middleware/auth';
import { dbv } from '../../lib/db-helpers';

export const pluginsRouter = new Hono();

pluginsRouter.get('/', authMiddleware, async (c) => {
  const items = await db.select().from(plugins).orderBy(asc(plugins.name));
  return c.json(items);
});

pluginsRouter.post('/:id/activate', authMiddleware, adminOnly, async (c) => {
  const id = c.req.param('id');
  const [plugin] = await db
    .update(plugins)
    .set(dbv({ isActive: true, updatedAt: Date.now() }))
    .where(eq(plugins.id, id))
    .returning();
  if (!plugin) return c.json({ error: 'Plugin not found' }, 404);
  return c.json(plugin);
});

pluginsRouter.post('/:id/deactivate', authMiddleware, adminOnly, async (c) => {
  const id = c.req.param('id');
  const [plugin] = await db
    .update(plugins)
    .set(dbv({ isActive: false, updatedAt: Date.now() }))
    .where(eq(plugins.id, id))
    .returning();
  if (!plugin) return c.json({ error: 'Plugin not found' }, 404);
  return c.json(plugin);
});

pluginsRouter.put(
  '/:id/config',
  authMiddleware,
  adminOnly,
  zValidator('json', z.record(z.unknown())),
  async (c) => {
    const id = c.req.param('id');
    const config = c.req.valid('json');
    const [plugin] = await db
      .update(plugins)
      .set(dbv({ config: JSON.stringify(config), updatedAt: Date.now() }))
      .where(eq(plugins.id, id))
      .returning();
    if (!plugin) return c.json({ error: 'Plugin not found' }, 404);
    return c.json(plugin);
  },
);

pluginsRouter.delete('/:id', authMiddleware, adminOnly, async (c) => {
  await db.delete(plugins).where(eq(plugins.id, c.req.param('id')));
  return c.json({ success: true });
});

// Themes
export const themesRouter = new Hono();

themesRouter.get('/', authMiddleware, async (c) => {
  const items = await db.select().from(themes).orderBy(asc(themes.name));
  return c.json(items);
});

themesRouter.post('/:id/activate', authMiddleware, adminOnly, async (c) => {
  const id = c.req.param('id');
  await db.update(themes).set(dbv({ isActive: false }));
  const [theme] = await db
    .update(themes)
    .set(dbv({ isActive: true }))
    .where(eq(themes.id, id))
    .returning();
  if (!theme) return c.json({ error: 'Theme not found' }, 404);
  return c.json(theme);
});

themesRouter.put(
  '/:id/config',
  authMiddleware,
  adminOnly,
  zValidator('json', z.record(z.unknown())),
  async (c) => {
    const id = c.req.param('id');
    const config = c.req.valid('json');
    const [theme] = await db
      .update(themes)
      .set(dbv({ config: JSON.stringify(config) }))
      .where(eq(themes.id, id))
      .returning();
    if (!theme) return c.json({ error: 'Theme not found' }, 404);
    return c.json(theme);
  },
);
