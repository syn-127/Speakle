import { db, posts, postTags, tags, categories, users, postRevisions } from '@speakle/db';
import { eq, desc, and, or, like, inArray, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { dbv } from '../lib/db-helpers';
import type { CreatePostInput, UpdatePostInput } from '@speakle/shared';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

function estimateReadingTime(content: string): number {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  let candidate = slug;
  let counter = 1;

  while (true) {
    const existing = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, candidate))
      .limit(1);

    const conflict = existing[0];
    if (!conflict || conflict.id === excludeId) return candidate;

    candidate = `${slug}-${counter++}`;
  }
}

export async function listPosts(query: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  tag?: string;
  search?: string;
}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (query.status && query.status !== 'all') {
    conditions.push(eq(posts.status, query.status as 'draft' | 'published' | 'scheduled' | 'trash'));
  }

  if (query.search) {
    conditions.push(
      or(
        like(posts.title, `%${query.search}%`),
        like(posts.excerpt, `%${query.search}%`),
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select({
        post: posts,
        author: {
          id: users.id,
          displayName: users.displayName,
          email: users.email,
          avatarUrl: users.avatarUrl,
        },
        category: categories,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(where)
      .orderBy(desc(posts.updatedAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(posts).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;

  return {
    items: items.map((r) => ({ ...r.post, author: r.author, category: r.category })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPost(idOrSlug: string) {
  const isId = !idOrSlug.includes('-') || idOrSlug.length === 25;

  const result = await db
    .select({
      post: posts,
      author: {
        id: users.id,
        displayName: users.displayName,
        email: users.email,
        avatarUrl: users.avatarUrl,
      },
      category: categories,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(isId ? eq(posts.id, idOrSlug) : eq(posts.slug, idOrSlug))
    .limit(1);

  const row = result[0];
  if (!row) return null;

  const postTagRows = await db
    .select({ tag: tags })
    .from(postTags)
    .leftJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, row.post.id));

  return {
    ...row.post,
    author: row.author,
    category: row.category,
    tags: postTagRows.map((r) => r.tag).filter(Boolean),
  };
}

export async function createPost(input: CreatePostInput, authorId: string) {
  const now = Date.now();
  const id = createId();
  const baseSlug = input.slug ?? generateSlug(input.title);
  const slug = await ensureUniqueSlug(baseSlug);

  const publishedAt =
    input.status === 'published' ? now : null;

  const postRow = {
    id,
    slug,
    title: input.title,
    excerpt: input.excerpt ?? null,
    content: input.content,
    status: input.status ?? 'draft',
    authorId,
    categoryId: input.categoryId ?? null,
    featuredImage: input.featuredImage ?? null,
    publishedAt,
    scheduledAt: input.scheduledAt ?? null,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    seoKeywords: input.seoKeywords ?? null,
    ogImage: input.ogImage ?? null,
    readingTime: estimateReadingTime(input.content),
    createdAt: now,
    updatedAt: now,
  };

  const [post] = await db.insert(posts).values(postRow).returning();

  if (input.tagIds && input.tagIds.length > 0) {
    await db.insert(postTags).values(input.tagIds.map((tagId) => ({ postId: id, tagId })));
  }

  return post;
}

export async function updatePost(id: string, input: UpdatePostInput) {
  const now = Date.now();
  const current = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!current[0]) return null;

  const updates: Partial<typeof current[0]> = { ...input, updatedAt: now };

  if (input.slug) {
    updates.slug = await ensureUniqueSlug(input.slug, id);
  }

  if (input.content) {
    updates.readingTime = estimateReadingTime(input.content);
  }

  if (input.status === 'published' && !current[0]!.publishedAt) {
    updates.publishedAt = now;
  }

  const [updated] = await db
    .update(posts)
    .set(dbv(updates))
    .where(eq(posts.id, id))
    .returning();

  if (input.tagIds !== undefined) {
    await db.delete(postTags).where(eq(postTags.postId, id));
    if (input.tagIds.length > 0) {
      await db.insert(postTags).values(input.tagIds.map((tagId) => ({ postId: id, tagId })));
    }
  }

  return updated;
}

export async function deletePost(id: string) {
  await db.update(posts).set(dbv({ status: 'trash', updatedAt: Date.now() })).where(eq(posts.id, id));
}

export async function permanentDeletePost(id: string) {
  await db.delete(posts).where(eq(posts.id, id));
}

export async function createRevision(postId: string, authorId: string, message?: string) {
  const current = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!current[0]) return null;

  const revisionRow = {
    id: createId(),
    postId,
    content: current[0].content,
    title: current[0].title,
    authorId,
    message: message ?? null,
    createdAt: Date.now(),
  };

  const [revision] = await db.insert(postRevisions).values(revisionRow).returning();

  return revision;
}

export async function listRevisions(postId: string) {
  return db
    .select()
    .from(postRevisions)
    .where(eq(postRevisions.postId, postId))
    .orderBy(desc(postRevisions.createdAt));
}

export async function restoreRevision(postId: string, revisionId: string) {
  const [revision] = await db
    .select()
    .from(postRevisions)
    .where(and(eq(postRevisions.id, revisionId), eq(postRevisions.postId, postId)))
    .limit(1);

  if (!revision) return null;

  return updatePost(postId, { content: revision.content, title: revision.title });
}
