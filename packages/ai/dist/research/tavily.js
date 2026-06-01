export async function tavilySearch(query, options = {}) {
    const apiKey = process.env['TAVILY_API_KEY'];
    if (!apiKey) {
        throw new Error('TAVILY_API_KEY is not configured. Please add your Tavily API key in Settings > AI.');
    }
    const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            query,
            max_results: options.maxResults ?? 8,
            search_depth: options.searchDepth ?? 'basic',
            include_answer: false,
            include_raw_content: false,
        }),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Tavily search failed: ${response.status} ${error}`);
    }
    const data = (await response.json());
    return { results: data.results, query };
}
//# sourceMappingURL=tavily.js.map