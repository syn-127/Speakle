import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db, settings } from '@speakle/db';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../../middleware/auth';
import { setSetting, getSettingsByCategory } from '../../lib/settings';

const CATEGORIES = ['general', 'seo', 'ai', 'appearance'] as const;

export const settingsRouter = new Hono();

settingsRouter.get('/', authMiddleware, async (c) => {
  const allSettings: Record<string, Record<string, unknown>> = {};
  for (const cat of CATEGORIES) {
    allSettings[cat] = await getSettingsByCategory(cat);
  }
  return c.json(allSettings);
});

settingsRouter.get('/:category', authMiddleware, async (c) => {
  const category = c.req.param('category');
  if (!CATEGORIES.includes(category as typeof CATEGORIES[number])) {
    return c.json({ error: 'Invalid category' }, 400);
  }
  const result = await getSettingsByCategory(category);
  return c.json(result);
});

const batchUpdateSchema = z.array(
  z.object({
    key: z.string(),
    value: z.unknown(),
    category: z.enum(CATEGORIES),
  }),
);

settingsRouter.put(
  '/',
  authMiddleware,
  zValidator('json', batchUpdateSchema),
  async (c) => {
    const updates = c.req.valid('json');
    for (const { key, value, category } of updates) {
      await setSetting(key, value, category);
    }
    return c.json({ success: true });
  },
);
