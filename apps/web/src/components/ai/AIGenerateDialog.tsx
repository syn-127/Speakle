import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles } from 'lucide-react';
import { fetchStream } from '@/api/client';
import { toast } from '@/components/ui/use-toast';

interface AIGenerateDialogProps {
  onGenerated: (markdown: string) => void;
}

export function AIGeneratePanel({ onGenerated }: AIGenerateDialogProps) {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setPreview('');

    try {
      let accumulated = '';
      await fetchStream(
        '/ai/generate',
        {
          topic,
          tone,
          length,
          keywords: keywords ? keywords.split(',').map((k) => k.trim()) : [],
        },
        (chunk) => {
          accumulated += chunk;
          setPreview(accumulated);
        },
      );
      onGenerated(accumulated);
      toast({ title: 'Post generated!', description: 'AI content added to editor.', variant: 'success' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      toast({ title: 'Generation failed', description: message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="ai-topic">Topic *</Label>
        <Input
          id="ai-topic"
          placeholder="e.g. The future of renewable energy"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tone</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="conversational">Conversational</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Length</Label>
          <Select value={length} onValueChange={setLength}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Short (~500 words)</SelectItem>
              <SelectItem value="medium">Medium (~1000 words)</SelectItem>
              <SelectItem value="long">Long (~2000 words)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ai-keywords">Keywords (comma-separated)</Label>
        <Input
          id="ai-keywords"
          placeholder="SEO, sustainability, innovation"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
      </div>

      {preview && (
        <div className="max-h-40 overflow-y-auto rounded border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6">{preview}</p>
        </div>
      )}

      <Button onClick={handleGenerate} disabled={!topic.trim() || isGenerating} className="w-full">
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate Post
          </>
        )}
      </Button>
    </div>
  );
}
