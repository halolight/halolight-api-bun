import { eq, count, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { notifications, type Notification } from '../db/schema';

/**
 * Notification service for database operations
 */
export class NotificationService {
  /**
   * Find all notifications for user
   */
  async findByUserId(
    userId: string,
    page = 1,
    pageSize = 20,
    options?: { unreadOnly?: boolean },
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const offset = (page - 1) * pageSize;
    const conditions = [eq(notifications.userId, userId)];

    if (options?.unreadOnly) {
      conditions.push(eq(notifications.read, false));
    }

    const whereClause = and(...conditions);

    const notificationList = await db
      .select()
      .from(notifications)
      .where(whereClause)
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(notifications.createdAt));

    const [{ value: total }] = await db.select({ value: count() }).from(notifications).where(whereClause);

    const [{ value: unreadCount }] = await db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

    return { notifications: notificationList, total, unreadCount };
  }

  /**
   * Find notification by ID
   */
  async findById(id: string): Promise<Notification | null> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
    return notification || null;
  }

  /**
   * Create notification
   */
  async create(data: {
    userId: string;
    type?: string;
    title: string;
    content?: string;
    link?: string;
    payload?: Record<string, unknown>;
  }): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values({
        id: crypto.randomUUID(),
        userId: data.userId,
        type: data.type || 'system',
        title: data.title,
        content: data.content || '',
        link: data.link,
        payload: data.payload,
      })
      .returning();

    return newNotification;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<Notification | null> {
    const [updated] = await db
      .update(notifications)
      .set({ read: true, readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();

    return updated || null;
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await db
      .update(notifications)
      .set({ read: true, readAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
      .returning();

    return result.length;
  }

  /**
   * Delete notification
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id)).returning();
    return result.length > 0;
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const [{ value }] = await db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

    return value;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
