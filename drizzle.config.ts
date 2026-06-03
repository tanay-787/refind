import type { Config } from 'drizzle-kit';

export default {
  schema: './src/features/jobjournal/storage/drizzle-schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
