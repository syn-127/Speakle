import { defineConfig } from 'drizzle-kit';

const dbPath = process.env['DATABASE_PATH'] ?? '../../apps/api/speakle.db';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './src/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbPath,
  },
});
