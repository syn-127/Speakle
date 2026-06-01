import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Puzzle, Power, PowerOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import type { Plugin } from '@speakle/shared';

export const Route = createFileRoute('/admin/_layout/plugins/')({
  component: PluginsPage,
});

function PluginsPage() {
  const qc = useQueryClient();

  const { data: plugins } = useQuery({
    queryKey: ['plugins'],
    queryFn: () => api.get<Plugin[]>('/plugins'),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/plugins/${id}/activate`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['plugins'] });
      toast({ title: 'Plugin activated', variant: 'success' });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/plugins/${id}/deactivate`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['plugins'] });
      toast({ title: 'Plugin deactivated' });
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Plugins</h1>

      {!plugins?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Puzzle className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No plugins installed yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {plugins.map((plugin) => (
            <Card key={plugin.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Puzzle className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{plugin.name}</CardTitle>
                    <Badge variant={plugin.isActive ? 'success' : 'secondary'}>
                      {plugin.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      plugin.isActive
                        ? deactivateMutation.mutate(plugin.id)
                        : activateMutation.mutate(plugin.id)
                    }
                  >
                    {plugin.isActive ? (
                      <><PowerOff className="h-4 w-4" />Deactivate</>
                    ) : (
                      <><Power className="h-4 w-4" />Activate</>
                    )}
                  </Button>
                </div>
                <CardDescription>{plugin.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  v{plugin.version} · {plugin.author ?? 'Unknown'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
