import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { streamText } from 'hono/streaming';
import { generatePost, researchAndWrite, polishVoiceDictation, improveSEO, continueWriting } from '@speakle/ai';
import {
  generatePostSchema,
  researchSchema,
  transcribeTextSchema,
  improveSeoSchema,
  continueWritingSchema,
  type GeneratePostInput,
  type ResearchInput,
  type ImproveSeoInput,
  type ContinueWritingInput,
} from '@speakle/shared';
import { authMiddleware } from '../../middleware/auth.js';
import { getAIConfig, getTavilyKey } from '../../lib/settings.js';

// Cast helper — @hono/zod-validator infers from one Zod instance while types in
// @speakle/shared come from another. The runtime value is always correct;
// this cast is purely a compile-time bridge between the two Zod instances.
function validated<T>(v: unknown): T {
  return v as T;
}

export const aiRouter = new Hono();

aiRouter.post('/generate', authMiddleware, zValidator('json', generatePostSchema), async (c) => {
  const input = validated<GeneratePostInput>(c.req.valid('json'));
  const config = await getAIConfig();
  if (!config) return c.json({ error: 'AI provider not configured. Please add your API key in Settings > AI.' }, 400);

  const result = generatePost(input, input.provider ? { ...config, provider: input.provider } : config);

  return streamText(c, async (stream) => {
    for await (const chunk of result.textStream) {
      await stream.write(chunk);
    }
  });
});

aiRouter.post('/research', authMiddleware, zValidator('json', researchSchema), async (c) => {
  const input = validated<ResearchInput>(c.req.valid('json'));
  const config = await getAIConfig();
  if (!config) return c.json({ error: 'AI provider not configured' }, 400);

  const tavilyKey = await getTavilyKey();
  if (!tavilyKey) return c.json({ error: 'Tavily API key not configured. Please add it in Settings > AI.' }, 400);

  process.env['TAVILY_API_KEY'] = tavilyKey;

  try {
    const { brief, stream } = await researchAndWrite(
      input.topic,
      input.depth ?? 'standard',
      input.provider ? { ...config, provider: input.provider } : config,
    );

    return streamText(c, async (stream_) => {
      await stream_.write(`data: ${JSON.stringify({ type: 'brief', data: brief })}\n\n`);
      for await (const chunk of stream.textStream) {
        await stream_.write(`data: ${JSON.stringify({ type: 'text', data: chunk })}\n\n`);
      }
      await stream_.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Research failed';
    return c.json({ error: message }, 500);
  }
});

aiRouter.post('/transcribe', authMiddleware, async (c) => {
  const config = await getAIConfig();
  if (!config) return c.json({ error: 'AI provider not configured' }, 400);

  const contentType = c.req.header('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    if (config.provider !== 'openai') {
      return c.json({ error: 'Audio transcription requires OpenAI provider with Whisper API' }, 400);
    }

    const formData = await c.req.formData();
    const audioFile = formData.get('audio') as File | null;
    if (!audioFile) return c.json({ error: 'No audio file provided' }, 400);

    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: config.apiKey });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });

    const polishResult = polishVoiceDictation(transcription.text, config);
    return streamText(c, async (stream) => {
      for await (const chunk of polishResult.textStream) {
        await stream.write(chunk);
      }
    });
  }

  const body = await c.req.json() as { text?: string; mode?: string };
  const parsed = transcribeTextSchema.safeParse(body);
  if (!parsed.success || !parsed.data.text) {
    return c.json({ error: 'Invalid request' }, 400);
  }

  const result = polishVoiceDictation(parsed.data.text, config);
  return streamText(c, async (stream) => {
    for await (const chunk of result.textStream) {
      await stream.write(chunk);
    }
  });
});

aiRouter.post('/improve-seo', authMiddleware, zValidator('json', improveSeoSchema), async (c) => {
  const input = validated<ImproveSeoInput>(c.req.valid('json'));
  const config = await getAIConfig();
  if (!config) return c.json({ error: 'AI provider not configured' }, 400);

  const result = await improveSEO(input, config);
  return c.json(result);
});

aiRouter.post('/continue', authMiddleware, zValidator('json', continueWritingSchema), async (c) => {
  const input = validated<ContinueWritingInput>(c.req.valid('json'));
  const config = await getAIConfig();
  if (!config) return c.json({ error: 'AI provider not configured' }, 400);

  const result = continueWriting(input, config);
  return streamText(c, async (stream) => {
    for await (const chunk of result.textStream) {
      await stream.write(chunk);
    }
  });
});
