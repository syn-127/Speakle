import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db, media } from '@speakle/db';
import { eq, desc, like, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { authMiddleware } from '../../middleware/auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = process.env['UPLOAD_DIR'] ?? './uploads';
const MAX_SIZE_MB = parseInt(process.env['MAX_UPLOAD_SIZE_MB'] ?? '10', 10);
const API_URL = process.env['API_URL'] ?? 'http://localhost:3001';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
];

export const mediaRouter = new Hono();

mediaRouter.get('/', authMiddleware, async (c) => {
  const page = parseInt(c.req.query('page') ?? '1', 10);
  const limit = parseInt(c.req.query('limit') ?? '24', 10);
  const mimeType = c.req.query('mime_type');
  const offset = (page - 1) * limit;

  const where = mimeType ? and(like(media.mimeType, `${mimeType}%`)) : undefined;

  const items = await db
    .select()
    .from(media)
    .where(where)
    .orderBy(desc(media.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({ items, page, limit });
});

mediaRouter.post('/upload', authMiddleware, async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return c.json({ error: 'No file provided' }, 400);
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return c.json({ error: 'File type not allowed' }, 400);
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return c.json({ error: `File too large (max ${MAX_SIZE_MB}MB)` }, 400);
  }

  const user = c.get('user');
  const id = createId();
  const ext = extname(file.name) || '.bin';
  const filename = `${id}${ext}`;

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(UPLOAD_DIR, filename), buffer);

  const url = `${API_URL}/uploads/${filename}`;

  const [uploaded] = await db
    .insert(media)
    .values({
      id,
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url,
      uploadedBy: user.id,
      createdAt: Date.now(),
    })
    .returning();

  return c.json(uploaded, 201);
});

mediaRouter.put(
  '/:id',
  authMiddleware,
  zValidator('json', z.object({ altText: z.string().optional(), caption: z.string().optional() })),
  async (c) => {
    const id = c.req.param('id');
    const input = c.req.valid('json');
    const [updated] = await db.update(media).set(input).where(eq(media.id, id)).returning();
    if (!updated) return c.json({ error: 'Not found' }, 404);
    return c.json(updated);
  },
);

mediaRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const [item] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!item) return c.json({ error: 'Not found' }, 404);

  try {
    await unlink(join(UPLOAD_DIR, item.filename));
  } catch {
    // File may already be gone
  }

  await db.delete(media).where(eq(media.id, id));
  return c.json({ success: true });
});
