import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/api/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Save, Eye, EyeOff } from 'lucide-react';

export const Route = createFileRoute('/admin/_layout/settings/')({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="ai">AI Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="general"><GeneralSettings /></TabsContent>
        <TabsContent value="seo"><SEOSettings /></TabsContent>
        <TabsContent value="ai"><AISettings /></TabsContent>
      </Tabs>
    </div>
  );
}

function GeneralSettings() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['settings', 'general'],
    queryFn: () => settingsApi.getCategory('general'),
  });

  const [siteTitle, setSiteTitle] = useState('');
  const [siteDesc, setSiteDesc] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [showHomepage, setShowHomepage] = useState(true);

  useEffect(() => {
    if (data) {
      setSiteTitle((data['site_title'] as string) ?? '');
      setSiteDesc((data['site_description'] as string) ?? '');
      setSiteUrl((data['site_url'] as string) ?? '');
      setShowHomepage((data['show_homepage'] as boolean | undefined) ?? true);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      settingsApi.batchUpdate([
        { key: 'site_title', value: siteTitle, category: 'general' },
        { key: 'site_description', value: siteDesc, category: 'general' },
        { key: 'site_url', value: siteUrl, category: 'general' },
        { key: 'show_homepage', value: showHomepage, category: 'general' },
      ]),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['settings'] });
      toast({ title: 'Settings saved', variant: 'success' });
    },
  });

  return (
    <Card>
      <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Site Title</Label>
          <Input value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Site Description</Label>
          <Input value={siteDesc} onChange={(e) => setSiteDesc(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Site URL</Label>
          <Input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} type="url" />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label>Show Homepage</Label>
            <p className="text-xs text-muted-foreground">
              When off, visitors go straight to the blog instead of a landing page.
            </p>
          </div>
          <Switch checked={showHomepage} onCheckedChange={setShowHomepage} />
        </div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}

function SEOSettings() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['settings', 'seo'],
    queryFn: () => settingsApi.getCategory('seo'),
  });

  const [defaultDesc, setDefaultDesc] = useState('');
  const [gaId, setGaId] = useState('');

  useEffect(() => {
    if (data) {
      setDefaultDesc((data['default_meta_description'] as string) ?? '');
      setGaId((data['google_analytics_id'] as string) ?? '');
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      settingsApi.batchUpdate([
        { key: 'default_meta_description', value: defaultDesc, category: 'seo' },
        { key: 'google_analytics_id', value: gaId, category: 'seo' },
      ]),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['settings'] });
      toast({ title: 'SEO settings saved', variant: 'success' });
    },
  });

  return (
    <Card>
      <CardHeader><CardTitle>SEO Settings</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Default Meta Description</Label>
          <Input value={defaultDesc} onChange={(e) => setDefaultDesc(e.target.value)} maxLength={160} />
          <p className="text-xs text-muted-foreground">{defaultDesc.length}/160 chars</p>
        </div>
        <div className="space-y-1.5">
          <Label>Google Analytics Measurement ID</Label>
          <Input value={gaId} onChange={(e) => setGaId(e.target.value)} placeholder="G-XXXXXXXXXX" />
        </div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}

function AISettings() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['settings', 'ai'],
    queryFn: () => settingsApi.getCategory('ai'),
  });

  const [provider, setProvider] = useState('anthropic');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [tavilyKey, setTavilyKey] = useState('');
  const [model, setModel] = useState('');
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    if (data) {
      setProvider((data['ai_provider'] as string) ?? 'anthropic');
      setModel((data['ai_default_model'] as string) ?? '');
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => {
      const updates: Array<{ key: string; value: unknown; category: string }> = [
        { key: 'ai_provider', value: provider, category: 'ai' },
        { key: 'ai_default_model', value: model, category: 'ai' },
      ];
      if (anthropicKey) updates.push({ key: 'anthropic_api_key', value: anthropicKey, category: 'ai' });
      if (openaiKey) updates.push({ key: 'openai_api_key', value: openaiKey, category: 'ai' });
      if (tavilyKey) updates.push({ key: 'tavily_api_key', value: tavilyKey, category: 'ai' });
      return settingsApi.batchUpdate(updates);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['settings'] });
      setAnthropicKey('');
      setOpenaiKey('');
      setTavilyKey('');
      toast({ title: 'AI settings saved', variant: 'success' });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Settings</CardTitle>
        <CardDescription>Configure your AI provider for post generation and research features.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>AI Provider</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
              <SelectItem value="openai">OpenAI (GPT)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Anthropic API Key</Label>
            <button type="button" onClick={() => setShowKeys(!showKeys)} className="text-xs text-muted-foreground hover:text-foreground">
              {showKeys ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
          </div>
          <Input
            type={showKeys ? 'text' : 'password'}
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
            placeholder="sk-ant-... (leave blank to keep existing)"
          />
        </div>

        <div className="space-y-1.5">
          <Label>OpenAI API Key</Label>
          <Input
            type={showKeys ? 'text' : 'password'}
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder="sk-... (leave blank to keep existing)"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Tavily API Key (for AI Research)</Label>
          <Input
            type={showKeys ? 'text' : 'password'}
            value={tavilyKey}
            onChange={(e) => setTavilyKey(e.target.value)}
            placeholder="tvly-... (leave blank to keep existing)"
          />
          <p className="text-xs text-muted-foreground">Required for the Research &amp; Draft feature. Get a key at tavily.com</p>
        </div>

        <div className="space-y-1.5">
          <Label>Default Model (optional)</Label>
          <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. claude-sonnet-4-5 or gpt-4o" />
        </div>

        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <Save className="h-4 w-4" />
          Save AI Settings
        </Button>
      </CardContent>
    </Card>
  );
}
