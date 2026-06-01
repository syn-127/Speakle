import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import type { AIProviderConfig } from '@speakle/shared';

export function getLanguageModel(config: AIProviderConfig): LanguageModel {
  if (config.provider === 'anthropic') {
    const anthropic = createAnthropic({ apiKey: config.apiKey });
    return anthropic(config.model ?? 'claude-sonnet-4-5');
  }

  const openai = createOpenAI({ apiKey: config.apiKey });
  return openai(config.model ?? 'gpt-4o');
}
