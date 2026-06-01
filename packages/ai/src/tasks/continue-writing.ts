import { streamText } from 'ai';
import { getLanguageModel } from '../providers/index';
import type { AIProviderConfig } from '@speakle/shared';

export function continueWriting(
  input: { context: string; instruction?: string },
  config: AIProviderConfig,
) {
  const model = getLanguageModel(config);

  const instructionText = input.instruction ? `\nInstruction: ${input.instruction}` : '';

  return streamText({
    model,
    system: `You are an expert blog writer. Continue writing the provided blog post content naturally,
maintaining the same style, tone, and voice. Output only the continuation text, no preamble.`,
    prompt: `Continue this blog post:

${input.context}${instructionText}`,
    maxTokens: 1024,
  });
}
