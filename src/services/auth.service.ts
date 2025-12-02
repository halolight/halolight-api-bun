import { eq, and, lt, gt } from 'drizzle-orm';
import { db } from '../db';
import { refreshTokens, roles } from '../db/schema';
import { userService, type UserWithRoles } from './user.service';
import { hashPassword, verifyPassword } from '../utils/hash';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

/**
 * Authentication result with dual tokens
 */
export interface AuthResult {
  user: UserWithRoles;
  accessToken: string;
  refreshToken: string;
}

/**
 * Token refresh result
 */
export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

/**
 * Authentication service
 */
export class AuthService {
  /**
   * Register new user
   */
  async register(data: {
    email: string;
    username: string;
    password: string;
    name?: string;
    phone?: string;
  }): Promise<AuthResult> {
    // Check if email already exists
    const emailExists = await userService.emailExists(data.email);
    if (emailExists) {
      throw new Error('Email already registered');
    }

    // Check if username already exists
    const usernameExists = await userService.usernameExists(data.username);
    if (usernameExists) {
      throw new Error('Username already taken');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await userService.create({
      ...data,
      password: hashedPassword,
    });

    // Assign default 'user' role if exists
    const [defaultRole] = await db.select().from(roles).where(eq(roles.name, 'user')).limit(1);
    if (defaultRole) {
      await userService.assignRole(user.id, defaultRole.id);
    }

    // Get user with roles
    const userWithRoles = await userService.findByIdWithRoles(user.id);
    if (!userWithRoles) {
      throw new Error('Failed to create user');
    }

    // Generate tokens
    const accessToken = await generateAccessToken(user.id, user.email);
    const { token: refreshToken, expiresAt } = await generateRefreshToken(user.id);

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken, expiresAt);

    return { user: userWithRoles, accessToken, refreshToken };
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<AuthResult> {
    // Find user by email (including password)
    const user = await userService.findByEmail(email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new Error('Account is deactivated or suspended');
    }

    // Update last login
    await userService.updateLastLogin(user.id);

    // Get user with roles
    const userWithRoles = await userService.findByIdWithRoles(user.id);
    if (!userWithRoles) {
      throw new Error('User not found');
    }

    // Generate tokens
    const accessToken = await generateAccessToken(user.id, user.email);
    const { token: refreshToken, expiresAt } = await generateRefreshToken(user.id);

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken, expiresAt);

    return { user: userWithRoles, accessToken, refreshToken };
  }

  /**
   * Refresh access token
   */
  async refresh(token: string): Promise<RefreshResult> {
    // Verify the refresh token JWT
    const payload = await verifyRefreshToken(token);

    // Check if token exists in database and is not expired
    const [storedToken] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, token),
          eq(refreshTokens.userId, payload.userId),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!storedToken) {
      throw new Error('Invalid or expired refresh token');
    }

    // Get user by ID and check status
    const userRecord = await userService.findById(payload.userId);
    if (!userRecord) {
      throw new Error('User not found');
    }

    if (userRecord.status !== 'ACTIVE') {
      throw new Error('Account is deactivated or suspended');
    }

    // Delete old refresh token (token rotation)
    await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));

    // Generate new tokens
    const accessToken = await generateAccessToken(payload.userId, userRecord.email);
    const { token: newRefreshToken, expiresAt } = await generateRefreshToken(payload.userId);

    // Store new refresh token
    await db.insert(refreshTokens).values({
      id: crypto.randomUUID(),
      userId: payload.userId,
      token: newRefreshToken,
      expiresAt,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout user (delete refresh token)
   */
  async logout(token: string): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  }

  /**
   * Logout from all devices (delete all refresh tokens)
   */
  async logoutAll(userId: string): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  }

  /**
   * Get current user profile with roles
   */
  async getCurrentUser(userId: string): Promise<UserWithRoles | null> {
    return await userService.findByIdWithRoles(userId);
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db.insert(refreshTokens).values({
      id: crypto.randomUUID(),
      userId,
      token,
      expiresAt,
    });
  }

  /**
   * Clean up expired refresh tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, new Date())).returning();
    return result.length;
  }
}

// Export singleton instance
export const authService = new AuthService();
