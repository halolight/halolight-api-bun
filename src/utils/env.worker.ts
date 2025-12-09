import { z } from 'zod';

const workerEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  API_PREFIX: z.string().default('/api'),
  SWAGGER_PATH: z.string().default('/swagger'),
  SWAGGER_ENABLED: z.string().default('true'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export function validateWorkerEnv(env: Record<string, unknown>): WorkerEnv {
  try {
    return workerEnvSchema.parse(env);
  } catch (error) {
    console.error('❌ Invalid Cloudflare Worker environment variables');
    throw error;
  }
}
