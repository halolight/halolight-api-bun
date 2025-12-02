import { sign, verify } from 'hono/jwt';
import type { JWTPayload } from 'hono/utils/jwt/types';

/**
 * JWT configuration
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-minimum-32-characters-long';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Convert expires in string to seconds
 */
function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('Invalid JWT_EXPIRES_IN format. Use format: 1s, 1m, 1h, 1d');
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return value * multipliers[unit];
}

/**
 * Custom JWT payload interface
 */
export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate JWT token for user
 */
export async function generateToken(userId: string, email: string, role: string): Promise<string> {
  const expiresInSeconds = parseExpiresIn(JWT_EXPIRES_IN);
  const now = Math.floor(Date.now() / 1000);

  const payload: TokenPayload = {
    userId,
    email,
    role,
    iat: now,
    exp: now + expiresInSeconds,
  };

  return await sign(payload, JWT_SECRET);
}

/**
 * Verify JWT token and return payload
 */
export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const payload = await verify(token, JWT_SECRET) as TokenPayload;
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}
