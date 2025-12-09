import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type DbInstance = NeonHttpDatabase<typeof schema>;

let db!: DbInstance;
let clientInitialized = false;

/**
 * Initialize DB for Bun/Vercel environments (HTTP driver for serverless friendliness).
 * Falls back to a localhost connection string for local dev.
 */
function initDb() {
  if (db) return db;
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/halolight';
  const client = neon(connectionString);
  db = drizzle(client, { schema });
  clientInitialized = true;
  return db;
}

/**
 * Explicitly set DB instance (used by Cloudflare Workers to inject per-runtime client).
 */
export function setDb(instance: DbInstance) {
  db = instance;
}

/**
 * Get the active DB instance. Initializes lazily for Bun/Vercel.
 */
export function getDb(): DbInstance {
  if (db) return db;
  return initDb();
}

// Auto-initialize when DATABASE_URL is present (Bun/Node environments).
if (typeof process !== 'undefined' && process.env?.DATABASE_URL) {
  initDb();
}

/**
 * Graceful shutdown stub (Neon HTTP driver does not maintain TCP pool).
 */
export async function closeDatabase() {
  if (!clientInitialized) return;
  // No-op for neon-http; kept for API parity.
}

export { db };
export * from './schema';
