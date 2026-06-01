import { streamText } from 'ai';
import type { AIProviderConfig, ResearchBrief } from '@speakle/shared';
export declare function researchAndWrite(topic: string, depth: 'standard' | 'deep', config: AIProviderConfig): Promise<{
    brief: ResearchBrief;
    stream: ReturnType<typeof streamText>;
}>;
//# sourceMappingURL=research-and-write.d.ts.map