import { sign, verify } from 'hono/jwt';
import type { JWTPayload } from 'hono/utils/jwt/types';

/**
 * JWT configuration
 */
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Validate secrets in production
if (process.env.NODE_ENV === 'production') {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters in production');
  }
  if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be set and at least 32 characters in production');
  }
}

// Use defaults only in development
const getJwtSecret = () => JWT_SECRET || 'dev-jwt-secret-minimum-32-characters-long';
const getRefreshSecret = () => JWT_REFRESH_SECRET || 'dev-refresh-secret-minimum-32-characters';

/**
 * Convert expires in string to seconds
 */
function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('Invalid expires format. Use format: 1s, 1m, 1h, 1d');
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
 * Custom JWT payload interface for access token
 */
export interface AccessTokenPayload extends JWTPayload {
  userId: string;
  email: string;
  type: 'access';
}

/**
 * Custom JWT payload interface for refresh token
 */
export interface RefreshTokenPayload extends JWTPayload {
  userId: string;
  type: 'refresh';
}

/**
 * Token pair result
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generate access token for user
 */
export async function generateAccessToken(userId: string, email: string): Promise<string> {
  const expiresInSeconds = parseExpiresIn(JWT_EXPIRES_IN);
  const now = Math.floor(Date.now() / 1000);

  const payload: AccessTokenPayload = {
    userId,
    email,
    type: 'access',
    iat: now,
    exp: now + expiresInSeconds,
  };

  return await sign(payload, getJwtSecret());
}

/**
 * Generate refresh token for user
 */
export async function generateRefreshToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const expiresInSeconds = parseExpiresIn(JWT_REFRESH_EXPIRES_IN);
  const now = Math.floor(Date.now() / 1000);

  const payload: RefreshTokenPayload = {
    userId,
    type: 'refresh',
    iat: now,
    exp: now + expiresInSeconds,
  };

  const token = await sign(payload, getRefreshSecret());
  const expiresAt = new Date((now + expiresInSeconds) * 1000);

  return { token, expiresAt };
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokenPair(userId: string, email: string): Promise<TokenPair> {
  const accessToken = await generateAccessToken(userId, email);
  const { token: refreshToken } = await generateRefreshToken(userId);
  const expiresIn = parseExpiresIn(JWT_EXPIRES_IN);

  return { accessToken, refreshToken, expiresIn };
}

/**
 * Verify access token and return payload
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  try {
    const payload = (await verify(token, getJwtSecret())) as AccessTokenPayload;
    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return payload;
  } catch {
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Verify refresh token and return payload
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  try {
    const payload = (await verify(token, getRefreshSecret())) as RefreshTokenPayload;
    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return payload;
  } catch {
    throw new Error('Invalid or expired refresh token');
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

/**
 * Get refresh token expiration date
 */
export function getRefreshTokenExpiresAt(): Date {
  const expiresInSeconds = parseExpiresIn(JWT_REFRESH_EXPIRES_IN);
  return new Date(Date.now() + expiresInSeconds * 1000);
}
