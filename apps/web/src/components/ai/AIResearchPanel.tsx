import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BookOpen, ExternalLink } from 'lucide-react';
import { fetchSSEStream } from '@/api/client';
import { toast } from '@/components/ui/use-toast';
import type { ResearchBrief } from '@speakle/shared';

interface AIResearchPanelProps {
  onGenerated: (markdown: string) => void;
}

export function AIResearchPanel({ onGenerated }: AIResearchPanelProps) {
  const [topic, setTopic] = useState('');
  const [depth, setDepth] = useState<'standard' | 'deep'>('standard');
  const [isResearching, setIsResearching] = useState(false);
  const [brief, setBrief] = useState<ResearchBrief | null>(null);
  const [streamPreview, setStreamPreview] = useState('');

  const handleResearch = async () => {
    if (!topic.trim()) return;
    setIsResearching(true);
    setBrief(null);
    setStreamPreview('');

    try {
      let accumulated = '';
      await fetchSSEStream('/ai/research', { topic, depth }, (type, data) => {
        if (type === 'brief') {
          setBrief(data as ResearchBrief);
        } else if (type === 'text') {
          accumulated += data as string;
          setStreamPreview(accumulated);
        } else if (type === 'done') {
          onGenerated(accumulated);
          toast({ title: 'Research complete!', description: 'Research-based post added to editor.', variant: 'success' });
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Research failed';
      toast({ title: 'Research failed', description: message, variant: 'destructive' });
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="research-topic">Research Topic *</Label>
        <Input
          id="research-topic"
          placeholder="e.g. Latest advances in quantum computing 2025"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Research Depth</Label>
        <Select value={depth} onValueChange={(v) => setDepth(v as 'standard' | 'deep')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard (8 sources)</SelectItem>
            <SelectItem value="deep">Deep (15 sources)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {brief && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Key Findings</p>
          <ul className="space-y-1">
            {brief.keyFindings.slice(0, 4).map((finding, i) => (
              <li key={i} className="text-xs text-foreground flex gap-1.5">
                <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                {finding}
              </li>
            ))}
          </ul>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2">Sources</p>
          <ul className="space-y-0.5">
            {brief.sources.slice(0, 5).map((source, i) => (
              <li key={i} className="flex items-center gap-1.5 text-xs">
                <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {streamPreview && !brief?.sources.length && (
        <div className="max-h-32 overflow-y-auto rounded border bg-muted/30 p-2">
          <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6">{streamPreview}</p>
        </div>
      )}

      <Button onClick={handleResearch} disabled={!topic.trim() || isResearching} className="w-full">
        {isResearching ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Researching...
          </>
        ) : (
          <>
            <BookOpen className="h-4 w-4" />
            Research &amp; Draft Post
          </>
        )}
      </Button>
    </div>
  );
}
