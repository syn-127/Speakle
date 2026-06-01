import { generateObject } from 'ai';
import { z } from 'zod';
import { getLanguageModel } from '../providers/index';
import type { AIProviderConfig } from '@speakle/shared';

const seoOutputSchema = z.object({
  title: z.string().max(60).describe('SEO-optimized title (max 60 chars)'),
  description: z.string().max(160).describe('Meta description (max 160 chars)'),
  keywords: z.array(z.string()).max(10).describe('Relevant keywords'),
  slug: z.string().describe('URL-friendly slug'),
});

export async function improveSEO(
  input: { title: string; content: string; keywords?: string[] },
  config: AIProviderConfig,
) {
  const model = getLanguageModel(config);

  const keywordsHint =
    input.keywords && input.keywords.length > 0
      ? `\nTarget keywords to include: ${input.keywords.join(', ')}`
      : '';

  const { object } = await generateObject({
    model,
    schema: seoOutputSchema,
    prompt: `Analyze this blog post and generate optimal SEO metadata.

Title: ${input.title}
Content preview: ${input.content.slice(0, 1000)}...${keywordsHint}

Generate an SEO-optimized title, meta description, keywords, and URL slug.`,
  });

  return object;
}
