import type { AIProviderConfig } from '@speakle/shared';
export declare function improveSEO(input: {
    title: string;
    content: string;
    keywords?: string[];
}, config: AIProviderConfig): Promise<{
    description: string;
    title: string;
    keywords: string[];
    slug: string;
}>;
//# sourceMappingURL=improve-seo.d.ts.map