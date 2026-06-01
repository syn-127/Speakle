import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, AlertTriangle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { formatRelative } from '@/lib/utils';

export const Route = createFileRoute('/admin/_layout/comments/')({
  component: CommentsPage,
});

interface Comment {
  id: string;
  postId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: 'pending' | 'approved' | 'spam' | 'trash';
  createdAt: number;
}

function CommentsPage() {
  const [status, setStatus] = useState('pending');
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['comments', status],
    queryFn: () => api.get<{ items: Comment[] }>(`/comments?status=${status}`),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/comments/${id}/approve`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['comments'] }); toast({ title: 'Comment approved', variant: 'success' }); },
  });

  const spamMutation = useMutation({
    mutationFn: (id: string) => api.put(`/comments/${id}/spam`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['comments'] }); toast({ title: 'Marked as spam' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/comments/${id}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['comments'] }); toast({ title: 'Comment deleted' }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Comments</h1>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="spam">Spam</SelectItem>
            <SelectItem value="trash">Trash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!data?.items.length ? (
        <p className="text-muted-foreground text-sm">No {status} comments.</p>
      ) : (
        <div className="space-y-3">
          {data.items.map((comment) => (
            <div key={comment.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{comment.authorName}</span>
                    <span className="text-xs text-muted-foreground">{comment.authorEmail}</span>
                    <Badge variant={comment.status === 'approved' ? 'success' : 'secondary'} className="text-xs">
                      {comment.status}
                    </Badge>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatRelative(comment.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {comment.status !== 'approved' && (
                    <Button size="sm" variant="ghost" onClick={() => approveMutation.mutate(comment.id)} title="Approve">
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => spamMutation.mutate(comment.id)} title="Spam">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(comment.id)} title="Delete" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
