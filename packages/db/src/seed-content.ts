import { db, setDb, posts, postTags, tags, categories, users } from './index';
import * as schema from './schema/index';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

async function connectRemoteIfConfigured() {
  const url = process.env['TURSO_DATABASE_URL'];
  if (!url) return;
  const { createClient } = await import('@libsql/client');
  const { drizzle } = await import('drizzle-orm/libsql');
  const client = createClient({ url, authToken: process.env['TURSO_AUTH_TOKEN'] });
  setDb(drizzle(client, { schema }) as unknown as Parameters<typeof setDb>[0]);
}

// --- tiny markdown-lite -> {TipTap JSON, HTML} compiler ------------------
// Supports: ## / ### headings, - bullets, 1. numbered lists, > blockquotes,
// ``` fenced code blocks, and inline **bold** / `code` / [text](url).

type JsonNode = Record<string, unknown>;

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseInline(text: string): { nodes: JsonNode[]; html: string } {
  const nodes: JsonNode[] = [];
  let html = '';
  const re = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  const pushText = (t: string) => {
    if (!t) return;
    nodes.push({ type: 'text', text: t });
    html += escapeHtml(t);
  };

  while ((m = re.exec(text))) {
    pushText(text.slice(lastIndex, m.index));
    if (m[1] !== undefined) {
      nodes.push({ type: 'text', text: m[1], marks: [{ type: 'bold' }] });
      html += `<strong>${escapeHtml(m[1])}</strong>`;
    } else if (m[2] !== undefined) {
      nodes.push({ type: 'text', text: m[2], marks: [{ type: 'code' }] });
      html += `<code>${escapeHtml(m[2])}</code>`;
    } else if (m[3] !== undefined && m[4] !== undefined) {
      nodes.push({ type: 'text', text: m[3], marks: [{ type: 'link', attrs: { href: m[4] } }] });
      html += `<a href="${m[4]}">${escapeHtml(m[3])}</a>`;
    }
    lastIndex = re.lastIndex;
  }
  pushText(text.slice(lastIndex));
  return { nodes, html };
}

function compile(markdown: string): { json: string; html: string } {
  const lines = markdown.trim().split('\n');
  const docContent: JsonNode[] = [];
  const htmlParts: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (line.trim() === '') {
      i++;
      continue;
    }

    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.startsWith('```')) {
        codeLines.push(lines[i]!);
        i++;
      }
      i++;
      const codeNodes: JsonNode[] = [];
      codeLines.forEach((cl, idx) => {
        if (idx > 0) codeNodes.push({ type: 'hardBreak' });
        codeNodes.push({ type: 'text', text: cl.length ? cl : ' ', marks: [{ type: 'code' }] });
      });
      docContent.push({ type: 'paragraph', content: codeNodes });
      htmlParts.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    if (line.startsWith('### ')) {
      const { nodes, html } = parseInline(line.slice(4));
      docContent.push({ type: 'heading', attrs: { level: 3 }, content: nodes });
      htmlParts.push(`<h3>${html}</h3>`);
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      const { nodes, html } = parseInline(line.slice(3));
      docContent.push({ type: 'heading', attrs: { level: 2 }, content: nodes });
      htmlParts.push(`<h2>${html}</h2>`);
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i]!.startsWith('> ')) {
        quoteLines.push(lines[i]!.slice(2));
        i++;
      }
      const { nodes, html } = parseInline(quoteLines.join(' '));
      docContent.push({ type: 'blockquote', content: [{ type: 'paragraph', content: nodes }] });
      htmlParts.push(`<blockquote><p>${html}</p></blockquote>`);
      continue;
    }

    if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i]!.startsWith('- ')) {
        items.push(lines[i]!.slice(2));
        i++;
      }
      const compiled = items.map((item) => parseInline(item));
      docContent.push({
        type: 'bulletList',
        content: compiled.map((c) => ({ type: 'listItem', content: [{ type: 'paragraph', content: c.nodes }] })),
      });
      htmlParts.push(`<ul>${compiled.map((c) => `<li>${c.html}</li>`).join('')}</ul>`);
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^\d+\. /, ''));
        i++;
      }
      const compiled = items.map((item) => parseInline(item));
      docContent.push({
        type: 'orderedList',
        content: compiled.map((c) => ({ type: 'listItem', content: [{ type: 'paragraph', content: c.nodes }] })),
      });
      htmlParts.push(`<ol>${compiled.map((c) => `<li>${c.html}</li>`).join('')}</ol>`);
      continue;
    }

    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i]!.trim() !== '' &&
      !lines[i]!.startsWith('#') &&
      !lines[i]!.startsWith('```') &&
      !lines[i]!.startsWith('- ') &&
      !lines[i]!.startsWith('> ') &&
      !/^\d+\. /.test(lines[i]!)
    ) {
      paraLines.push(lines[i]!);
      i++;
    }
    const { nodes, html } = parseInline(paraLines.join(' '));
    docContent.push({ type: 'paragraph', content: nodes });
    htmlParts.push(`<p>${html}</p>`);
  }

  return { json: JSON.stringify({ type: 'doc', content: docContent }), html: htmlParts.join('\n') };
}

