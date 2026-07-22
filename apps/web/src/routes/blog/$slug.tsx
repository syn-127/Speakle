import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Post } from '@speakle/shared';
import { formatDate } from '@/lib/utils';

export const Route = createFileRoute('/blog/$slug')({
  component: BlogPost,
});

function BlogPost() {
  const { slug } = Route.useParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog', 'post', slug],
    queryFn: () => api.get<Post>(`/blog/posts/${slug}`),
  });

  if (isLoading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (!post) return <div className="flex min-h-screen items-center justify-center">Post not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="text-2xl font-bold text-primary">Speakle</Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-12">
        <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground">← Back to blog</Link>

        <article className="mt-8">
          <header className="mb-8">
            <h1 className="text-4xl font-bold leading-tight">{post.title}</h1>
            <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
              <time>{formatDate(post.publishedAt)}</time>
              {post.readingTime && <span>· {post.readingTime} min read</span>}
              {post.aiGenerated && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">AI-assisted</span>}
            </div>
          </header>

          {post.contentHtml ? (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />
          ) : (
            <p className="text-muted-foreground">{post.excerpt}</p>
          )}
        </article>
      </main>
    </div>
  );
}
