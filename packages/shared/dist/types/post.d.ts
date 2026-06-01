export type PostStatus = 'draft' | 'published' | 'scheduled' | 'trash';
export interface Post {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    content: string;
    contentHtml: string | null;
    status: PostStatus;
    authorId: string;
    categoryId: string | null;
    featuredImage: string | null;
    publishedAt: number | null;
    scheduledAt: number | null;
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string | null;
    ogImage: string | null;
    readingTime: number | null;
    aiGenerated: boolean;
    createdAt: number;
    updatedAt: number;
}
export interface PostRevision {
    id: string;
    postId: string;
    content: string;
    title: string;
    authorId: string;
    message: string | null;
    createdAt: number;
}
export interface PostWithRelations extends Post {
    author: {
        id: string;
        displayName: string | null;
        email: string;
        avatarUrl: string | null;
    };
    category: Category | null;
    tags: Tag[];
}
import type { Category } from './category';
import type { Tag } from './category';
//# sourceMappingURL=post.d.ts.map