import { db, settings } from '@speakle/db';
import { eq } from 'drizzle-orm';
import { safeDecrypt, encrypt } from './crypto.js';
import { dbv } from './db-helpers.js';
import type { AIProviderConfig } from '@speakle/shared';

const ENCRYPTED_KEYS = ['anthropic_api_key', 'openai_api_key', 'tavily_api_key'];

export async function getSetting(key: string): Promise<unknown> {
  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  const row = result[0];
  if (!row) return null;

  const value = JSON.parse(row.value) as unknown;

  if (ENCRYPTED_KEYS.includes(key) && typeof value === 'string' && value) {
    return safeDecrypt(value);
  }

  return value;
}

export async function setSetting(key: string, value: unknown, category: 'general' | 'seo' | 'ai' | 'appearance') {
  let storedValue = value;

  if (ENCRYPTED_KEYS.includes(key) && typeof value === 'string' && value) {
    storedValue = encrypt(value);
  }

  const settingRow = { key, value: JSON.stringify(storedValue), category, updatedAt: Date.now() };
  await db
    .insert(settings)
    .values(settingRow)
    .onConflictDoUpdate({
      target: settings.key,
      set: dbv({ value: JSON.stringify(storedValue), updatedAt: Date.now() }),
    });
}

export async function getSettingsByCategory(category: string) {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.category, category as 'general' | 'seo' | 'ai' | 'appearance'));

  return Object.fromEntries(
    rows.map((row) => {
      let value = JSON.parse(row.value) as unknown;
      if (ENCRYPTED_KEYS.includes(row.key) && typeof value === 'string' && value) {
        value = value ? '***' : ''; // mask in API responses
      }
      return [row.key, value];
    }),
  );
}

export async function getAIConfig(): Promise<AIProviderConfig | null> {
  const provider = (await getSetting('ai_provider')) as string | null;
  if (!provider) return null;

  const keyName = provider === 'anthropic' ? 'anthropic_api_key' : 'openai_api_key';
  const apiKey = (await getSetting(keyName)) as string | null;
  if (!apiKey) return null;

  const model = (await getSetting('ai_default_model')) as string | null;

  return {
    provider: provider as 'anthropic' | 'openai',
    apiKey,
    model: model ?? undefined,
  };
}

export async function getTavilyKey(): Promise<string | null> {
  return (await getSetting('tavily_api_key')) as string | null;
}
