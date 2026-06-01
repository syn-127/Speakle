import { streamText } from 'ai';
import { getLanguageModel } from '../providers/index';
import type { AIProviderConfig, GeneratePostInput } from '@speakle/shared';

const SYSTEM_PROMPT = `You are an expert blog writer. When given a topic, write a well-structured,
engaging blog post in Markdown format. Include:
- A compelling title (as # heading)
- An introduction that hooks the reader
- Well-organized sections with ## and ### headings
- A conclusion
- Proper paragraph breaks and formatting

Write in the requested tone and length. Be factual, informative, and engaging.`;

const LENGTH_GUIDE = {
  short: '400-600 words',
  medium: '800-1200 words',
  long: '1500-2500 words',
};

export function generatePost(input: GeneratePostInput, config: AIProviderConfig) {
  const model = getLanguageModel(config);

  const keywordsText =
    input.keywords && input.keywords.length > 0
      ? `\nNaturally incorporate these keywords: ${input.keywords.join(', ')}`
      : '';

  const outlineText = input.outline ? `\nFollow this outline:\n${input.outline}` : '';

  return streamText({
    model,
    system: SYSTEM_PROMPT,
    prompt: `Write a ${input.tone ?? 'professional'} blog post about: "${input.topic}"
Target length: ${LENGTH_GUIDE[input.length ?? 'medium']}${keywordsText}${outlineText}`,
    maxTokens: 4096,
  });
}
