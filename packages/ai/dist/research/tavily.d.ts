export interface TavilyResult {
    title: string;
    url: string;
    content: string;
    score: number;
    publishedDate?: string;
}
export interface TavilySearchResponse {
    results: TavilyResult[];
    query: string;
}
export declare function tavilySearch(query: string, options?: {
    maxResults?: number;
    searchDepth?: 'basic' | 'advanced';
}): Promise<TavilySearchResponse>;
//# sourceMappingURL=tavily.d.ts.map