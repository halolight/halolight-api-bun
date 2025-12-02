import { eq, count, sql } from 'drizzle-orm';
import { db, users, type User, type PublicUser, publicUserSchema } from '../db';

/**
 * User service for database operations
 */
export class UserService {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<PublicUser | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ? publicUserSchema.parse(user) : null;
  }

  /**
   * Find user by email (including password for authentication)
   */
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user || null;
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user || null;
  }

  /**
   * Get paginated list of users
   */
  async findAll(page = 1, pageSize = 20): Promise<{ users: PublicUser[]; total: number }> {
    const offset = (page - 1) * pageSize;

    // Get users with pagination
    const userList = await db
      .select()
      .from(users)
      .limit(pageSize)
      .offset(offset)
      .orderBy(sql`${users.createdAt} DESC`);

    // Get total count
    const [{ value: total }] = await db.select({ value: count() }).from(users);

    return {
      users: userList.map((user) => publicUserSchema.parse(user)),
      total,
    };
  }

  /**
   * Create new user
   */
  async create(userData: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }): Promise<PublicUser> {
    const [newUser] = await db
      .insert(users)
      .values({
        email: userData.email,
        username: userData.username,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || 'user',
      })
      .returning();

    return publicUserSchema.parse(newUser);
  }

  /**
   * Update user
   */
  async update(
    id: string,
    userData: Partial<{
      email: string;
      username: string;
      firstName: string;
      lastName: string;
      avatar: string;
      isActive: boolean;
      isVerified: boolean;
      role: string;
    }>
  ): Promise<PublicUser | null> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return updatedUser ? publicUserSchema.parse(updatedUser) : null;
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    return !!user;
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
    return !!user;
  }
}

// Export singleton instance
export const userService = new UserService();
