import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Database connection configuration
 */
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/halolight';

/**
 * Create PostgreSQL client
 */
export const client = postgres(connectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
});

/**
 * Create Drizzle ORM instance
 */
export const db = drizzle(client, { schema });

/**
 * Graceful shutdown
 */
export async function closeDatabase() {
  await client.end();
}

export * from './schema';
