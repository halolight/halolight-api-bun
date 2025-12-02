import { eq, count, and, ilike, sql } from 'drizzle-orm';
import { db } from '../db';
import { teams, teamMembers, users, type Team } from '../db/schema';

/**
 * Team with members
 */
export interface TeamWithMembers extends Team {
  owner: { id: string; name: string | null; email: string; avatar: string | null };
  memberCount: number;
  members?: Array<{
    userId: string;
    roleId: string | null;
    joinedAt: Date;
    user: { id: string; name: string | null; email: string; avatar: string | null };
  }>;
}

/**
 * Team service for database operations
 */
export class TeamService {
  /**
   * Find all teams with pagination
   */
  async findAll(
    page = 1,
    pageSize = 20,
    options?: { search?: string; userId?: string },
  ): Promise<{ teams: TeamWithMembers[]; total: number }> {
    const offset = (page - 1) * pageSize;

    let query = db.select().from(teams);

    if (options?.search) {
      query = query.where(ilike(teams.name, `%${options.search}%`)) as typeof query;
    }

    const teamList = await query
      .limit(pageSize)
      .offset(offset)
      .orderBy(sql`${teams.createdAt} DESC`);

    const result: TeamWithMembers[] = [];

    for (const team of teamList) {
      const [owner] = await db
        .select({ id: users.id, name: users.name, email: users.email, avatar: users.avatar })
        .from(users)
        .where(eq(users.id, team.ownerId))
        .limit(1);

      const [{ value: memberCount }] = await db
        .select({ value: count() })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, team.id));

      result.push({
        ...team,
        owner: owner || { id: team.ownerId, name: null, email: '', avatar: null },
        memberCount,
      });
    }

    const [{ value: total }] = await db.select({ value: count() }).from(teams);

    return { teams: result, total };
  }

  /**
   * Find team by ID with members
   */
  async findById(id: string): Promise<TeamWithMembers | null> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
    if (!team) return null;

    const [owner] = await db
      .select({ id: users.id, name: users.name, email: users.email, avatar: users.avatar })
      .from(users)
      .where(eq(users.id, team.ownerId))
      .limit(1);

    const membersList = await db
      .select({
        userId: teamMembers.userId,
        roleId: teamMembers.roleId,
        joinedAt: teamMembers.joinedAt,
        userName: users.name,
        userEmail: users.email,
        userAvatar: users.avatar,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, id));

    return {
      ...team,
      owner: owner || { id: team.ownerId, name: null, email: '', avatar: null },
      memberCount: membersList.length,
      members: membersList.map((m) => ({
        userId: m.userId,
        roleId: m.roleId,
        joinedAt: m.joinedAt,
        user: { id: m.userId, name: m.userName, email: m.userEmail, avatar: m.userAvatar },
      })),
    };
  }

  /**
   * Create new team
   */
  async create(data: { name: string; description?: string; avatar?: string }, ownerId: string): Promise<Team> {
    const teamId = crypto.randomUUID();
    const [newTeam] = await db
      .insert(teams)
      .values({
        id: teamId,
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        ownerId,
      })
      .returning();

    // Add owner as member
    await db.insert(teamMembers).values({
      teamId: newTeam.id,
      userId: ownerId,
    });

    return newTeam;
  }

  /**
   * Update team
   */
  async update(id: string, data: Partial<{ name: string; description: string; avatar: string }>): Promise<Team | null> {
    const [updatedTeam] = await db
      .update(teams)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, id))
      .returning();

    return updatedTeam || null;
  }

  /**
   * Delete team
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(teams).where(eq(teams.id, id)).returning();
    return result.length > 0;
  }

  /**
   * Add member to team
   */
  async addMember(teamId: string, userId: string, roleId?: string): Promise<void> {
    await db.insert(teamMembers).values({ teamId, userId, roleId }).onConflictDoNothing();
  }

  /**
   * Remove member from team
   */
  async removeMember(teamId: string, userId: string): Promise<void> {
    await db.delete(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  }

  /**
   * Update member role
   */
  async updateMemberRole(teamId: string, userId: string, roleId: string | null): Promise<void> {
    await db
      .update(teamMembers)
      .set({ roleId })
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  }

  /**
   * Check if user is team owner
   */
  async isOwner(teamId: string, userId: string): Promise<boolean> {
    const [team] = await db.select({ ownerId: teams.ownerId }).from(teams).where(eq(teams.id, teamId)).limit(1);
    return team?.ownerId === userId;
  }

  /**
   * Check if user is team member
   */
  async isMember(teamId: string, userId: string): Promise<boolean> {
    const [member] = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .limit(1);
    return !!member;
  }
}

// Export singleton instance
export const teamService = new TeamService();
