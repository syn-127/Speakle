import { z } from 'zod';
export declare const generatePostSchema: z.ZodObject<{
    topic: z.ZodString;
    tone: z.ZodDefault<z.ZodEnum<["professional", "casual", "technical", "conversational"]>>;
    length: z.ZodDefault<z.ZodEnum<["short", "medium", "long"]>>;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    outline: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodEnum<["anthropic", "openai"]>>;
}, "strip", z.ZodTypeAny, {
    length: "short" | "medium" | "long";
    topic: string;
    tone: "professional" | "casual" | "technical" | "conversational";
    keywords?: string[] | undefined;
    outline?: string | undefined;
    provider?: "anthropic" | "openai" | undefined;
}, {
    topic: string;
    length?: "short" | "medium" | "long" | undefined;
    tone?: "professional" | "casual" | "technical" | "conversational" | undefined;
    keywords?: string[] | undefined;
    outline?: string | undefined;
    provider?: "anthropic" | "openai" | undefined;
}>;
export declare const researchSchema: z.ZodObject<{
    topic: z.ZodString;
    depth: z.ZodDefault<z.ZodEnum<["standard", "deep"]>>;
    provider: z.ZodOptional<z.ZodEnum<["anthropic", "openai"]>>;
}, "strip", z.ZodTypeAny, {
    topic: string;
    depth: "standard" | "deep";
    provider?: "anthropic" | "openai" | undefined;
}, {
    topic: string;
    provider?: "anthropic" | "openai" | undefined;
    depth?: "standard" | "deep" | undefined;
}>;
export declare const transcribeTextSchema: z.ZodObject<{
    text: z.ZodString;
    mode: z.ZodLiteral<"polish">;
    provider: z.ZodOptional<z.ZodEnum<["anthropic", "openai"]>>;
}, "strip", z.ZodTypeAny, {
    text: string;
    mode: "polish";
    provider?: "anthropic" | "openai" | undefined;
}, {
    text: string;
    mode: "polish";
    provider?: "anthropic" | "openai" | undefined;
}>;
export declare const improveSeoSchema: z.ZodObject<{
    postId: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    content: z.ZodString;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    provider: z.ZodOptional<z.ZodEnum<["anthropic", "openai"]>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    content: string;
    keywords?: string[] | undefined;
    provider?: "anthropic" | "openai" | undefined;
    postId?: string | undefined;
}, {
    title: string;
    content: string;
    keywords?: string[] | undefined;
    provider?: "anthropic" | "openai" | undefined;
    postId?: string | undefined;
}>;
export declare const continueWritingSchema: z.ZodObject<{
    context: z.ZodString;
    instruction: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodEnum<["anthropic", "openai"]>>;
}, "strip", z.ZodTypeAny, {
    context: string;
    provider?: "anthropic" | "openai" | undefined;
    instruction?: string | undefined;
}, {
    context: string;
    provider?: "anthropic" | "openai" | undefined;
    instruction?: string | undefined;
}>;
//# sourceMappingURL=ai.schema.d.ts.map