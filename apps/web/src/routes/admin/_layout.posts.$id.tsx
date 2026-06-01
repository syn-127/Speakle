import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { postsApi } from '@/api/posts';
import { PostEditor } from './-components/PostEditor';

export const Route = createFileRoute('/admin/_layout/posts/$id')({
  component: EditPostPage,
});

function EditPostPage() {
  const { id } = Route.useParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ['posts', id],
    queryFn: () => postsApi.get(id),
    enabled: id !== 'new',
  });

  if (isLoading) return <div className="flex items-center justify-center p-12 text-muted-foreground">Loading post...</div>;

  return <PostEditor initialPost={post} />;
}
