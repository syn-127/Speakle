import { z } from 'zod';
export declare const settingUpdateSchema: z.ZodObject<{
    key: z.ZodString;
    value: z.ZodUnknown;
}, "strip", z.ZodTypeAny, {
    key: string;
    value?: unknown;
}, {
    key: string;
    value?: unknown;
}>;
export declare const settingsBatchUpdateSchema: z.ZodArray<z.ZodObject<{
    key: z.ZodString;
    value: z.ZodUnknown;
}, "strip", z.ZodTypeAny, {
    key: string;
    value?: unknown;
}, {
    key: string;
    value?: unknown;
}>, "many">;
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
}, "strip", z.ZodTypeAny, {
    site_title: string;
    site_url: string;
    timezone: string;
    posts_per_page: number;
    comments_enabled: boolean;
    comment_moderation: boolean;
    site_description?: string | undefined;
    logo_url?: string | undefined;
    favicon_url?: string | undefined;
}, {
    site_title: string;
    site_url: string;
    site_description?: string | undefined;
    logo_url?: string | undefined;
    favicon_url?: string | undefined;
    timezone?: string | undefined;
    posts_per_page?: number | undefined;
    comments_enabled?: boolean | undefined;
    comment_moderation?: boolean | undefined;
}>;
export declare const seoSettingsSchema: z.ZodObject<{
    default_meta_description: z.ZodOptional<z.ZodString>;
    google_analytics_id: z.ZodOptional<z.ZodString>;
    robots_txt: z.ZodOptional<z.ZodString>;
    sitemap_enabled: z.ZodDefault<z.ZodBoolean>;
    og_default_image: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sitemap_enabled: boolean;
    default_meta_description?: string | undefined;
    google_analytics_id?: string | undefined;
    robots_txt?: string | undefined;
    og_default_image?: string | undefined;
}, {
    default_meta_description?: string | undefined;
    google_analytics_id?: string | undefined;
    robots_txt?: string | undefined;
    sitemap_enabled?: boolean | undefined;
    og_default_image?: string | undefined;
}>;
export declare const aiSettingsSchema: z.ZodObject<{
    ai_provider: z.ZodDefault<z.ZodEnum<["anthropic", "openai"]>>;
    anthropic_api_key: z.ZodOptional<z.ZodString>;
    openai_api_key: z.ZodOptional<z.ZodString>;
    tavily_api_key: z.ZodOptional<z.ZodString>;
    ai_default_model: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    ai_provider: "anthropic" | "openai";
    anthropic_api_key?: string | undefined;
    openai_api_key?: string | undefined;
    tavily_api_key?: string | undefined;
    ai_default_model?: string | undefined;
}, {
    ai_provider?: "anthropic" | "openai" | undefined;
    anthropic_api_key?: string | undefined;
    openai_api_key?: string | undefined;
    tavily_api_key?: string | undefined;
    ai_default_model?: string | undefined;
}>;
export type GeneralSettings = z.infer<typeof generalSettingsSchema>;
export type SEOSettings = z.infer<typeof seoSettingsSchema>;
export type AISettings = z.infer<typeof aiSettingsSchema>;
//# sourceMappingURL=settings.schema.d.ts.map