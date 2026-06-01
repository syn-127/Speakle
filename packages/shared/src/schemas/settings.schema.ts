import { z } from 'zod';

export const settingUpdateSchema = z.object({
  key: z.string(),
  value: z.unknown(),
});

export const settingsBatchUpdateSchema = z.array(settingUpdateSchema);

export const generalSettingsSchema = z.object({
  site_title: z.string().min(1).max(200),
  site_description: z.string().max(500).optional(),
  site_url: z.string().url(),
  logo_url: z.string().optional(),
  favicon_url: z.string().optional(),
  timezone: z.string().default('UTC'),
  posts_per_page: z.number().min(1).max(100).default(10),
  comments_enabled: z.boolean().default(true),
  comment_moderation: z.boolean().default(true),
});

export const seoSettingsSchema = z.object({
  default_meta_description: z.string().max(160).optional(),
  google_analytics_id: z.string().optional(),
  robots_txt: z.string().optional(),
  sitemap_enabled: z.boolean().default(true),
  og_default_image: z.string().optional(),
});

export const aiSettingsSchema = z.object({
  ai_provider: z.enum(['anthropic', 'openai']).default('anthropic'),
  anthropic_api_key: z.string().optional(),
  openai_api_key: z.string().optional(),
  tavily_api_key: z.string().optional(),
  ai_default_model: z.string().optional(),
});

export type GeneralSettings = z.infer<typeof generalSettingsSchema>;
export type SEOSettings = z.infer<typeof seoSettingsSchema>;
export type AISettings = z.infer<typeof aiSettingsSchema>;
