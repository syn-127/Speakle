import { z } from 'zod';

export const generatePostSchema = z.object({
  topic: z.string().min(3).max(500),
  tone: z.enum(['professional', 'casual', 'technical', 'conversational']).default('professional'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  keywords: z.array(z.string()).optional(),
  outline: z.string().optional(),
  provider: z.enum(['anthropic', 'openai']).optional(),
});

export const researchSchema = z.object({
  topic: z.string().min(3).max(500),
  depth: z.enum(['standard', 'deep']).default('standard'),
  provider: z.enum(['anthropic', 'openai']).optional(),
});

export const transcribeTextSchema = z.object({
  text: z.string().min(1),
  mode: z.literal('polish'),
  provider: z.enum(['anthropic', 'openai']).optional(),
});

export const improveSeoSchema = z.object({
  postId: z.string().optional(),
  title: z.string(),
  content: z.string(),
  keywords: z.array(z.string()).optional(),
  provider: z.enum(['anthropic', 'openai']).optional(),
});

export const continueWritingSchema = z.object({
  context: z.string(),
  instruction: z.string().optional(),
  provider: z.enum(['anthropic', 'openai']).optional(),
});

// Types are defined in types/ai.ts — exported from there to avoid duplicate exports.
