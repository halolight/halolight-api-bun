import { eq, count } from 'drizzle-orm';
import { db } from '../db';
import { roles, permissions, rolePermissions, userRoles, type Role } from '../db/schema';

/**
 * Role with permissions
 */
export interface RoleWithPermissions extends Role {
  permissions: Array<{ id: string; action: string; resource: string; description: string | null }>;
  userCount?: number;
}

/**
 * Role service for database operations
 */
export class RoleService {
  /**
   * Find all roles with permissions
   */
  async findAll(): Promise<RoleWithPermissions[]> {
    const roleList = await db.select().from(roles).orderBy(roles.name);

    const result: RoleWithPermissions[] = [];

    for (const role of roleList) {
      const perms = await db
        .select({
          id: permissions.id,
          action: permissions.action,
          resource: permissions.resource,
          description: permissions.description,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, role.id));

      const [{ value: userCount }] = await db
        .select({ value: count() })
        .from(userRoles)
        .where(eq(userRoles.roleId, role.id));

      result.push({
        ...role,
        permissions: perms,
        userCount,
      });
    }

    return result;
  }

  /**
   * Find role by ID with permissions
   */
  async findById(id: string): Promise<RoleWithPermissions | null> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
    if (!role) return null;

    const perms = await db
      .select({
        id: permissions.id,
        action: permissions.action,
        resource: permissions.resource,
        description: permissions.description,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, role.id));

    const [{ value: userCount }] = await db
      .select({ value: count() })
      .from(userRoles)
      .where(eq(userRoles.roleId, role.id));

    return {
      ...role,
      permissions: perms,
      userCount,
    };
  }

  /**
   * Find role by name
   */
  async findByName(name: string): Promise<Role | null> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
    return role || null;
  }

  /**
   * Create new role
   */
  async create(data: { name: string; label?: string; description?: string }): Promise<Role> {
    const [newRole] = await db
      .insert(roles)
      .values({
        id: crypto.randomUUID(),
        name: data.name,
        label: data.label,
        description: data.description,
      })
      .returning();

    return newRole;
  }

  /**
   * Update role
   */
  async update(id: string, data: Partial<{ label: string; description: string }>): Promise<Role | null> {
    const [updatedRole] = await db
      .update(roles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, id))
      .returning();

    return updatedRole || null;
  }

  /**
   * Delete role (only if no users assigned)
   */
  async delete(id: string): Promise<boolean> {
    // Check if any users have this role
    const [{ value: userCount }] = await db.select({ value: count() }).from(userRoles).where(eq(userRoles.roleId, id));

    if (userCount > 0) {
      throw new Error('Cannot delete role with assigned users');
    }

    const result = await db.delete(roles).where(eq(roles.id, id)).returning();
    return result.length > 0;
  }

  /**
   * Assign permissions to role
   */
  async assignPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    // Remove existing permissions
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

    // Add new permissions
    if (permissionIds.length > 0) {
      await db.insert(rolePermissions).values(
        permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      );
    }
  }

  /**
   * Check if role name exists
   */
  async nameExists(name: string, excludeId?: string): Promise<boolean> {
    if (excludeId) {
      // We need to check if name exists for a different role
      const [role] = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
      return role ? role.id !== excludeId : false;
    }
    const [role] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, name)).limit(1);
    return !!role;
  }
}

// Export singleton instance
export const roleService = new RoleService();
