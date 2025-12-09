import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * Cloudflare Workers + Neon (HTTP) database adapter.
 *
 * Workers 无法使用传统 TCP 连接池，这里改用 Neon 的 fetch/HTTP 驱动。
 * 通过传入 c.env.DATABASE_URL 获取连接字符串，单例化以复用连接。
 */

type Env = {
  DATABASE_URL: string;
};

let cachedDb: NeonHttpDatabase<typeof schema> | null = null;

export function getWorkerDb(env: Env) {
  if (cachedDb) return cachedDb;

  const connectionString = env.DATABASE_URL;
  const client = neon(connectionString);
  cachedDb = drizzle(client, { schema });
  return cachedDb;
}

export { schema };
