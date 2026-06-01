import { z } from 'zod';
export const createPostSchema = z.object({
    title: z.string().min(1).max(500),
    slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
    excerpt: z.string().max(500).optional(),
    content: z.string(),
    status: z.enum(['draft', 'published', 'scheduled', 'trash']).default('draft'),
    categoryId: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
    featuredImage: z.string().optional(),
    scheduledAt: z.number().optional(),
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(160).optional(),
    seoKeywords: z.string().optional(),
    ogImage: z.string().optional(),
});
export const updatePostSchema = createPostSchema.partial();
export const postQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.enum(['draft', 'published', 'scheduled', 'trash', 'all']).optional(),
    category: z.string().optional(),
    tag: z.string().optional(),
    search: z.string().optional(),
});
//# sourceMappingURL=post.schema.js.map