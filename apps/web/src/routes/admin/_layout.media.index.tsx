import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Trash2, Image as ImageIcon, Copy } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import type { Media } from '@speakle/shared';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/admin/_layout/media/')({
  component: MediaPage,
});

function MediaPage() {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data } = useQuery({
    queryKey: ['media'],
    queryFn: () => api.get<{ items: Media[] }>('/media?limit=50'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/media/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['media'] });
      toast({ title: 'File deleted' });
    },
  });

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('speakle_token');
    const response = await fetch('/api/media/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json() as { error?: string };
      throw new Error(data.error ?? 'Upload failed');
    }

    return response.json() as Promise<Media>;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        await uploadFile(file);
      }
      void qc.invalidateQueries({ queryKey: ['media'] });
      toast({ title: `${acceptedFiles.length} file(s) uploaded`, variant: 'success' });
    } catch (err) {
      toast({ title: 'Upload failed', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }, [qc]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => void onDrop(files),
    accept: { 'image/*': [], 'video/*': [], 'audio/*': [], 'application/pdf': [] },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Media Library</h1>

      <div
        {...getRootProps()}
        className={cn(
          'rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">
          {uploading ? 'Uploading...' : isDragActive ? 'Drop files here' : 'Drag & drop files or click to upload'}
        </p>
        <p className="text-xs text-muted-foreground">Images, videos, audio, PDFs up to 10MB</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {data?.items.map((item) => (
          <div key={item.id} className="group relative overflow-hidden rounded-lg border bg-muted aspect-square">
            {item.mimeType.startsWith('image/') ? (
              <img src={item.url} alt={item.altText ?? item.originalName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={() => {
                  void navigator.clipboard.writeText(item.url);
                  toast({ title: 'URL copied!' });
                }}
                title="Copy URL"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8"
                onClick={() => deleteMutation.mutate(item.id)}
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!data?.items.length && (
        <p className="text-center text-sm text-muted-foreground py-8">No media uploaded yet.</p>
      )}
    </div>
  );
}
