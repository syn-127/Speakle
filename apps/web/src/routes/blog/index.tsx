import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { PostListResult } from '@/api/posts';
import { formatDate } from '@/lib/utils';
import { Logo } from '@/components/Logo';

export const Route = createFileRoute('/blog/')({
  component: BlogIndex,
});

function BlogIndex() {
  const { data } = useQuery({
    queryKey: ['blog', 'posts'],
    queryFn: () => api.get<PostListResult>('/blog/posts?limit=10'),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/"><Logo /></Link>
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">Admin</Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-4xl font-bold">Latest Posts</h1>

        {!data?.items.length && (
          <p className="text-muted-foreground">No posts yet. <Link to="/admin/posts/new" className="text-primary hover:underline">Create the first one!</Link></p>
        )}

        <div className="space-y-8">
          {data?.items.map((post) => (
            <article key={post.id} className="group">
              <time className="text-sm text-muted-foreground">{formatDate(post.publishedAt)}</time>
              <h2 className="mt-1 text-2xl font-semibold group-hover:text-primary transition-colors">
                <Link to="/blog/$slug" params={{ slug: post.slug }}>{post.title}</Link>
              </h2>
              {post.excerpt && <p className="mt-2 text-muted-foreground">{post.excerpt}</p>}
              <Link to="/blog/$slug" params={{ slug: post.slug }} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                Read more →
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
