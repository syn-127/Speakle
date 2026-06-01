import { streamText } from 'ai';
import { getLanguageModel } from '../providers/index';
import type { AIProviderConfig } from '@speakle/shared';

const SYSTEM_PROMPT = `You are an expert editor. You receive raw voice dictation text (which may be
unstructured, repetitive, or contain filler words) and transform it into a well-written blog post.

- Fix grammar and punctuation
- Remove filler words (um, uh, like, you know)
- Structure the content with appropriate headings
- Improve sentence flow and readability
- Preserve the author's voice and key ideas
- Format output as clean Markdown`;

export function polishVoiceDictation(rawText: string, config: AIProviderConfig) {
  const model = getLanguageModel(config);

  return streamText({
    model,
    system: SYSTEM_PROMPT,
    prompt: `Transform this voice dictation into a well-written blog post:\n\n${rawText}`,
    maxTokens: 4096,
  });
}
