import { z } from 'zod';

/**
 * Environment variables schema
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3002').transform(Number),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters').optional(),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // API
  API_PREFIX: z.string().default('/api'),

  // Swagger
  SWAGGER_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  SWAGGER_PATH: z.string().default('/swagger'),

  // Rate Limiting (optional)
  THROTTLE_TTL: z.string().default('60').transform(Number),
  THROTTLE_LIMIT: z.string().default('100').transform(Number),

  // File Upload (optional)
  MAX_FILE_SIZE: z.string().default('10485760').transform(Number), // 10MB
  UPLOAD_PATH: z.string().default('./uploads'),
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
