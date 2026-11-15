import { z } from 'zod';
export declare const settingUpdateSchema: z.ZodObject<{
    key: z.ZodString;
    value: z.ZodUnknown;
}, z.core.$strip>;
export declare const settingsBatchUpdateSchema: z.ZodArray<z.ZodObject<{
    key: z.ZodString;
    value: z.ZodUnknown;
}, z.core.$strip>>;
export declare const generalSettingsSchema: z.ZodObject<{
    site_title: z.ZodString;
    site_description: z.ZodOptional<z.ZodString>;
    site_url: z.ZodString;
    logo_url: z.ZodOptional<z.ZodString>;
    favicon_url: z.ZodOptional<z.ZodString>;
    timezone: z.ZodDefault<z.ZodString>;
    posts_per_page: z.ZodDefault<z.ZodNumber>;
    comments_enabled: z.ZodDefault<z.ZodBoolean>;
    comment_moderation: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const seoSettingsSchema: z.ZodObject<{
    default_meta_description: z.ZodOptional<z.ZodString>;
    google_analytics_id: z.ZodOptional<z.ZodString>;
    robots_txt: z.ZodOptional<z.ZodString>;
    sitemap_enabled: z.ZodDefault<z.ZodBoolean>;
    og_default_image: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const aiSettingsSchema: z.ZodObject<{
    ai_provider: z.ZodDefault<z.ZodEnum<{
        anthropic: "anthropic";
        openai: "openai";
    }>>;
    anthropic_api_key: z.ZodOptional<z.ZodString>;
    openai_api_key: z.ZodOptional<z.ZodString>;
    tavily_api_key: z.ZodOptional<z.ZodString>;
    ai_default_model: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GeneralSettings = z.infer<typeof generalSettingsSchema>;
export type SEOSettings = z.infer<typeof seoSettingsSchema>;
export type AISettings = z.infer<typeof aiSettingsSchema>;
//# sourceMappingURL=settings.schema.d.ts.map