import { db } from './client';
import { users, settings, themes, categories } from './schema/index';
import { createId } from '@paralleldrive/cuid2';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');

  const now = Date.now();

  // Create admin user
  const adminId = createId();
  const passwordHash = await bcrypt.hash('speakle-admin', 12);

  await db
    .insert(users)
    .values({
      id: adminId,
      email: 'admin@speakle.local',
      username: 'admin',
      passwordHash,
      role: 'admin',
      displayName: 'Admin',
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();

  // Default settings
  const defaultSettings = [
    { key: 'site_title', value: JSON.stringify('My Speakle Blog'), category: 'general' as const },
    {
      key: 'site_description',
      value: JSON.stringify('A blog powered by Speakle'),
      category: 'general' as const,
    },
    {
      key: 'site_url',
      value: JSON.stringify('http://localhost:5173'),
      category: 'general' as const,
    },
    { key: 'posts_per_page', value: JSON.stringify(10), category: 'general' as const },
    { key: 'comments_enabled', value: JSON.stringify(true), category: 'general' as const },
    { key: 'comment_moderation', value: JSON.stringify(true), category: 'general' as const },
    { key: 'timezone', value: JSON.stringify('UTC'), category: 'general' as const },
    { key: 'show_homepage', value: JSON.stringify(true), category: 'general' as const },
    {
      key: 'default_meta_description',
      value: JSON.stringify(''),
      category: 'seo' as const,
    },
    { key: 'sitemap_enabled', value: JSON.stringify(true), category: 'seo' as const },
    { key: 'robots_txt', value: JSON.stringify('User-agent: *\nAllow: /'), category: 'seo' as const },
    {
      key: 'ai_provider',
      value: JSON.stringify('anthropic'),
      category: 'ai' as const,
    },
    { key: 'anthropic_api_key', value: JSON.stringify(''), category: 'ai' as const },
    { key: 'openai_api_key', value: JSON.stringify(''), category: 'ai' as const },
    { key: 'tavily_api_key', value: JSON.stringify(''), category: 'ai' as const },
    { key: 'ai_default_model', value: JSON.stringify(''), category: 'ai' as const },
    { key: 'active_theme', value: JSON.stringify('default'), category: 'appearance' as const },
  ];

  for (const setting of defaultSettings) {
    await db
      .insert(settings)
      .values({ ...setting, updatedAt: now })
      .onConflictDoNothing();
  }

  // Default themes
  await db
    .insert(themes)
    .values([
      {
        id: 'default',
        name: 'Speakle Default',
        slug: 'default',
        version: '1.0.0',
        author: 'Speakle Team',
        previewUrl: '/themes/default/preview.png',
        config: JSON.stringify({ primaryColor: '#6366f1', fontFamily: 'Inter', layout: 'standard' }),
        isActive: true,
        isBundled: true,
        installedAt: now,
      },
      {
        id: 'minimal',
        name: 'Minimal',
        slug: 'minimal',
        version: '1.0.0',
        author: 'Speakle Team',
        previewUrl: '/themes/minimal/preview.png',
        config: JSON.stringify({ primaryColor: '#000000', fontFamily: 'Georgia', layout: 'standard' }),
        isActive: false,
        isBundled: true,
        installedAt: now,
      },
      {
        id: 'magazine',
        name: 'Magazine',
        slug: 'magazine',
        version: '1.0.0',
        author: 'Speakle Team',
        previewUrl: '/themes/magazine/preview.png',
        config: JSON.stringify({ primaryColor: '#dc2626', fontFamily: 'Playfair Display', layout: 'wide' }),
        isActive: false,
        isBundled: true,
        installedAt: now,
      },
    ])
    .onConflictDoNothing();

  // Default category
  await db
    .insert(categories)
    .values({
      id: createId(),
      name: 'Uncategorized',
      slug: 'uncategorized',
      description: 'Default category',
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();

  console.log('✅ Seed complete!');
  console.log('   Admin login: admin@speakle.local / speakle-admin');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
