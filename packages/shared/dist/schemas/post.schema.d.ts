import { z } from 'zod';
export declare const createPostSchema: z.ZodObject<{
    title: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    excerpt: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<{
        draft: "draft";
        published: "published";
        scheduled: "scheduled";
        trash: "trash";
    }>>;
    categoryId: z.ZodOptional<z.ZodString>;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    featuredImage: z.ZodOptional<z.ZodString>;
    scheduledAt: z.ZodOptional<z.ZodNumber>;
    seoTitle: z.ZodOptional<z.ZodString>;
    seoDescription: z.ZodOptional<z.ZodString>;
    seoKeywords: z.ZodOptional<z.ZodString>;
    ogImage: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updatePostSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    excerpt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    content: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        draft: "draft";
        published: "published";
        scheduled: "scheduled";
        trash: "trash";
    }>>>;
    categoryId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tagIds: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    featuredImage: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    scheduledAt: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    seoTitle: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    seoDescription: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    seoKeywords: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    ogImage: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const postQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    status: z.ZodOptional<z.ZodEnum<{
        draft: "draft";
        published: "published";
        scheduled: "scheduled";
        trash: "trash";
        all: "all";
    }>>;
    category: z.ZodOptional<z.ZodString>;
    tag: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PostQuery = z.infer<typeof postQuerySchema>;
//# sourceMappingURL=post.schema.d.ts.map