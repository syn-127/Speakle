import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import type { Tag } from '@speakle/shared';

export const Route = createFileRoute('/admin/_layout/tags/')({
  component: TagsPage,
});

function TagsPage() {
  const [name, setName] = useState('');
  const qc = useQueryClient();

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get<Tag[]>('/tags'),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post<Tag>('/tags', { name }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tags'] });
      setName('');
      toast({ title: 'Tag created', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tags/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['tags'] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tags</h1>

      <div className="flex gap-2 max-w-sm">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tag name"
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) createMutation.mutate(); }}
        />
        <Button onClick={() => createMutation.mutate()} disabled={!name.trim() || createMutation.isPending}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags?.map((tag) => (
          <Badge key={tag.id} variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
            {tag.name}
            <button
              type="button"
              onClick={() => deleteMutation.mutate(tag.id)}
              className="ml-1 rounded-full hover:bg-destructive hover:text-destructive-foreground p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {!tags?.length && <p className="text-sm text-muted-foreground">No tags yet.</p>}
      </div>
    </div>
  );
}
