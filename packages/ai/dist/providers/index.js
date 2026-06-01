import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
export function getLanguageModel(config) {
    if (config.provider === 'anthropic') {
        const anthropic = createAnthropic({ apiKey: config.apiKey });
        return anthropic(config.model ?? 'claude-sonnet-4-5');
    }
    const openai = createOpenAI({ apiKey: config.apiKey });
    return openai(config.model ?? 'gpt-4o');
}
//# sourceMappingURL=index.js.map