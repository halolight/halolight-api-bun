/**
 * Declare Bun global for non-Bun environments (Vercel/Cloudflare)
 */
declare const Bun: any;

/**
 * Check if running in Bun environment
 */
const isBun = typeof Bun !== 'undefined';

/**
 * Hash password using Bun's built-in bcrypt or bcryptjs fallback
 */
export async function hashPassword(password: string): Promise<string> {
  if (isBun) {
    return await Bun.password.hash(password, {
      algorithm: 'bcrypt',
      cost: 10,
    });
  }
  // Fallback for Node.js/Cloudflare Workers
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 10);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (isBun) {
    return await Bun.password.verify(password, hash, 'bcrypt');
  }
  // Fallback for Node.js/Cloudflare Workers
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}
