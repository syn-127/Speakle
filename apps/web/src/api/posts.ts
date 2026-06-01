import { api } from './client.js';
import type { Post, PostRevision } from '@speakle/shared';
import type { CreatePostInput, UpdatePostInput, PostQuery } from '@speakle/shared';

export interface PostListResult {
  items: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const postsApi = {
  list: (query?: Partial<PostQuery>) => {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.status) params.set('status', query.status);
    if (query?.search) params.set('search', query.search);
    if (query?.category) params.set('category', query.category);
    if (query?.tag) params.set('tag', query.tag);
    return api.get<PostListResult>(`/posts?${params}`);
  },

  get: (idOrSlug: string) => api.get<Post>(`/posts/${idOrSlug}`),

  create: (input: CreatePostInput) => api.post<Post>('/posts', input),

  update: (id: string, input: UpdatePostInput) => api.put<Post>(`/posts/${id}`, input),

  delete: (id: string) => api.delete<{ success: boolean }>(`/posts/${id}`),

  publish: (id: string) => api.post<Post>(`/posts/${id}/publish`),

  unpublish: (id: string) => api.post<Post>(`/posts/${id}/unpublish`),

  listRevisions: (id: string) => api.get<PostRevision[]>(`/posts/${id}/revisions`),

  createRevision: (id: string, message?: string) =>
    api.post<PostRevision>(`/posts/${id}/revisions`, { message }),

  restoreRevision: (id: string, revId: string) =>
    api.post<Post>(`/posts/${id}/revisions/${revId}/restore`),
};
