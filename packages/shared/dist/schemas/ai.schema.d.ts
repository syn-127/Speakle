import { z } from 'zod';
export declare const generatePostSchema: z.ZodObject<{
    topic: z.ZodString;
    tone: z.ZodDefault<z.ZodEnum<{
        professional: "professional";
        casual: "casual";
        technical: "technical";
        conversational: "conversational";
    }>>;
    length: z.ZodDefault<z.ZodEnum<{
        short: "short";
        medium: "medium";
        long: "long";
    }>>;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString>>;
    outline: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodEnum<{
        anthropic: "anthropic";
        openai: "openai";
    }>>;
}, z.core.$strip>;
export declare const researchSchema: z.ZodObject<{
    topic: z.ZodString;
    depth: z.ZodDefault<z.ZodEnum<{
        standard: "standard";
        deep: "deep";
    }>>;
    provider: z.ZodOptional<z.ZodEnum<{
        anthropic: "anthropic";
        openai: "openai";
    }>>;
}, z.core.$strip>;
export declare const transcribeTextSchema: z.ZodObject<{
    text: z.ZodString;
    mode: z.ZodLiteral<"polish">;
    provider: z.ZodOptional<z.ZodEnum<{
        anthropic: "anthropic";
        openai: "openai";
    }>>;
}, z.core.$strip>;
export declare const improveSeoSchema: z.ZodObject<{
    postId: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    content: z.ZodString;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString>>;
    provider: z.ZodOptional<z.ZodEnum<{
        anthropic: "anthropic";
        openai: "openai";
    }>>;
}, z.core.$strip>;
export declare const continueWritingSchema: z.ZodObject<{
    context: z.ZodString;
    instruction: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodEnum<{
        anthropic: "anthropic";
        openai: "openai";
    }>>;
}, z.core.$strip>;
//# sourceMappingURL=ai.schema.d.ts.map