import { streamText } from 'ai';
import { getLanguageModel } from '../providers/index';
export function continueWriting(input, config) {
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
//# sourceMappingURL=continue-writing.js.map