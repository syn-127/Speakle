import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Logo, LogoMark } from '@/components/Logo';
import {
  Github, Sparkles, Search, Mic, Code2, Database, Lock, ArrowRight,
} from 'lucide-react';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    let showHomepage = true;
    try {
      const config = await api.get<{ showHomepage: boolean }>('/blog/site-config');
      showHomepage = config.showHomepage;
    } catch {
      // If the setting can't be fetched, fail open and show the landing page.
    }
    if (!showHomepage) throw redirect({ to: '/blog' });
  },
  component: Home,
});

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI writing assistant',
    description: 'Draft a post from a prompt using Claude or GPT, then edit it like any other post. The model writes the first pass, you keep editorial control.',
  },
  {
    icon: Search,
    title: 'Research-grounded drafts',
    description: 'Tavily-powered research pulls in real sources before the model writes, instead of asking an LLM to invent facts from memory.',
  },
  {
    icon: Mic,
    title: 'Voice dictation',
    description: 'Talk instead of type, right inside the editor, for the days when typing a full draft feels like the wrong tool.',
  },
  {
    icon: Code2,
    title: 'A real rich-text editor',
    description: 'TipTap-based editing with proper headings, lists, code, and links, not a textarea pretending to be a CMS.',
  },
  {
    icon: Database,
    title: 'Self-hosted, your data',
    description: 'SQLite locally, Turso in production. No third-party service holding your posts hostage behind a subscription.',
  },
  {
    icon: Lock,
    title: 'Source-available',
    description: 'The full codebase is on GitHub under a personal-use license: read it, fork it, run it yourself.',
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/"><Logo /></Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/blog" className="hover:text-foreground">Blog</Link>
            <a
              href="https://github.com/syn-127/Speakle"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <Link to="/admin" className="hover:text-foreground">Admin</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="container mx-auto max-w-3xl px-4 py-20 text-center">
          <LogoMark className="mx-auto h-14 w-14" />
          <h1 className="mt-4 text-5xl font-bold tracking-tight">Speakle</h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            A self-hosted, AI-assisted blogging platform for people who'd rather own their
            words than rent them from a SaaS. Write yourself, generate a draft, or dictate
            it out loud, then publish from an editor that gets out of the way.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/blog">
                Read the Blog
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="https://github.com/syn-127/Speakle" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </div>
        </section>

        <section className="border-t bg-muted/30">
          <div className="container mx-auto max-w-5xl px-4 py-16">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="rounded-lg border bg-card p-6">
                  <feature.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex items-center justify-between px-4 py-6 text-sm text-muted-foreground">
          <Logo textClassName="text-sm font-semibold" iconClassName="h-5 w-5" />
          <a
            href="https://github.com/syn-127/Speakle"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground"
          >
            <Github className="h-4 w-4" />
            github.com/syn-127/Speakle
          </a>
        </div>
      </footer>
    </div>
  );
}
