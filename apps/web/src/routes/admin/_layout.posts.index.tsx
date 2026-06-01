import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '@/api/posts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil, Eye, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

export const Route = createFileRoute('/admin/_layout/posts/')({
  component: PostsPage,
});

const statusColors = {
  published: 'success',
  draft: 'secondary',
  scheduled: 'warning',
  trash: 'destructive',
} as const;

function PostsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['posts', { search, status, page }],
    queryFn: () => postsApi.list({ search: search || undefined, status: status as 'all', page }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => postsApi.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['posts'] });
      toast({ title: 'Post moved to trash', variant: 'default' });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => postsApi.publish(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['posts'] });
      toast({ title: 'Post published!', variant: 'success' });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Posts</h1>
        <Link to="/admin/posts/new">
          <Button><Plus className="h-4 w-4" />New Post</Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="trash">Trash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            )}
            {data?.items.map((post) => (
              <tr key={post.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{post.title}</p>
                    <p className="text-xs text-muted-foreground">/{post.slug}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusColors[post.status] ?? 'secondary'}>
                    {post.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(post.updatedAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {post.status !== 'published' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => publishMutation.mutate(post.id)}
                        title="Publish"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Link to="/admin/posts/$id" params={{ id: post.id }}>
                      <Button variant="ghost" size="sm" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(post.id)}
                      title="Delete"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !data?.items.length && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No posts found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => (
            <Button
              key={i + 1}
              variant={page === i + 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
