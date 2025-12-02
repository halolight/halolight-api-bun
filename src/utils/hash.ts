/**
 * Hash password using Bun's built-in bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 10, // bcrypt cost factor (2^10 iterations)
  });
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash, 'bcrypt');
}
