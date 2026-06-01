export declare const AI_PROVIDERS: {
    readonly anthropic: {
        readonly id: "anthropic";
        readonly name: "Anthropic (Claude)";
        readonly models: readonly [{
            readonly id: "claude-sonnet-4-5";
            readonly name: "Claude Sonnet 4.5";
        }, {
            readonly id: "claude-opus-4-5";
            readonly name: "Claude Opus 4.5";
        }, {
            readonly id: "claude-haiku-4-5";
            readonly name: "Claude Haiku 4.5";
        }];
        readonly defaultModel: "claude-sonnet-4-5";
    };
    readonly openai: {
        readonly id: "openai";
        readonly name: "OpenAI (GPT)";
        readonly models: readonly [{
            readonly id: "gpt-4o";
            readonly name: "GPT-4o";
        }, {
            readonly id: "gpt-4o-mini";
            readonly name: "GPT-4o Mini";
        }, {
            readonly id: "gpt-4-turbo";
            readonly name: "GPT-4 Turbo";
        }];
        readonly defaultModel: "gpt-4o";
    };
};
//# sourceMappingURL=ai-providers.d.ts.map