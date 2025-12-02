import { userService } from './user.service';
import { hashPassword, verifyPassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import type { PublicUser } from '../db';

/**
 * Authentication result
 */
export interface AuthResult {
  user: PublicUser;
  token: string;
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
    firstName?: string;
    lastName?: string;
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

    // Generate token
    const token = await generateToken(user.id, user.email, user.role);

    return { user, token };
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
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Update last login
    await userService.updateLastLogin(user.id);

    // Generate token
    const token = await generateToken(user.id, user.email, user.role);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as PublicUser,
      token,
    };
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(userId: string): Promise<PublicUser | null> {
    return await userService.findById(userId);
  }
}

// Export singleton instance
export const authService = new AuthService();
