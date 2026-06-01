export type AIProvider = 'anthropic' | 'openai';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export interface GeneratePostInput {
  topic: string;
  tone?: 'professional' | 'casual' | 'technical' | 'conversational';
  length?: 'short' | 'medium' | 'long';
  keywords?: string[];
  outline?: string;
}

export interface ResearchInput {
  topic: string;
  depth?: 'standard' | 'deep';
}

export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  score: number;
}

export interface ResearchBrief {
  topic: string;
  keyFindings: string[];
  sources: ResearchSource[];
  suggestedOutline: Array<{ h2: string; h3s: string[] }>;
}

export interface TranscribeInput {
  mode: 'polish' | 'whisper';
  text?: string; // for polish mode
}

export interface SEOSuggestion {
  title: string;
  description: string;
  keywords: string[];
}
