import { streamText, generateObject } from 'ai';
import { z } from 'zod';
import { getLanguageModel } from '../providers/index';
import { tavilySearch } from '../research/tavily';
import type { AIProviderConfig, ResearchBrief } from '@speakle/shared';

const outlineSchema = z.object({
  keyFindings: z.array(z.string()).describe('Main facts and insights from the research'),
  suggestedOutline: z.array(
    z.object({
      h2: z.string(),
      h3s: z.array(z.string()),
    }),
  ),
});

export async function researchAndWrite(
  topic: string,
  depth: 'standard' | 'deep',
  config: AIProviderConfig,
): Promise<{ brief: ResearchBrief; stream: ReturnType<typeof streamText> }> {
  const model = getLanguageModel(config);

  // Step 1: Fetch sources
  const searchResults = await tavilySearch(topic, {
    maxResults: depth === 'deep' ? 15 : 8,
    searchDepth: depth === 'deep' ? 'advanced' : 'basic',
  });

  const sources = searchResults.results.map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content.slice(0, 800),
    score: r.score,
  }));

  // Step 2: Synthesize outline (non-streamed internal call)
  const sourceContext = sources
    .map((s, i) => `[${i + 1}] ${s.title}\n${s.snippet}`)
    .join('\n\n---\n\n');

  const { object: outline } = await generateObject({
    model,
    schema: outlineSchema,
    prompt: `Based on these research sources about "${topic}", extract key findings and suggest a blog post outline:

${sourceContext}`,
  });

  const brief: ResearchBrief = {
    topic,
    keyFindings: outline.keyFindings,
    sources,
    suggestedOutline: outline.suggestedOutline,
  };

  // Step 3: Stream the full post
  const outlineText = outline.suggestedOutline
    .map((s) => `## ${s.h2}\n${s.h3s.map((h) => `### ${h}`).join('\n')}`)
    .join('\n\n');

  const referencesText = sources
    .map((s, i) => `${i + 1}. [${s.title}](${s.url})`)
    .join('\n');

  const stream = streamText({
    model,
    system: `You are an expert researcher and blog writer. Using the provided research context,
write a comprehensive, accurate, and engaging blog post. Cite sources naturally using [N] notation
where N corresponds to the source number. End with a References section.`,
    prompt: `Write a detailed blog post about: "${topic}"

Key findings from research:
${outline.keyFindings.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Suggested outline:
${outlineText}

Research sources for context:
${sourceContext}

References to include at the end:
${referencesText}

Write the full blog post now:`,
    maxTokens: 6000,
  });

  return { brief, stream };
}
