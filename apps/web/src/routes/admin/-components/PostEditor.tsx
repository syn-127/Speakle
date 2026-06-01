import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '@/api/posts';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIGeneratePanel } from '@/components/ai/AIGenerateDialog';
import { AIResearchPanel } from '@/components/ai/AIResearchPanel';
import { VoiceDictationPanel } from '@/components/ai/VoiceDictationPanel';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/api/client';
import { slugify } from '@/lib/utils';
import type { Post, Category, Tag } from '@speakle/shared';
import {
  Save, Send, ChevronLeft, Sparkles, Search, Mic,
  LayoutList, Tag as TagIcon, Settings2, Clock
} from 'lucide-react';

interface PostEditorProps {
  initialPost?: Post | null;
}

export function PostEditor({ initialPost }: PostEditorProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [title, setTitle] = useState(initialPost?.title ?? '');
  const [content, setContent] = useState(initialPost?.content ?? '{}');
  const [contentHtml, setContentHtml] = useState(initialPost?.contentHtml ?? '');
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? '');
  const [slug, setSlug] = useState(initialPost?.slug ?? '');
  const [categoryId, setCategoryId] = useState(initialPost?.categoryId ?? '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [seoTitle, setSeoTitle] = useState(initialPost?.seoTitle ?? '');
  const [seoDesc, setSeoDesc] = useState(initialPost?.seoDescription ?? '');
  const [status, setStatus] = useState(initialPost?.status ?? 'draft');
  const [isDirty, setIsDirty] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('status');
  const [aiTab, setAiTab] = useState('generate');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get<Tag[]>('/tags'),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Parameters<typeof postsApi.create>[0]) =>
      initialPost ? postsApi.update(initialPost.id, data) : postsApi.create(data),
    onSuccess: (post) => {
      void qc.invalidateQueries({ queryKey: ['posts'] });
      setIsDirty(false);
      if (!initialPost) {
        void navigate({ to: '/admin/posts/$id', params: { id: post.id } });
      }
      toast({ title: 'Post saved', variant: 'success' });
    },
    onError: (err) => {
      toast({ title: 'Save failed', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => {
      if (!initialPost) throw new Error('Save first');
      return postsApi.publish(initialPost.id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['posts'] });
      setStatus('published');
      toast({ title: 'Post published!', variant: 'success' });
    },
  });

  const handleContentChange = useCallback((json: string, html: string) => {
    setContent(json);
    setContentHtml(html);
    setIsDirty(true);

    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      if (initialPost) {
        saveMutation.mutate({ title, content: json, status: status as 'draft' | 'published' | 'scheduled' | 'trash' });
      }
    }, 30_000);
  }, [title, status, initialPost]);

  const handleSave = () => {
    saveMutation.mutate({
      title,
      content,
      excerpt: excerpt || undefined,
      slug: slug || undefined,
      categoryId: categoryId || undefined,
      tagIds: selectedTagIds,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDesc || undefined,
      status: status as 'draft' | 'published' | 'scheduled' | 'trash',
    });
  };

  const handleAIContent = useCallback((markdown: string) => {
    // Convert markdown to set in editor - just use the markdown as content for simplicity
    // In a full implementation, parse markdown to TipTap JSON
    const lines = markdown.split('\n');
    const titleLine = lines.find((l) => l.startsWith('# '));
    if (titleLine && !title) {
      setTitle(titleLine.slice(2).trim());
    }
    setContent(JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: markdown }] }] }));
    setIsDirty(true);
  }, [title]);

  useEffect(() => {
    if (title && !slug && !initialPost) {
      setSlug(slugify(title));
    }
  }, [title, slug, initialPost]);

  return (
    <div className="flex h-full flex-col gap-0 -m-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => void navigate({ to: '/admin/posts' })}>
            <ChevronLeft className="h-4 w-4" />
            Posts
          </Button>
          <Badge variant={status === 'published' ? 'success' : 'secondary'}>
            {status}
          </Badge>
          {isDirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
          {status !== 'published' && initialPost && (
            <Button size="sm" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
              <Send className="h-4 w-4" />
              Publish
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main editor area */}
        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          <Input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
            placeholder="Post title..."
            className="mb-4 border-0 p-0 text-3xl font-bold shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
          />

          <TipTapEditor
            content={content}
            onChange={handleContentChange}
            className="flex-1"
            placeholder="Start writing your post..."
          />
        </div>

        {/* Sidebar */}
        <div className="w-72 shrink-0 overflow-y-auto border-l bg-card">
          <Tabs value={sidebarTab} onValueChange={setSidebarTab}>
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="status" className="flex-1" title="Status">
                <LayoutList className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex-1" title="SEO">
                <Settings2 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex-1" title="AI">
                <Sparkles className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="revisions" className="flex-1" title="Revisions">
                <Clock className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="status" className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>URL Slug</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-slug" />
              </div>

              <div className="space-y-1.5">
                <Label>Excerpt</Label>
                <Textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief description..."
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1.5">
                  {tags?.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        setSelectedTagIds((prev) =>
                          prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id],
                        )
                      }
                      className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                        selectedTagIds.includes(tag.id)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label>SEO Title</Label>
                <Input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={title}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">{seoTitle.length}/60 chars</p>
              </div>

              <div className="space-y-1.5">
                <Label>Meta Description</Label>
                <Textarea
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value)}
                  placeholder="Brief description for search engines..."
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">{seoDesc.length}/160 chars</p>
              </div>

              {/* SEO preview */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Google Preview</p>
                <p className="text-sm font-medium text-blue-600 truncate">{seoTitle || title || 'Post Title'}</p>
                <p className="text-xs text-green-700 truncate">speakle.local/blog/{slug || 'post-slug'}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{seoDesc || excerpt || 'Post description...'}</p>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="p-4">
              <Tabs value={aiTab} onValueChange={setAiTab}>
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="generate" className="flex-1 text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Generate
                  </TabsTrigger>
                  <TabsTrigger value="research" className="flex-1 text-xs">
                    <Search className="h-3 w-3 mr-1" />
                    Research
                  </TabsTrigger>
                  <TabsTrigger value="voice" className="flex-1 text-xs">
                    <Mic className="h-3 w-3 mr-1" />
                    Voice
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="generate">
                  <AIGeneratePanel onGenerated={handleAIContent} />
                </TabsContent>
                <TabsContent value="research">
                  <AIResearchPanel onGenerated={handleAIContent} />
                </TabsContent>
                <TabsContent value="voice">
                  <VoiceDictationPanel onTranscribed={handleAIContent} />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="revisions" className="p-4">
              <RevisionsList postId={initialPost?.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function RevisionsList({ postId }: { postId?: string }) {
  const { data: revisions } = useQuery({
    queryKey: ['revisions', postId],
    queryFn: () => postsApi.listRevisions(postId!),
    enabled: !!postId,
  });

  if (!postId) return <p className="text-sm text-muted-foreground">Save the post to see revisions.</p>;
  if (!revisions?.length) return <p className="text-sm text-muted-foreground">No revisions yet.</p>;

  return (
    <ul className="space-y-2">
      {revisions.map((rev) => (
        <li key={rev.id} className="rounded border p-2 text-xs">
          <p className="font-medium truncate">{rev.title}</p>
          <p className="text-muted-foreground">{rev.message ?? 'Auto-save'}</p>
          <p className="text-muted-foreground">{new Date(rev.createdAt).toLocaleString()}</p>
        </li>
      ))}
    </ul>
  );
}
