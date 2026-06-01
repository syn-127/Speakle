# Speakle

An AI-powered blog platform. Create posts with AI generation, AI-powered research, and voice dictation. Manage your blog through a modern admin panel with theme switching, categories, SEO settings, and plugin support.

## Features

- **Rich text editor** (TipTap) with formatting, image upload, and slash commands
- **AI post generation** — give a topic and tone, get a full draft
- **AI research & write** — AI researches a topic via Tavily web search and writes a data-driven post with citations
- **Voice dictation** — record your voice (Web Speech API or audio upload), AI structures it into a blog post
- **Admin dashboard** — posts, categories, tags, media library, themes, plugins, settings
- **Three built-in themes** — Default, Minimal, Magazine
- **SEO management** — per-post SEO, meta tags, RSS feed, sitemap
- **Multi-provider AI** — Anthropic (Claude) or OpenAI (GPT), configured via admin panel

## Tech Stack

- **Backend**: Node.js + [Hono](https://hono.dev/) + TypeScript
- **Frontend**: React 18 + [Vite](https://vite.dev/) + [TanStack Router](https://tanstack.com/router) + Tailwind CSS v4
- **Database**: SQLite via [Drizzle ORM](https://orm.drizzle.team/)
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai/) supporting Anthropic + OpenAI
- **Monorepo**: pnpm workspaces

## Quick Start

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9 (`npm install -g pnpm`)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example apps/api/.env
# Edit apps/api/.env and add your API keys

# 3. Run database migrations
pnpm db:migrate

# 4. Seed default data (admin user + themes)
pnpm db:seed

# 5. Start development servers (in two terminals)
pnpm dev:api   # API on :3002
pnpm dev:web   # Frontend on :5173
```

Open **http://localhost:5173/admin/login**

Default credentials: `admin@speakle.local` / `speakle-admin`

### Configure AI

1. Go to **Admin → Settings → AI Settings**
2. Select your AI provider (Anthropic or OpenAI)
3. Enter your API key
4. (Optional) Enter a Tavily API key for the Research & Draft feature

## Project Structure

```
speakle/
├── apps/
│   ├── api/          # Hono API server (port 3002)
│   └── web/          # React frontend (port 5173)
├── packages/
│   ├── shared/       # Shared TypeScript types + Zod schemas
│   ├── db/           # Drizzle schema + migrations
│   └── ai/           # AI provider abstraction + task functions
├── LICENSE
└── pnpm-workspace.yaml
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev:api` | Start API server with hot reload |
| `pnpm dev:web` | Start frontend dev server |
| `pnpm build` | Build all packages |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:seed` | Seed default admin + themes |
| `pnpm db:generate` | Generate migrations from schema changes |
| `pnpm typecheck` | TypeScript check all packages |

## License

See [LICENSE](./LICENSE) — personal use, self-hosting, and modification are permitted. Commercial redistribution is not.
