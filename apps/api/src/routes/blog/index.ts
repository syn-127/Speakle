import { Hono } from 'hono';
import { db, posts, categories, tags, settings } from '@speakle/db';
import { eq, desc, like, and, or } from 'drizzle-orm';
import { listPosts, getPost } from '../../services/post.service';
import { getSetting } from '../../lib/settings.js';

export const blogRouter = new Hono();

blogRouter.get('/site-config', async (c) => {
  const showHomepage = await getSetting('show_homepage');
  const googleAnalyticsId = await getSetting('google_analytics_id');
  return c.json({
    showHomepage: showHomepage === null ? true : Boolean(showHomepage),
    googleAnalyticsId: typeof googleAnalyticsId === 'string' && googleAnalyticsId ? googleAnalyticsId : null,
  });
});

blogRouter.get('/posts', async (c) => {
  const page = parseInt(c.req.query('page') ?? '1', 10);
  const limit = parseInt(c.req.query('limit') ?? '10', 10);
  const search = c.req.query('search');
  const category = c.req.query('category');
  const tag = c.req.query('tag');

  const result = await listPosts({ page, limit, status: 'published', search, category, tag });
  return c.json(result);
});

blogRouter.get('/posts/:slug', async (c) => {
  const slug = c.req.param('slug');
  const post = await getPost(slug);
  if (!post || post.status !== 'published') return c.json({ error: 'Post not found' }, 404);
  return c.json(post);
});

blogRouter.get('/categories', async (c) => {
  const items = await db.select().from(categories);
  return c.json(items);
});

blogRouter.get('/tags', async (c) => {
  const items = await db.select().from(tags);
  return c.json(items);
});

blogRouter.get('/search', async (c) => {
  const q = c.req.query('q') ?? '';
  if (!q) return c.json({ items: [] });
  const result = await listPosts({ status: 'published', search: q, limit: 20 });
  return c.json(result);
});

blogRouter.get('/feed.xml', async (c) => {
  const siteTitleRow = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'site_title'))
    .limit(1);
  const siteTitle = siteTitleRow[0] ? JSON.parse(siteTitleRow[0].value) as string : 'Speakle Blog';

  const siteUrlRow = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'site_url'))
    .limit(1);
  const siteUrl = siteUrlRow[0] ? JSON.parse(siteUrlRow[0].value) as string : 'http://localhost:5173';

  const { items } = await listPosts({ status: 'published', limit: 20 });

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(siteTitle)} RSS Feed</description>
    ${items
      .map(
        (post) => `<item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <description>${escapeXml(post.excerpt ?? '')}</description>
      <pubDate>${post.publishedAt ? new Date(post.publishedAt).toUTCString() : ''}</pubDate>
      <guid>${siteUrl}/blog/${post.slug}</guid>
    </item>`,
      )
      .join('\n    ')}
  </channel>
</rss>`;

  c.header('Content-Type', 'application/rss+xml; charset=utf-8');
  return c.body(rss);
});

blogRouter.get('/sitemap.xml', async (c) => {
  const siteUrlRow = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'site_url'))
    .limit(1);
  const siteUrl = siteUrlRow[0] ? JSON.parse(siteUrlRow[0].value) as string : 'http://localhost:5173';

  const { items } = await listPosts({ status: 'published', limit: 500 });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${items
    .map(
      (post) => `<url>
    <loc>${siteUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updatedAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    )
    .join('\n  ')}
</urlset>`;

  c.header('Content-Type', 'application/xml; charset=utf-8');
  return c.body(sitemap);
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
