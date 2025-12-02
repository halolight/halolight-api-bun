import { count, sql, gte, and, eq } from 'drizzle-orm';
import { db } from '../db';
import { users, documents, teams, files, calendarEvents, notifications, activityLogs } from '../db/schema';

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  users: { total: number; active: number; newThisMonth: number };
  documents: { total: number; createdThisWeek: number };
  teams: { total: number };
  files: { total: number; totalSize: number };
  events: { total: number; upcoming: number };
  notifications: { unread: number };
}

/**
 * Dashboard service for statistics and analytics
 */
export class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getStats(userId?: string): Promise<DashboardStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // Users stats
    const [{ value: totalUsers }] = await db.select({ value: count() }).from(users);
    const [{ value: activeUsers }] = await db.select({ value: count() }).from(users).where(eq(users.status, 'ACTIVE'));
    const [{ value: newUsersThisMonth }] = await db
      .select({ value: count() })
      .from(users)
      .where(gte(users.createdAt, startOfMonth));

    // Documents stats
    const [{ value: totalDocuments }] = await db.select({ value: count() }).from(documents);
    const [{ value: documentsThisWeek }] = await db
      .select({ value: count() })
      .from(documents)
      .where(gte(documents.createdAt, startOfWeek));

    // Teams stats
    const [{ value: totalTeams }] = await db.select({ value: count() }).from(teams);

    // Files stats
    const [{ value: totalFiles }] = await db.select({ value: count() }).from(files);
    const fileSizeResult = await db.select({ totalSize: sql<number>`COALESCE(SUM(${files.size}), 0)` }).from(files);
    const totalFileSize = fileSizeResult[0]?.totalSize || 0;

    // Events stats
    const [{ value: totalEvents }] = await db.select({ value: count() }).from(calendarEvents);
    const [{ value: upcomingEvents }] = await db
      .select({ value: count() })
      .from(calendarEvents)
      .where(gte(calendarEvents.startAt, now));

    // Notifications stats (for current user if provided)
    let unreadNotifications = 0;
    if (userId) {
      const [{ value }] = await db
        .select({ value: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
      unreadNotifications = value;
    }

    return {
      users: { total: totalUsers, active: activeUsers, newThisMonth: newUsersThisMonth },
      documents: { total: totalDocuments, createdThisWeek: documentsThisWeek },
      teams: { total: totalTeams },
      files: { total: totalFiles, totalSize: totalFileSize },
      events: { total: totalEvents, upcoming: upcomingEvents },
      notifications: { unread: unreadNotifications },
    };
  }

  /**
   * Get visit trends (last 7 days) - mock data for demo
   */
  async getVisitTrends(): Promise<Array<{ date: string; visits: number; uniqueVisitors: number }>> {
    const trends = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toISOString().split('T')[0],
        visits: Math.floor(Math.random() * 1000) + 500,
        uniqueVisitors: Math.floor(Math.random() * 500) + 200,
      });
    }

    return trends;
  }

  /**
   * Get sales trends (last 6 months) - mock data for demo
   */
  async getSalesTrends(): Promise<Array<{ month: string; sales: number; orders: number }>> {
    const trends = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      trends.push({
        month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        sales: Math.floor(Math.random() * 50000) + 10000,
        orders: Math.floor(Math.random() * 500) + 100,
      });
    }

    return trends;
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(limit = 20): Promise<
    Array<{
      id: string;
      action: string;
      targetType: string;
      targetId: string | null;
      createdAt: Date;
      actor: { id: string; name: string | null } | null;
    }>
  > {
    const activities = await db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        targetType: activityLogs.targetType,
        targetId: activityLogs.targetId,
        createdAt: activityLogs.createdAt,
        actorId: activityLogs.actorId,
        actorName: users.name,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.actorId, users.id))
      .orderBy(sql`${activityLogs.createdAt} DESC`)
      .limit(limit);

    return activities.map((a) => ({
      id: a.id,
      action: a.action,
      targetType: a.targetType,
      targetId: a.targetId,
      createdAt: a.createdAt,
      actor: a.actorId ? { id: a.actorId, name: a.actorName } : null,
    }));
  }

  /**
   * Get pie chart data - mock data for demo
   */
  async getPieChartData(): Promise<Array<{ name: string; value: number; color: string }>> {
    return [
      { name: 'Documents', value: 35, color: '#3b82f6' },
      { name: 'Images', value: 25, color: '#10b981' },
      { name: 'Videos', value: 20, color: '#f59e0b' },
      { name: 'Audio', value: 10, color: '#ef4444' },
      { name: 'Others', value: 10, color: '#8b5cf6' },
    ];
  }

  /**
   * Get task list - mock data for demo
   */
  async getTaskList(): Promise<
    Array<{ id: string; title: string; status: string; priority: string; dueDate: string }>
  > {
    const tasks = [];
    const statuses = ['pending', 'in_progress', 'completed'];
    const priorities = ['low', 'medium', 'high'];
    const titles = [
      'Review project documentation',
      'Update user interface',
      'Fix authentication bug',
      'Deploy to production',
      'Write unit tests',
      'Code review',
      'Database optimization',
      'API documentation',
    ];

    for (let i = 0; i < 15; i++) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 14) - 3);
      tasks.push({
        id: `task-${i + 1}`,
        title: titles[i % titles.length],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        dueDate: dueDate.toISOString().split('T')[0],
      });
    }

    return tasks;
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