function estimateReadingTime(html: string): number {
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

// --- taxonomy -------------------------------------------------------------

const CATEGORY_DEFS = [
  { slug: 'web-development', name: 'Web Development', color: '#3b82f6', description: 'Frontend, backend, and everything shipping to a browser.' },
  { slug: 'ai-ml', name: 'AI & Machine Learning', color: '#8b5cf6', description: 'LLMs, RAG, and applied machine learning in production.' },
  { slug: 'devops-cloud', name: 'DevOps & Cloud', color: '#10b981', description: 'Infrastructure, containers, and shipping software reliably.' },
  { slug: 'programming-languages', name: 'Programming Languages', color: '#f59e0b', description: 'Language design, type systems, and the tradeoffs between them.' },
  { slug: 'software-careers', name: 'Software Careers', color: '#ec4899', description: 'Growing as an engineer, working on teams, and the non-code parts of the job.' },
] as const;

const TAG_DEFS = [
  'javascript', 'typescript', 'react', 'rust', 'sqlite', 'docker', 'kubernetes',
  'git', 'llm', 'ai', 'rag', 'performance', 'career', 'testing', 'open-source',
] as const;

// --- posts -----------------------------------------------------------------

interface PostDef {
  slug: string;
  title: string;
  excerpt: string;
  seoDescription: string;
  category: (typeof CATEGORY_DEFS)[number]['slug'];
  tags: (typeof TAG_DEFS)[number][];
  status: 'published' | 'draft' | 'scheduled';
  daysAgo?: number;
  daysAhead?: number;
  aiGenerated?: boolean;
  body: string;
}

const POSTS: PostDef[] = [
  {
    slug: 'typescript-structural-typing-java-devs',
    title: "Why TypeScript's Structural Typing Still Trips Up Java Developers",
    excerpt: "TypeScript's type system looks familiar to anyone coming from Java, until you actually lean on it. Here's where the mental model breaks and how to adjust.",
    seoDescription: "A look at why structural typing in TypeScript surprises engineers coming from nominally-typed languages like Java or C#.",
    category: 'programming-languages',
    tags: ['typescript', 'javascript'],
    status: 'published',
    daysAgo: 12,
    body: `
Every Java developer's first week with TypeScript goes the same way. The syntax is close enough to feel like home: interfaces, generics, access modifiers if you squint. Then someone passes an object literal where a class instance was expected, the compiler shrugs, and everything you thought you knew about type systems gets a little shaky.

## Nominal vs. structural, in one example

In Java, a type is defined by its name and declaration. Two classes with identical fields are still different types unless one explicitly implements or extends the other. TypeScript doesn't work that way. It compares shapes.

\`\`\`ts
interface User {
  id: string;
  name: string;
}

function greet(user: User) {
  return \`Hello, \${user.name}\`;
}

// No "implements User" anywhere. Still valid.
greet({ id: '1', name: 'Ada', role: 'admin' });
\`\`\`

That last call works because the object has at least the shape \`User\` requires. TypeScript doesn't care where the object came from, only whether it satisfies the contract. This is structural typing, and it's the same idea behind Go's interfaces, just with more syntax sugar around it.

## Where it actually bites

The surprise usually isn't the basic case above, it's the corners:

- **Excess properties are fine on existing objects, but not on literals.** The \`greet({ id, name, role })\` call above works because the object came from a variable in most real code, but passing that literal directly to a parameter typed as \`User\` triggers an "excess property" error. TypeScript special-cases fresh object literals to catch typos.
- **Empty interfaces match almost everything.** An interface with no required members is structurally compatible with nearly any object, which makes "requires implementation" style guards useless unless you add a discriminant field.
- **Function parameter comparison is bivariant** in method syntax by default, which means TypeScript is looser about function argument compatibility than Java's checked exceptions and overload rules would ever allow.

## Adjusting the mental model

The fix isn't to fight the type system, it's to stop asking "is this the right class" and start asking "does this satisfy the shape." A few habits help:

1. Prefer \`type\` aliases or \`interface\` definitions that describe the minimum shape you actually use, not the full domain object.
2. Use branded types (\`type UserId = string & { __brand: 'UserId' }\`) when you need nominal-style safety, like preventing an \`OrderId\` from being passed where a \`UserId\` is expected.
3. Reach for \`unknown\` instead of \`any\` at boundaries, and narrow explicitly. Structural typing plus \`any\` is where most of the "TypeScript didn't catch this" bug reports come from.

> Structural typing isn't a weaker version of nominal typing. It's a different tool, optimized for a language where objects are created ad hoc constantly. Once that clicks, most of the "gotchas" turn into "oh, that's actually convenient."

The switch takes a few weeks, not because the syntax is hard, but because unlearning "type equals name" is a real habit to break.
`,
  },
  {
    slug: 'local-first-sqlite-drizzle',
    title: 'Building a Local-First App with SQLite and Drizzle ORM',
    excerpt: 'SQLite plus a typed ORM is a surprisingly complete stack for local-first apps. Here is what that setup looks like in practice, warts included.',
    seoDescription: 'Notes on using SQLite and Drizzle ORM to build a fast, typed, local-first application without reaching for Postgres.',
    category: 'web-development',
    tags: ['sqlite', 'typescript', 'performance'],
    status: 'published',
    daysAgo: 9,
    body: `
Most side projects reach for Postgres out of habit, then spend a weekend fighting connection pools and hosting bills for a database that peaks at a few requests a minute. For a lot of apps, especially anything that can run as a single process, SQLite plus a typed query layer is the better default.

## Why SQLite holds up

SQLite gets dismissed as a toy database because it ships as a file, but the engine underneath is genuinely fast, ACID-compliant, and handles concurrent reads well. The two things people actually run into are write concurrency and remote access, and both have known answers:

- **WAL mode** (\`journal_mode = WAL\`) lets readers and a single writer proceed without blocking each other, which covers the vast majority of small-to-medium app workloads.
- **Turso or LiteFS** solve the "I need this reachable over the network" problem without giving up the SQLite file format.

## Drizzle as the typed layer

Drizzle ORM's pitch is that the schema you write in TypeScript is the schema, no separate DSL to keep in sync.

\`\`\`ts
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  status: text('status', { enum: ['draft', 'published'] }).notNull(),
  createdAt: integer('created_at').notNull(),
});
\`\`\`

That table definition is also the source for \`drizzle-kit generate\`, which produces migrations, and for every query's return type. Compare that to hand-writing SQL and a separate interface, then keeping the two from drifting apart every time a column changes.

## The parts that still hurt

Nothing is free. A few things to plan for before committing to this stack:

1. **Timestamps are just integers.** SQLite has no native date type, so you're storing epoch millis and converting at the edges. Fine once you accept it, confusing the first time you forget.
2. **Migrations are less forgiving of destructive changes.** Renaming a column is a drop-and-recreate under the hood in some SQLite versions, which means migration order matters more than it does with Postgres.
3. **Full-text search needs an extension.** SQLite's FTS5 module is solid, but it's opt-in, and Drizzle doesn't model virtual tables as cleanly as regular ones.

None of these are dealbreakers. They're the kind of tradeoffs that are worth knowing about on day one instead of discovering during a migration at 2am. For a self-hosted, single-writer app, the combination of a zero-ops database file and a fully typed query layer removes an entire category of infrastructure decisions you'd otherwise have to make before writing a single feature.
`,
  },
  {
    slug: 'prompt-engineering-grew-up',
    title: "Prompt Engineering Isn't Dead, It Just Grew Up",
    excerpt: 'The "just write a good prompt" era is over. What replaced it looks less like writing and more like systems design.',
    seoDescription: 'Why prompt engineering evolved from clever wording into evaluation harnesses, retrieval design, and structured output contracts.',
    category: 'ai-ml',
    tags: ['llm', 'ai'],
    status: 'published',
    daysAgo: 7,
    aiGenerated: true,
    body: `
A year or two ago, "prompt engineering" mostly meant finding the magic phrase that made a model behave: adding "think step by step," threatening it with a tip, or discovering that asking twice somehow worked better. That phase is mostly over, not because prompts stopped mattering, but because the actual bottleneck moved somewhere else.

## What changed

Models got more instruction-following and less sensitive to incantations. The wording still matters, but it's no longer the highest-leverage lever. The work that actually moves reliability now looks like:

- **Structured output contracts.** Instead of parsing free text, you define a schema and force the model to call a tool or return JSON matching it. Most of the "the model ignored my instructions" bugs disappear when the format is enforced rather than requested.
- **Retrieval design**, not prompt wording, determines whether the model has the right facts in front of it. A perfectly worded prompt over the wrong context still produces a wrong answer.
- **Evaluation harnesses.** Teams that ship reliable LLM features almost always have a test set of real inputs and a way to score outputs automatically, so a prompt change is a diff you can measure instead of a vibe you're chasing.

## Prompting is now one layer in a stack

\`\`\`
[ user input ]
     |
[ retrieval / tool calls ]
     |
[ system + prompt template ]
     |
[ model ]
     |
[ output schema validation ]
     |
[ eval / logging ]
\`\`\`

Treat any single layer as the whole solution and you'll spend your time re-wording a prompt to fix a problem that's actually a retrieval gap or a missing validation step.

## What's still genuinely "prompt engineering"

None of this means wording is irrelevant. A few things are still real skills:

1. Writing the system prompt that defines role, constraints, and tone once, cleanly, instead of repeating instructions in every user message.
2. Few-shot examples for tasks where the schema alone doesn't convey the pattern you want, formatting a specific kind of summary, for instance.
3. Knowing when to split one big prompt into two smaller model calls instead of asking for everything at once.

> The skill didn't disappear, it moved up a level. The people who were good at prompt engineering in 2023 are, for the most part, the same people now good at designing the retrieval and evaluation systems around the model. The instinct for "what does the model actually need to see" transferred directly.

If your team is still treating prompt wording as the main lever for reliability, that's usually a sign the eval and retrieval layers haven't been built yet, not that prompting doesn't matter anymore.
`,
  },
  {
    slug: 'docker-compose-patterns-that-scale',
    title: 'Docker Compose for Local Dev: Patterns That Actually Scale',
    excerpt: 'Compose files rot fast once a team grows past two services. A few conventions keep them maintainable well past that point.',
    seoDescription: 'Practical Docker Compose patterns for keeping local development environments maintainable as a project grows.',
    category: 'devops-cloud',
    tags: ['docker'],
    status: 'published',
    daysAgo: 5,
    body: `
Docker Compose is the easiest way to hand a new engineer a working local environment on day one, right up until the file has grown to fifteen services, three of them commented out, and nobody remembers why the Redis container needs that one environment variable. A handful of conventions keep it from getting there.

## Split by concern, not by service count

One \`docker-compose.yml\` is fine for three services. Past that, split into a base file plus overrides:

\`\`\`
docker-compose.yml          # core services, always run
docker-compose.override.yml # local-only tweaks, auto-loaded
docker-compose.ci.yml       # CI-specific overrides
\`\`\`

Compose merges override files automatically in dev, and CI explicitly passes \`-f docker-compose.yml -f docker-compose.ci.yml\`. This keeps the "what actually runs in CI" question answerable by reading a file instead of asking in Slack.

## Health checks, not sleep statements

The single biggest source of flaky local setups is a service starting before its dependency is actually ready.

\`\`\`yaml
services:
  db:
    image: postgres:16
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 2s
      timeout: 2s
      retries: 20

  api:
    depends_on:
      db:
        condition: service_healthy
\`\`\`

\`depends_on\` without a health check only waits for the container to start, not for the process inside it to be ready. That gap is where most "works on the second try" bugs live.

## Named volumes over bind mounts for state

Bind-mounting a database's data directory to a folder in the repo feels convenient until someone's \`node_modules\` bind mount starts fighting with the container's own dependency install, or a stray \`.gitignore\` miss commits gigabytes of Postgres files. Named volumes keep state out of the repo entirely:

- Bind mount source code, so hot reload keeps working.
- Named volume everything the container writes on its own, databases, caches, build artifacts.

## Keep secrets out of the compose file

An \`.env\` file referenced via \`env_file:\` beats hardcoded values in \`docker-compose.yml\`, even for local dev. It's the difference between a compose file that's safe to commit and one that needs a security review every time someone adds a new API key for local testing.

None of these patterns are exotic. They're mostly "treat the compose file like the piece of infrastructure it actually is," which is easy to skip when it started as three services and a database.
`,
  },
  {
    slug: 'hidden-cost-of-useeffect',
    title: 'The Hidden Cost of useEffect: A React Performance Deep Dive',
    excerpt: 'Most useEffect performance problems have nothing to do with the effect itself. They come from what triggers it to re-run.',
    seoDescription: 'A deep dive into common React useEffect performance pitfalls and how dependency arrays quietly cause unnecessary re-renders.',
    category: 'web-development',
    tags: ['react', 'javascript', 'performance'],
    status: 'published',
    daysAgo: 4,
    body: `
Profile almost any slow React app and \`useEffect\` shows up somewhere near the top of the flame graph, not because effects are inherently expensive, but because they tend to re-run far more often than anyone intended.

## The dependency array is the actual bug surface

\`\`\`tsx
function SearchResults({ query }: { query: string }) {
  const [results, setResults] = useState([]);
  const options = { debounce: 300 };

  useEffect(() => {
    fetchResults(query, options).then(setResults);
  }, [query, options]); // options is a new object every render
}
\`\`\`

\`options\` is recreated on every render, so the effect fires on every render regardless of whether \`query\` actually changed. This is the single most common cause of "why is this network request firing constantly" bugs, and it's invisible in the diff, since the code looks correct at a glance.

## Three fixes, in order of preference

1. **Move the object inside the effect** if nothing outside needs it. If \`options\` is only ever used by the fetch call, it doesn't need to exist in the component body at all.
2. **Depend on primitives, not objects.** Destructure the values you actually need (\`options.debounce\`) into the dependency array instead of the whole object.
3. **Memoize with \`useMemo\`** only when the object genuinely needs to be shared across multiple effects or passed to a memoized child. Reaching for \`useMemo\` as the default fix usually means the object shouldn't have existed in that scope to begin with.

## Effects that run to fetch, then fight the fetch

The second common cost is not cancelling stale requests. Type quickly into a search box without cleanup and every keystroke's request resolves in whatever order the network decides, occasionally overwriting fresh results with a stale response.

\`\`\`tsx
useEffect(() => {
  let cancelled = false;
  fetchResults(query).then((data) => {
    if (!cancelled) setResults(data);
  });
  return () => {
    cancelled = true;
  };
}, [query]);
\`\`\`

That cleanup function is cheap to write and eliminates an entire class of race-condition bugs that only show up under real typing speed, which is exactly the kind of bug that never reproduces in a slow, deliberate manual test.

## When the fix is "don't use an effect"

A lot of effects exist to synchronize derived state that could just be computed during render:

\`\`\`tsx
// Unnecessary effect
useEffect(() => {
  setFullName(\`\${firstName} \${lastName}\`);
}, [firstName, lastName]);

// Just compute it
const fullName = \`\${firstName} \${lastName}\`;
\`\`\`

If a value can be derived synchronously from props or state already in scope, an effect is the wrong tool. It adds a render pass, a stale-state window, and one more dependency array to get wrong. The fastest \`useEffect\` is the one that doesn't need to exist.
`,
  },
  {
    slug: 'rust-borrow-checker-love-letter',
    title: "Rust's Borrow Checker: A Love Letter After Six Months",
    excerpt: 'The borrow checker fights you for the first month and then quietly becomes the reason your code stops having a whole category of bugs.',
    seoDescription: "A retrospective on learning Rust's ownership model, from initial frustration to appreciating what it actually prevents.",
    category: 'programming-languages',
    tags: ['rust'],
    status: 'published',
    daysAgo: 3,
    body: `
The first month with Rust is mostly an argument with the compiler. The second month is realizing the compiler was right every single time, which is a genuinely uncomfortable thing to admit about a piece of software.

## The error that teaches the whole model

\`\`\`rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;
    println!("{}", s1); // error: value borrowed after move
}
\`\`\`

Coming from garbage-collected languages, this reads like nonsense. Of course you can still use \`s1\`, it's just a variable. But \`String\` owns a heap allocation, and Rust's rule is that exactly one binding owns a value at a time. Assigning \`s1\` to \`s2\` moves ownership, and the compiler doesn't let you use a value after it's been moved out from under you. That single rule, enforced everywhere, is what eliminates use-after-free and double-free bugs without a garbage collector.

## Borrowing is the escape hatch, with rules

\`\`\`rust
fn print_length(s: &String) {
    println!("{}", s.len());
}

fn main() {
    let s1 = String::from("hello");
    print_length(&s1); // borrow, doesn't move
    println!("{}", s1); // still valid
}
\`\`\`

References let you use a value without taking ownership, but the compiler enforces that you can have either one mutable reference or any number of immutable references, never both at once. That rule is what prevents data races at compile time in concurrent code, not through locks, through the type system refusing to compile code that could race in the first place.

## Where it actually got in the way

Being honest about the friction:

- **Self-referential structs** are genuinely awkward. Anything where a struct needs to hold a reference into its own data requires \`Pin\` or a different data structure entirely, and the error messages there don't explain the underlying issue clearly.
- **Learning curve on lifetimes** is steep enough that most tutorials wave at it and move on. \`'a\` annotations only click after actually hitting three or four lifetime errors and working through what the compiler is actually checking.
- **Refactoring churn.** Changing one function's signature to borrow instead of own can cascade lifetime annotations through several call sites. Frustrating in the moment, but it's the compiler catching a real ownership question you'd otherwise have discovered at runtime.

> The borrow checker isn't punishing you for writing bad code. It's refusing to let you write code where the answer to "who owns this and for how long" is ambiguous. Every other language just lets that ambiguity become a runtime bug instead.

Six months in, the thing that stands out isn't that Rust prevents crashes, plenty of languages do that with a garbage collector. It's that entire categories of concurrency bugs that would take hours to reproduce and debug in another language simply don't compile here.
`,
  },
  {
    slug: 'what-juniors-get-wrong-code-review',
    title: 'What Junior Engineers Get Wrong About Code Review',
    excerpt: "It's rarely about writing bad code. It's about what junior engineers assume a review comment means, and how they respond to it.",
    seoDescription: 'Common code review mistakes junior engineers make and how understanding the actual purpose of review changes how you respond to feedback.',
    category: 'software-careers',
    tags: ['career', 'testing'],
    status: 'published',
    daysAgo: 2,
    body: `
Ask a junior engineer what code review is for and most will say "catching bugs." That's part of it, but it's not the part that explains why senior engineers leave comments on code that already works.

## Review comments aren't verdicts

The most common mistake is treating every comment as a judgment on competence rather than a normal part of getting code into a shared codebase. A comment that says "consider extracting this into a helper" is not "your code is bad," it's "here's how this reads to someone who didn't write it." Every experienced engineer gets that comment regularly, on code that works fine.

Two very different reactions to the same comment:

- **Defensive**: explaining in the PR thread why the current approach is fine, without changing anything.
- **Curious**: asking what specifically would be clearer about the suggested version, then deciding whether to change it.

The second one gets you a better reviewer relationship and, over time, better calibration for what your team actually cares about.

## Nitpicks aren't the point of the review

Naming, formatting, and style comments are the most visible feedback but the least important. The comments worth sitting with are the ones about:

1. **Whether the change does what the ticket says**, not just whether the code runs.
2. **What happens on the failure path.** A junior PR's tests almost always cover the happy path only; the review is often the first time anyone asks "what if this API call times out."
3. **Whether this change makes the next change harder.** Senior reviewers are frequently reacting to a pattern they've seen cause problems three months later, not to anything wrong with the diff today.

## Small PRs are a gift to your reviewer, not a formality

A 40-line PR gets a thoughtful review in ten minutes. A 900-line PR gets a skim, an approval, and a bug in production two weeks later that a real review would have caught. Splitting work into reviewable chunks isn't busywork, it's the difference between feedback that actually improves the code and feedback that's really just a formality because nobody had time to read all of it carefully.

> The engineers who improve fastest aren't the ones who write the fewest review comments. They're the ones who ask "why" on the comments they don't immediately understand instead of just complying or arguing.

Code review is one of the few structured feedback loops most engineers get on their day-to-day work. Treating it as an obstacle to clear instead of information about how your code reads to someone else is the single biggest thing holding back otherwise strong junior engineers.
`,
  },
  {
    slug: 'vector-databases-explained',
    title: 'Vector Databases Explained: RAG Without the Hype',
    excerpt: "Vector search is doing one specific job: finding text that's semantically similar to a query. Here's what's actually happening under the hood.",
    seoDescription: 'A plain explanation of embeddings, vector search, and how retrieval-augmented generation actually works, without the marketing language.',
    category: 'ai-ml',
    tags: ['rag', 'llm', 'ai'],
    status: 'published',
    daysAgo: 1,
    aiGenerated: true,
    body: `
Strip away the marketing and a vector database is doing one job: given a query, find the stored items whose embeddings are numerically closest to it. Everything else, RAG pipelines, semantic search, "chat with your docs" products, is built on top of that one operation.

## What an embedding actually is

An embedding model turns text into a fixed-length array of numbers, typically several hundred to a few thousand dimensions, such that texts with similar meaning end up close together in that space.

\`\`\`
"How do I reset my password?"  -> [0.021, -0.14, 0.87, ...]
"password reset instructions"  -> [0.019, -0.12, 0.91, ...]
"best pizza in Chicago"        -> [0.71, 0.33, -0.02, ...]
\`\`\`

The first two vectors land close together despite sharing almost no exact words. That's the entire value proposition over keyword search: it matches on meaning, not string overlap.

## Why not just use a regular index

A normal database index handles exact matches and ranges efficiently. Finding "the nearest 10 vectors out of 5 million" is a different problem, brute-force comparison against every stored vector, and it doesn't scale past a small dataset. Vector databases solve this with approximate nearest neighbor (ANN) algorithms, most commonly HNSW (Hierarchical Navigable Small World graphs), which build a graph structure that lets you find "close enough" neighbors in logarithmic rather than linear time, trading a small amount of recall for a large amount of speed.

## Where RAG actually fits in

Retrieval-augmented generation is the pattern of using vector search to find relevant chunks of text, then handing those chunks to an LLM as context before asking it to answer.

\`\`\`
1. Split documents into chunks, embed each chunk, store in vector DB
2. User asks a question, embed the question
3. Vector search finds the top-k most similar chunks
4. Pass those chunks + the question to the LLM
5. LLM answers, grounded in the retrieved text
\`\`\`

The LLM isn't searching your documents. The vector database does that. The model's only job is synthesizing an answer from whatever text got handed to it, which is exactly why retrieval quality matters more than prompt wording for most RAG bugs, a wrong or missing chunk produces a wrong answer no matter how the prompt is phrased.

## The failure modes worth knowing about

- **Chunking strategy matters more than model choice.** Splitting mid-sentence or mid-table destroys the semantic coherence embeddings depend on.
- **Recall, not precision, is usually the actual problem.** If the right chunk never makes it into the top-k results, no amount of prompt engineering downstream fixes it.
- **Embeddings age.** A document corpus that changes over time needs a re-embedding strategy, not just an insert-once pipeline.

None of this requires the hype. It's nearest-neighbor search over a numeric representation of meaning, wired up to a model that's good at turning retrieved text into a coherent answer.
`,
  },
  {
    slug: 'kubernetes-for-small-teams',
    title: "Kubernetes for Small Teams: When It's Worth It (and When It's Not)",
    excerpt: "Kubernetes solves problems most small teams don't have yet, and creates a few they definitely will. Here's how to tell which side you're on.",
    seoDescription: 'A practical framework for small engineering teams deciding whether Kubernetes is worth the operational overhead.',
    category: 'devops-cloud',
    tags: ['kubernetes', 'docker'],
    status: 'draft',
    body: `
Every "we migrated to Kubernetes" post reads like a success story, which makes sense, nobody blogs about the migration they quietly reverted six months later. For a team under, say, fifteen engineers, the honest framing is that Kubernetes is a solution to problems you may not have yet, purchased with operational complexity you'll definitely have starting day one.

## The problems Kubernetes actually solves

- Running many services across many machines with automatic rescheduling when a node dies.
- Fine-grained autoscaling per service based on real load.
- A consistent deployment interface across teams that would otherwise each invent their own.

## The problems it doesn't solve for a small team

- It doesn't make a single monolith deploy more reliably. A well-configured systemd service or a managed container platform (Fly, Render, Cloud Run) does that with a fraction of the YAML.
- It doesn't remove the need for someone to actually understand networking, RBAC, and resource limits, it just moves that requirement from "optional" to "load-bearing for every deploy."

## A rough decision framework

1. **Under 5 services, one region:** almost certainly not worth it yet. A managed container platform gets you 90% of the benefit with a fraction of the operational surface area.
2. **Multi-region, or genuinely spiky autoscaling needs:** starts to make sense, assuming someone on the team already has real operational Kubernetes experience, not just a weekend course.
3. **Compliance or isolation requirements that specifically call for it:** sometimes the decision isn't really a choice.

Draft note: still need a section on the actual migration cost (CI changes, observability stack, on-call runbooks) before this is ready to publish.
`,
  },
  {
    slug: 'git-rebase-vs-merge',
    title: 'Git Rebase vs Merge: Ending the Debate on My Team',
    excerpt: "The rebase-vs-merge argument is really two different questions wearing one costume. Separating them is what actually ended the debate.",
    seoDescription: 'How separating "what should history look like" from "how do I integrate a branch" resolves the git rebase vs merge debate.',
    category: 'web-development',
    tags: ['git', 'open-source'],
    status: 'scheduled',
    daysAhead: 4,
    body: `
Every team eventually has the rebase-vs-merge conversation, usually right after someone force-pushes over someone else's work. The argument goes in circles because it's actually two separate questions being debated as if they were one.

## Question one: what should the history look like

Rebase advocates want a linear history, one commit per logical change, easy to \`git log --oneline\` and understand in order. Merge advocates want history to reflect what actually happened, including the fact that work happened in parallel on a branch.

Both are legitimate goals. They're just optimizing for different readers: rebase optimizes for "someone reading history later," merge optimizes for "someone reconstructing what actually happened during development."

## Question two: how do you integrate a finished branch

This is a completely different question, and it's the one that actually causes the arguments, because people conflate it with question one.

\`\`\`
# Rebase your branch onto latest main before opening a PR
git fetch origin
git rebase origin/main
git push --force-with-lease

# vs. merge main into your branch
git fetch origin
git merge origin/main
\`\`\`

Rebasing your own, not-yet-shared branch is safe. Rebasing a branch other people have already pulled is how you get the "force-pushed over my work" incident. That's not a rebase-vs-merge problem, it's a "don't rewrite shared history" problem, and it applies whether or not your team uses rebase at all.

## What actually resolved it

Splitting the two questions into two separate rules:

1. **On your own feature branch, before it's shared: rebase freely.** Clean up commits, reorder, squash typos. Nobody else has this history yet, there's nothing to break.
2. **Merging into main: squash-merge through the PR UI.** This gives a linear main branch (satisfying the rebase camp) while preserving the full commit history on the feature branch in GitHub's PR view for anyone who needs to see how the work actually evolved (satisfying the merge camp).

\`\`\`
main:     A---B---C---D    (one commit per merged PR, linear)
                \\
feature:         E-F-G-H   (full history preserved in the PR)
\`\`\`

Nobody actually cared about the word "rebase." They cared about two different things that word can mean depending on whether the branch is shared yet. Once we separated "clean up my own branch" from "how does this land on main," the debate mostly stopped, because it turned out almost everyone agreed on both rules individually.
`,
  },
];

async function upsertCategory(def: (typeof CATEGORY_DEFS)[number], now: number): Promise<string> {
  const existing = await db.select().from(categories).where(eq(categories.slug, def.slug)).limit(1);
  if (existing[0]) return existing[0].id;

  const id = createId();
  await db.insert(categories).values({
    id,
    name: def.name,
    slug: def.slug,
    description: def.description,
    color: def.color,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

async function upsertTag(name: string, now: number): Promise<string> {
  const existing = await db.select().from(tags).where(eq(tags.slug, name)).limit(1);
  if (existing[0]) return existing[0].id;

  const id = createId();
  await db.insert(tags).values({ id, name, slug: name, createdAt: now });
  return id;
}

async function main() {
  await connectRemoteIfConfigured();
  console.log(`Seeding showcase content into ${process.env['TURSO_DATABASE_URL'] ? 'Turso (' + process.env['TURSO_DATABASE_URL'] + ')' : 'local SQLite'}...`);
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const admin = (await db.select().from(users).where(eq(users.role, 'admin')).limit(1))[0];
  if (!admin) throw new Error('No admin user found — run `pnpm db:seed` first.');

  const categoryIds: Record<string, string> = {};
  for (const def of CATEGORY_DEFS) {
    categoryIds[def.slug] = await upsertCategory(def, now);
  }

  const tagIds: Record<string, string> = {};
  for (const tag of TAG_DEFS) {
    tagIds[tag] = await upsertTag(tag, now);
  }

  let created = 0;
  for (const def of POSTS) {
    const existing = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, def.slug)).limit(1);
    if (existing[0]) {
      console.log(`- skip (exists): ${def.slug}`);
      continue;
    }

    const { json, html } = compile(def.body);
    const publishedAt = def.status === 'published' ? now - (def.daysAgo ?? 0) * DAY : null;
    const scheduledAt = def.status === 'scheduled' ? now + (def.daysAhead ?? 1) * DAY : null;
    const createdAt = publishedAt ?? now - (def.daysAgo ?? 0) * DAY;

    const id = createId();
    await db.insert(posts).values({
      id,
      slug: def.slug,
      title: def.title,
      excerpt: def.excerpt,
      content: json,
      contentHtml: html,
      status: def.status,
      authorId: admin.id,
      categoryId: categoryIds[def.category] ?? null,
      publishedAt,
      scheduledAt,
      seoTitle: def.title.slice(0, 60),
      seoDescription: def.seoDescription,
      readingTime: estimateReadingTime(html),
      aiGenerated: def.aiGenerated ?? false,
      createdAt,
      updatedAt: createdAt,
    });

    if (def.tags.length > 0) {
      await db.insert(postTags).values(def.tags.map((t) => ({ postId: id, tagId: tagIds[t]! })));
    }

    created++;
    console.log(`- created: ${def.slug} (${def.status})`);
  }

  console.log(`\nDone. ${created} post(s) created.`);
}

main().catch((err) => {
  console.error('Seed content failed:', err);
  process.exit(1);
});
