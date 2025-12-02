import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { permissions, rolePermissions, type Permission } from '../db/schema';

/**
 * Permission service for database operations
 */
export class PermissionService {
  /**
   * Find all permissions
   */
  async findAll(): Promise<Permission[]> {
    return await db.select().from(permissions).orderBy(permissions.resource, permissions.action);
  }

  /**
   * Find permission by ID
   */
  async findById(id: string): Promise<Permission | null> {
    const [permission] = await db.select().from(permissions).where(eq(permissions.id, id)).limit(1);
    return permission || null;
  }

  /**
   * Find permission by action and resource
   */
  async findByActionResource(action: string, resource: string): Promise<Permission | null> {
    const [permission] = await db
      .select()
      .from(permissions)
      .where(and(eq(permissions.action, action), eq(permissions.resource, resource)))
      .limit(1);
    return permission || null;
  }

  /**
   * Create new permission
   */
  async create(data: { action: string; resource: string; description?: string }): Promise<Permission> {
    const [newPermission] = await db
      .insert(permissions)
      .values({
        id: crypto.randomUUID(),
        action: data.action,
        resource: data.resource,
        description: data.description,
      })
      .returning();

    return newPermission;
  }

  /**
   * Delete permission
   */
  async delete(id: string): Promise<boolean> {
    // First remove from role_permissions
    await db.delete(rolePermissions).where(eq(rolePermissions.permissionId, id));

    const result = await db.delete(permissions).where(eq(permissions.id, id)).returning();
    return result.length > 0;
  }

  /**
   * Check if permission exists
   */
  async exists(action: string, resource: string): Promise<boolean> {
    const [permission] = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(and(eq(permissions.action, action), eq(permissions.resource, resource)))
      .limit(1);
    return !!permission;
  }

  /**
   * Get permissions grouped by resource
   */
  async getGroupedByResource(): Promise<Record<string, Permission[]>> {
    const allPermissions = await this.findAll();
    const grouped: Record<string, Permission[]> = {};

    for (const permission of allPermissions) {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = [];
      }
      grouped[permission.resource].push(permission);
    }

    return grouped;
  }
}

// Export singleton instance
export const permissionService = new PermissionService();
