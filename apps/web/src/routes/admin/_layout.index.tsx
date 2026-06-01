import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { PostListResult } from '@/api/posts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@tanstack/react-router';
import { FileText, CheckCircle, PenLine, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';

export const Route = createFileRoute('/admin/_layout/')({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuthStore();

  const { data: allPosts } = useQuery({
    queryKey: ['posts', 'all'],
    queryFn: () => api.get<PostListResult>('/posts?status=all&limit=100'),
  });

  const { data: published } = useQuery({
    queryKey: ['posts', 'published'],
    queryFn: () => api.get<PostListResult>('/posts?status=published&limit=1'),
  });

  const { data: drafts } = useQuery({
    queryKey: ['posts', 'drafts'],
    queryFn: () => api.get<PostListResult>('/posts?status=draft&limit=1'),
  });

  const stats = [
    { label: 'Total Posts', value: allPosts?.total ?? 0, icon: FileText, color: 'text-blue-500' },
    { label: 'Published', value: published?.total ?? 0, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Drafts', value: drafts?.total ?? 0, icon: PenLine, color: 'text-yellow-500' },
  ];

  const recentPosts = allPosts?.items.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.displayName ?? user?.username}!</p>
        </div>
        <Link to="/admin/posts/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts yet. <Link to="/admin/posts/new" className="text-primary hover:underline">Create your first post!</Link></p>
          ) : (
            <ul className="space-y-2">
              {recentPosts.map((post) => (
                <li key={post.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{post.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{post.status}</p>
                  </div>
                  <Link to="/admin/posts/$id" params={{ id: post.id }}>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
