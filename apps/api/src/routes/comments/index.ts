import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db, comments } from '@speakle/db';
import { eq, desc, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { authMiddleware } from '../../middleware/auth';
import { dbv } from '../../lib/db-helpers';

const createCommentSchema = z.object({
  postId: z.string(),
  parentId: z.string().optional(),
  authorName: z.string().min(1).max(100),
  authorEmail: z.string().email(),
  authorUrl: z.string().url().optional(),
  content: z.string().min(1).max(5000),
});

export const commentsRouter = new Hono();

commentsRouter.get('/', authMiddleware, async (c) => {
  const status = c.req.query('status') as 'pending' | 'approved' | 'spam' | 'trash' | undefined;
  const postId = c.req.query('postId');
  const page = parseInt(c.req.query('page') ?? '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) conditions.push(eq(comments.status, status));
  if (postId) conditions.push(eq(comments.postId, postId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db
    .select()
    .from(comments)
    .where(where)
    .orderBy(desc(comments.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({ items, page, limit });
});

commentsRouter.post('/', zValidator('json', createCommentSchema), async (c) => {
  const input = c.req.valid('json');
  const now = Date.now();
  const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip');

  const commentRow = {
    id: createId(),
    postId: input.postId,
    parentId: input.parentId ?? null,
    authorName: input.authorName,
    authorEmail: input.authorEmail,
    authorUrl: input.authorUrl ?? null,
    content: input.content,
    status: 'pending' as const,
    ipAddress: ip ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const [comment] = await db.insert(comments).values(commentRow).returning();

  return c.json(comment, 201);
});

commentsRouter.put('/:id/approve', authMiddleware, async (c) => {
  const [comment] = await db
    .update(comments)
    .set(dbv({ status: 'approved', updatedAt: Date.now() }))
    .where(eq(comments.id, c.req.param('id')))
    .returning();
  if (!comment) return c.json({ error: 'Not found' }, 404);
  return c.json(comment);
});

commentsRouter.put('/:id/spam', authMiddleware, async (c) => {
  const [comment] = await db
    .update(comments)
    .set(dbv({ status: 'spam', updatedAt: Date.now() }))
    .where(eq(comments.id, c.req.param('id')))
    .returning();
  if (!comment) return c.json({ error: 'Not found' }, 404);
  return c.json(comment);
});

commentsRouter.delete('/:id', authMiddleware, async (c) => {
  await db.delete(comments).where(eq(comments.id, c.req.param('id')));
  return c.json({ success: true });
});
