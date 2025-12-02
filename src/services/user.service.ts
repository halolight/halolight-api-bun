import { eq, count, sql, ilike, or, and, inArray } from 'drizzle-orm';
import { db } from '../db';
import {
  users,
  userRoles,
  roles,
  rolePermissions,
  permissions,
  type User,
  type PublicUser,
  publicUserSchema,
} from '../db/schema';

/**
 * User with roles and permissions
 */
export interface UserWithRoles extends PublicUser {
  roles: string[];
  permissions: string[];
}

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
   * Find user by ID with roles and permissions
   */
  async findByIdWithRoles(id: string): Promise<UserWithRoles | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) return null;

    const userRolesList = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, id));

    const roleNames = userRolesList.map((r) => r.roleName);

    // Get permissions for all roles
    let permissionNames: string[] = [];
    if (roleNames.length > 0) {
      const roleIds = await db.select({ id: roles.id }).from(roles).where(inArray(roles.name, roleNames));

      if (roleIds.length > 0) {
        const perms = await db
          .select({ action: permissions.action, resource: permissions.resource })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(
            inArray(
              rolePermissions.roleId,
              roleIds.map((r) => r.id),
            ),
          );
        permissionNames = [...new Set(perms.map((p) => `${p.resource}:${p.action}`))];
      }
    }

    const publicUser = publicUserSchema.parse(user);
    return {
      ...publicUser,
      roles: roleNames,
      permissions: permissionNames,
    };
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
   * Get paginated list of users with optional search and filters
   */
  async findAll(
    page = 1,
    pageSize = 20,
    options?: {
      search?: string;
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
      role?: string;
    },
  ): Promise<{ users: PublicUser[]; total: number }> {
    const offset = (page - 1) * pageSize;

    // Build where conditions
    const conditions = [];

    if (options?.search) {
      conditions.push(
        or(
          ilike(users.name, `%${options.search}%`),
          ilike(users.username, `%${options.search}%`),
          ilike(users.email, `%${options.search}%`),
        ),
      );
    }

    if (options?.status) {
      conditions.push(eq(users.status, options.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get users with pagination
    const userList = await db
      .select()
      .from(users)
      .where(whereClause)
      .limit(pageSize)
      .offset(offset)
      .orderBy(sql`${users.createdAt} DESC`);

    // Get total count
    const [{ value: total }] = await db.select({ value: count() }).from(users).where(whereClause);

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
    name?: string;
    phone?: string;
  }): Promise<PublicUser> {
    const [newUser] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: userData.email,
        username: userData.username,
        password: userData.password,
        name: userData.name || userData.username,
        phone: userData.phone,
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
      name: string;
      phone: string;
      avatar: string | null;
      department: string;
      position: string;
      bio: string;
      status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    }>,
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
   * Update user status
   */
  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Promise<PublicUser | null> {
    return this.update(id, { status });
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  /**
   * Batch delete users
   */
  async batchDelete(ids: string[]): Promise<number> {
    const result = await db.delete(users).where(inArray(users.id, ids)).returning();
    return result.length;
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

  /**
   * Assign role to user
   */
  async assignRole(userId: string, roleId: string): Promise<void> {
    await db.insert(userRoles).values({ userId, roleId }).onConflictDoNothing();
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string, roleId: string): Promise<void> {
    await db.delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<string[]> {
    const userRolesList = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    return userRolesList.map((r) => r.roleName);
  }
}

// Export singleton instance
export const userService = new UserService();
