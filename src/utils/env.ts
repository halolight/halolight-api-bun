import { z } from 'zod';

/**
 * Environment variables schema
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3002').transform(Number),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  API_PREFIX: z.string().default('/api'),
});

/**
 * Parse and validate environment variables
 */
export function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

/**
 * Typed environment variables
 */
export const env = validateEnv();

/**
 * Parse CORS origins (comma-separated)
 */
export function parseCorsOrigins(): string[] {
  return env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
}
