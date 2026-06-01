import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db, categories, tags } from '@speakle/db';
import { eq, asc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { authMiddleware } from '../../middleware/auth.js';
import { dbv } from '../../lib/db-helpers.js';

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  color: z.string().optional(),
});

export const categoriesRouter = new Hono();

categoriesRouter.get('/', async (c) => {
  const items = await db.select().from(categories).orderBy(asc(categories.name));
  return c.json(items);
});

categoriesRouter.post('/', authMiddleware, zValidator('json', categorySchema), async (c) => {
  const input = c.req.valid('json');
  const now = Date.now();
  const slug =
    input.slug ??
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');

  // Assign to a variable first — TypeScript's excess property check only fires on
  // direct object literals passed to functions, not on variables.
  const row = {
    id: createId(),
    name: input.name,
    slug,
    description: input.description ?? null,
    parentId: input.parentId ?? null,
    color: input.color ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const [cat] = await db.insert(categories).values(row).returning();

  return c.json(cat, 201);
});

categoriesRouter.put('/:id', authMiddleware, zValidator('json', categorySchema.partial()), async (c) => {
  const id = c.req.param('id');
  const input = c.req.valid('json');
  const patch = { ...input, updatedAt: Date.now() };
  const [cat] = await db.update(categories).set(dbv(patch)).where(eq(categories.id, id)).returning();

  if (!cat) return c.json({ error: 'Category not found' }, 404);
  return c.json(cat);
});

categoriesRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  await db.delete(categories).where(eq(categories.id, id));
  return c.json({ success: true });
});

// Tags routes
export const tagsRouter = new Hono();

tagsRouter.get('/', async (c) => {
  const search = c.req.query('search');
  const items = await db.select().from(tags).orderBy(asc(tags.name));
  return c.json(search ? items.filter((t) => t.name.includes(search)) : items);
});

tagsRouter.post(
  '/',
  authMiddleware,
  zValidator('json', z.object({ name: z.string().min(1) })),
  async (c) => {
    const { name } = c.req.valid('json');
    const slug = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');

    const [tag] = await db
      .insert(tags)
      .values({ id: createId(), name, slug, createdAt: Date.now() })
      .onConflictDoNothing()
      .returning();

    return c.json(tag ?? { error: 'Tag already exists' }, tag ? 201 : 409);
  },
);

tagsRouter.delete('/:id', authMiddleware, async (c) => {
  await db.delete(tags).where(eq(tags.id, c.req.param('id')));
  return c.json({ success: true });
});
