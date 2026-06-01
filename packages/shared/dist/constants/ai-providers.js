export const AI_PROVIDERS = {
    anthropic: {
        id: 'anthropic',
        name: 'Anthropic (Claude)',
        models: [
            { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5' },
            { id: 'claude-opus-4-5', name: 'Claude Opus 4.5' },
            { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5' },
        ],
        defaultModel: 'claude-sonnet-4-5',
    },
    openai: {
        id: 'openai',
        name: 'OpenAI (GPT)',
        models: [
            { id: 'gpt-4o', name: 'GPT-4o' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        ],
        defaultModel: 'gpt-4o',
    },
};
//# sourceMappingURL=ai-providers.js.map