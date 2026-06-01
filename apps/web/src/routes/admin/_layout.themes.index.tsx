import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Palette, Check } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import type { Theme } from '@speakle/shared';

export const Route = createFileRoute('/admin/_layout/themes/')({
  component: ThemesPage,
});

function ThemesPage() {
  const qc = useQueryClient();

  const { data: themes } = useQuery({
    queryKey: ['themes'],
    queryFn: () => api.get<Theme[]>('/themes'),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/themes/${id}/activate`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['themes'] });
      toast({ title: 'Theme activated!', variant: 'success' });
    },
  });

  const themeColors: Record<string, string> = {
    default: 'bg-indigo-100',
    minimal: 'bg-gray-100',
    magazine: 'bg-red-100',
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Themes</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes?.map((theme) => (
          <Card key={theme.id} className={theme.isActive ? 'ring-2 ring-primary' : ''}>
            <div className={`h-32 rounded-t-lg ${themeColors[theme.slug] ?? 'bg-muted'} flex items-center justify-center`}>
              <Palette className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{theme.name}</h3>
                {theme.isActive && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">v{theme.version} · {theme.author}</p>
            </CardContent>
            <CardFooter>
              <Button
                variant={theme.isActive ? 'secondary' : 'default'}
                size="sm"
                className="w-full"
                disabled={theme.isActive || activateMutation.isPending}
                onClick={() => activateMutation.mutate(theme.id)}
              >
                {theme.isActive ? 'Current Theme' : 'Activate'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
