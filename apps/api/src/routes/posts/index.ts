import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createPostSchema, updatePostSchema, postQuerySchema, type CreatePostInput, type UpdatePostInput } from '@speakle/shared';
import { z } from 'zod';
import { authMiddleware, adminOnly } from '../../middleware/auth';
import {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  permanentDeletePost,
  createRevision,
  listRevisions,
  restoreRevision,
} from '../../services/post.service';
import { validated } from '../../lib/db-helpers';

export const postsRouter = new Hono();

postsRouter.get('/', zValidator('query', postQuerySchema), async (c) => {
  const query = c.req.valid('query');
  const result = await listPosts(query);
  return c.json(result);
});

postsRouter.get('/:idOrSlug', async (c) => {
  const idOrSlug = c.req.param('idOrSlug');
  const post = await getPost(idOrSlug);
  if (!post) return c.json({ error: 'Post not found' }, 404);
  return c.json(post);
});

postsRouter.post('/', authMiddleware, zValidator('json', createPostSchema), async (c) => {
  const input = validated<CreatePostInput>(c.req.valid('json'));
  const user = c.get('user');
  const post = await createPost(input, user.id);
  return c.json(post, 201);
});

postsRouter.put('/:id', authMiddleware, zValidator('json', updatePostSchema), async (c) => {
  const id = c.req.param('id');
  const input = validated<UpdatePostInput>(c.req.valid('json'));

  // Auto-save revision before update
  const user = c.get('user');
  await createRevision(id, user.id, 'auto-save');

  const post = await updatePost(id, input);
  if (!post) return c.json({ error: 'Post not found' }, 404);
  return c.json(post);
});

postsRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  await deletePost(id);
  return c.json({ success: true });
});

postsRouter.delete('/:id/permanent', authMiddleware, adminOnly, async (c) => {
  const id = c.req.param('id');
  await permanentDeletePost(id);
  return c.json({ success: true });
});

postsRouter.post('/:id/publish', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const post = await updatePost(id, { status: 'published' });
  if (!post) return c.json({ error: 'Post not found' }, 404);
  return c.json(post);
});

postsRouter.post('/:id/unpublish', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const post = await updatePost(id, { status: 'draft' });
  if (!post) return c.json({ error: 'Post not found' }, 404);
  return c.json(post);
});

postsRouter.get('/:id/revisions', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const revisions = await listRevisions(id);
  return c.json(revisions);
});

postsRouter.post(
  '/:id/revisions',
  authMiddleware,
  zValidator('json', z.object({ message: z.string().optional() })),
  async (c) => {
    const id = c.req.param('id');
    const { message } = c.req.valid('json');
    const user = c.get('user');
    const revision = await createRevision(id, user.id, message);
    if (!revision) return c.json({ error: 'Post not found' }, 404);
    return c.json(revision, 201);
  },
);

postsRouter.post('/:id/revisions/:revId/restore', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const revId = c.req.param('revId');
  const post = await restoreRevision(id, revId);
  if (!post) return c.json({ error: 'Revision not found' }, 404);
  return c.json(post);
});
