import { db } from './index';
import {
  users,
  roles,
  permissions,
  rolePermissions,
  userRoles,
  teams,
  teamMembers,
  documents,
  tags,
  documentTags,
  calendarEvents,
  eventAttendees,
  conversations,
  conversationParticipants,
  messages,
  notifications,
  activityLogs,
} from './schema';

// Chinese names for realistic data
const surnames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴'];
const givenNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军'];
const departments = ['技术部', '产品部', '设计部', '市场部', '运营部', '人力资源部'];
const positions = ['工程师', '高级工程师', '产品经理', '设计师', '运营专员', '经理'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomChineseName(): string {
  return randomItem(surnames) + randomItem(givenNames) + (Math.random() > 0.5 ? randomItem(givenNames) : '');
}

/**
 * Seed database with comprehensive demo data
 */
async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Check if users already exist
    const existingUsers = await db.select().from(users).limit(1);

    if (existingUsers.length > 0) {
      console.log('⚠️  Database already seeded, skipping...');
      process.exit(0);
    }

    // Hash password using Bun's built-in API
    const hashedPassword = await Bun.password.hash('123456', {
      algorithm: 'bcrypt',
      cost: 10,
    });

    console.log('📝 Creating permissions...');
    // Create permissions
    const resources = [
      'users',
      'roles',
      'teams',
      'documents',
      'files',
      'calendar',
      'notifications',
      'messages',
      'dashboard',
    ];
    const actions = ['create', 'read', 'update', 'delete', 'manage'];

    const permissionData = [];
    for (const resource of resources) {
      for (const action of actions) {
        permissionData.push({
          id: crypto.randomUUID(),
          action,
          resource,
          description: `${action} ${resource}`,
        });
      }
    }
    // Add wildcard permission
    permissionData.push({ id: crypto.randomUUID(), action: '*', resource: '*', description: 'All permissions' });

    const createdPermissions = await db.insert(permissions).values(permissionData).returning();
    console.log(`   Created ${createdPermissions.length} permissions`);

    console.log('📝 Creating roles...');
    // Create roles
    const [adminRole, userRole, editorRole] = await db
      .insert(roles)
      .values([
        { id: crypto.randomUUID(), name: 'admin', label: '管理员', description: '系统管理员，拥有所有权限' },
        { id: crypto.randomUUID(), name: 'user', label: '普通用户', description: '普通用户，基本权限' },
        { id: crypto.randomUUID(), name: 'editor', label: '编辑', description: '内容编辑，可管理文档' },
      ])
      .returning();
    console.log('   Created 3 roles');

    // Assign permissions to roles
    const wildcardPerm = createdPermissions.find((p) => p.action === '*' && p.resource === '*');
    const readPerms = createdPermissions.filter((p) => p.action === 'read');
    const createPerms = createdPermissions.filter((p) => p.action === 'create');
    const updatePerms = createdPermissions.filter((p) => p.action === 'update');

    // Admin gets all permissions
    if (wildcardPerm) {
      await db.insert(rolePermissions).values({ roleId: adminRole.id, permissionId: wildcardPerm.id });
    }

    // User gets read and create permissions
    for (const perm of [...readPerms, ...createPerms]) {
      await db.insert(rolePermissions).values({ roleId: userRole.id, permissionId: perm.id });
    }

    // Editor gets read, create, update permissions
    for (const perm of [...readPerms, ...createPerms, ...updatePerms]) {
      await db.insert(rolePermissions).values({ roleId: editorRole.id, permissionId: perm.id });
    }

    console.log('📝 Creating users...');
    // Create users - aligned with Next.js schema (no isVerified, status is uppercase)
    const userData = [
      {
        id: crypto.randomUUID(),
        email: 'admin@halolight.h7ml.cn',
        username: 'admin',
        password: hashedPassword,
        name: '系统管理员',
        phone: '13800138000',
        department: '技术部',
        position: '系统管理员',
        status: 'ACTIVE' as const,
      },
      {
        id: crypto.randomUUID(),
        email: 'demo@halolight.h7ml.cn',
        username: 'demo',
        password: hashedPassword,
        name: '演示用户',
        phone: '13800138001',
        department: '产品部',
        position: '产品经理',
        status: 'ACTIVE' as const,
      },
    ];

    // Add more users
    for (let i = 1; i <= 28; i++) {
      userData.push({
        id: crypto.randomUUID(),
        email: `user${i}@halolight.h7ml.cn`,
        username: `user${i}`,
        password: hashedPassword,
        name: randomChineseName(),
        phone: `138${String(i).padStart(8, '0')}`,
        department: randomItem(departments),
        position: randomItem(positions),
        status: 'ACTIVE' as const,
      });
    }

    const createdUsers = await db.insert(users).values(userData).returning();
    console.log(`   Created ${createdUsers.length} users`);

    // Assign roles to users
    await db.insert(userRoles).values({ userId: createdUsers[0].id, roleId: adminRole.id }); // admin
    await db.insert(userRoles).values({ userId: createdUsers[1].id, roleId: editorRole.id }); // demo
    for (let i = 2; i < createdUsers.length; i++) {
      await db.insert(userRoles).values({ userId: createdUsers[i].id, roleId: userRole.id });
    }

    console.log('📝 Creating teams...');
    // Create teams
    const teamData = [
      { id: crypto.randomUUID(), name: '核心开发团队', description: '负责核心功能开发', ownerId: createdUsers[0].id },
      {
        id: crypto.randomUUID(),
        name: '产品设计团队',
        description: '负责产品设计和用户体验',
        ownerId: createdUsers[1].id,
      },
      { id: crypto.randomUUID(), name: '市场运营团队', description: '负责市场推广和运营', ownerId: createdUsers[2].id },
      { id: crypto.randomUUID(), name: '质量保障团队', description: '负责测试和质量保障', ownerId: createdUsers[3].id },
      {
        id: crypto.randomUUID(),
        name: '技术支持团队',
        description: '负责技术支持和客户服务',
        ownerId: createdUsers[4].id,
      },
    ];

    const createdTeams = await db.insert(teams).values(teamData).returning();
    console.log(`   Created ${createdTeams.length} teams`);

    // Add team members (schema has teamId, userId, roleId, joinedAt - no 'role' field)
    for (const team of createdTeams) {
      const memberCount = Math.floor(Math.random() * 5) + 3;
      const memberIds = new Set<string>();
      memberIds.add(team.ownerId); // Owner is always a member

      while (memberIds.size < memberCount) {
        const randomUser = randomItem(createdUsers);
        memberIds.add(randomUser.id);
      }

      for (const userId of memberIds) {
        await db.insert(teamMembers).values({
          teamId: team.id,
          userId,
        });
      }
    }

    console.log('📝 Creating tags...');
    // Create tags
    const tagData = [
      { id: crypto.randomUUID(), name: '重要', color: '#ef4444' },
      { id: crypto.randomUUID(), name: '紧急', color: '#f97316' },
      { id: crypto.randomUUID(), name: '技术', color: '#3b82f6' },
      { id: crypto.randomUUID(), name: '产品', color: '#10b981' },
      { id: crypto.randomUUID(), name: '设计', color: '#8b5cf6' },
      { id: crypto.randomUUID(), name: '文档', color: '#6366f1' },
      { id: crypto.randomUUID(), name: '会议', color: '#ec4899' },
      { id: crypto.randomUUID(), name: '待办', color: '#f59e0b' },
      { id: crypto.randomUUID(), name: '已完成', color: '#22c55e' },
      { id: crypto.randomUUID(), name: '归档', color: '#6b7280' },
    ];

    const createdTags = await db.insert(tags).values(tagData).returning();
    console.log(`   Created ${createdTags.length} tags`);

    console.log('📝 Creating documents...');
    // Create documents
    const docTitles = [
      'API 设计规范',
      '用户手册',
      '技术架构文档',
      '产品需求文档',
      '测试计划',
      '部署指南',
      '安全规范',
      '代码规范',
      '数据库设计',
      '接口文档',
    ];

    const documentData = [];
    for (let i = 0; i < 30; i++) {
      documentData.push({
        id: crypto.randomUUID(),
        title: `${randomItem(docTitles)} v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}`,
        content: `这是文档内容的示例文本。文档编号：${i + 1}。创建于 ${new Date().toLocaleDateString('zh-CN')}。`,
        type: randomItem(['document', 'spreadsheet', 'presentation', 'pdf']),
        folder: randomItem(['工作文档', '项目资料', '技术文档', '会议记录', '']),
        ownerId: randomItem(createdUsers).id,
        teamId: Math.random() > 0.5 ? randomItem(createdTeams).id : null,
        views: Math.floor(Math.random() * 100),
      });
    }

    const createdDocuments = await db.insert(documents).values(documentData).returning();
    console.log(`   Created ${createdDocuments.length} documents`);

    // Add tags to documents
    for (const doc of createdDocuments) {
      const tagCount = Math.floor(Math.random() * 3) + 1;
      const docTags = new Set<string>();
      while (docTags.size < tagCount) {
        docTags.add(randomItem(createdTags).id);
      }
      for (const tagId of docTags) {
        await db.insert(documentTags).values({ documentId: doc.id, tagId });
      }
    }

    console.log('📝 Creating calendar events...');
    // Create calendar events
    const eventTitles = [
      '团队周会',
      '项目评审',
      '技术分享',
      '产品讨论',
      '客户会议',
      '培训课程',
      '代码审查',
      '需求评审',
    ];
    const eventData = [];
    const now = new Date();

    for (let i = 0; i < 31; i++) {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) - 10);
      startDate.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1 + Math.floor(Math.random() * 2));

      eventData.push({
        id: crypto.randomUUID(),
        title: randomItem(eventTitles),
        description: `这是一个${randomItem(eventTitles)}的详细描述。`,
        startAt: startDate,
        endAt: endDate,
        type: randomItem(['meeting', 'task', 'reminder', 'holiday'] as const),
        color: randomItem(['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']),
        allDay: Math.random() > 0.8,
        location: randomItem(['会议室A', '会议室B', '线上会议', '办公区', '']),
        ownerId: randomItem(createdUsers).id,
        teamId: Math.random() > 0.5 ? randomItem(createdTeams).id : null,
      });
    }

    const createdEvents = await db.insert(calendarEvents).values(eventData).returning();
    console.log(`   Created ${createdEvents.length} calendar events`);

    // Add attendees to events
    for (const event of createdEvents) {
      const attendeeCount = Math.floor(Math.random() * 5) + 1;
      const attendeeIds = new Set<string>();
      attendeeIds.add(event.ownerId);

      while (attendeeIds.size < attendeeCount) {
        attendeeIds.add(randomItem(createdUsers).id);
      }

      for (const userId of attendeeIds) {
        await db.insert(eventAttendees).values({
          eventId: event.id,
          userId,
          status: randomItem(['pending', 'accepted', 'declined', 'tentative'] as const),
        });
      }
    }

    console.log('📝 Creating conversations and messages...');
    // Create conversations
    const conversationData = [];

    // Group conversations
    for (let i = 0; i < 6; i++) {
      conversationData.push({
        id: crypto.randomUUID(),
        name: `${randomItem(['项目', '技术', '产品', '设计', '运营', '团队'])}讨论群`,
        isGroup: true,
        teamId: Math.random() > 0.5 ? randomItem(createdTeams).id : null,
      });
    }

    // Private conversations
    for (let i = 0; i < 8; i++) {
      conversationData.push({
        id: crypto.randomUUID(),
        name: null,
        isGroup: false,
        teamId: null,
      });
    }

    const createdConversations = await db.insert(conversations).values(conversationData).returning();
    console.log(`   Created ${createdConversations.length} conversations`);

    // Add participants and messages
    for (const conv of createdConversations) {
      const participantCount = conv.isGroup ? Math.floor(Math.random() * 5) + 3 : 2;
      const participantIds: string[] = [];

      while (participantIds.length < participantCount) {
        const user = randomItem(createdUsers);
        if (!participantIds.includes(user.id)) {
          participantIds.push(user.id);
        }
      }

      for (const userId of participantIds) {
        await db.insert(conversationParticipants).values({
          conversationId: conv.id,
          userId,
          unreadCount: Math.floor(Math.random() * 5),
        });
      }

      // Add messages
      const messageCount = Math.floor(Math.random() * 12) + 8;
      const messageContents = ['你好！', '收到', '好的', '明白了', '稍等', '没问题', '谢谢', '辛苦了', '加油', '👍'];

      for (let i = 0; i < messageCount; i++) {
        await db.insert(messages).values({
          id: crypto.randomUUID(),
          conversationId: conv.id,
          senderId: randomItem(participantIds),
          type: 'text',
          content: randomItem(messageContents),
        });
      }
    }

    console.log('📝 Creating notifications...');
    // Create notifications - schema uses 'read' instead of 'isRead', and 'type' is text not enum
    const notificationTypes = ['system', 'user', 'message', 'task', 'alert'];
    const notificationTitles = ['系统通知', '新消息', '任务提醒', '审批通知', '安全提醒', '更新通知'];

    for (const user of createdUsers.slice(0, 10)) {
      const notifCount = Math.floor(Math.random() * 8) + 4;
      for (let i = 0; i < notifCount; i++) {
        const isRead = Math.random() > 0.5;
        await db.insert(notifications).values({
          id: crypto.randomUUID(),
          userId: user.id,
          type: randomItem(notificationTypes),
          title: randomItem(notificationTitles),
          content: `这是一条${randomItem(notificationTitles)}的详细内容。`,
          read: isRead,
          readAt: isRead ? new Date() : null,
        });
      }
    }
    console.log('   Created notifications');

    console.log('📝 Creating activity logs...');
    // Create activity logs - schema doesn't have ipAddress
    const actionTypes = ['create', 'update', 'delete', 'login', 'logout', 'view', 'share', 'download'];
    const targetTypes = ['user', 'document', 'team', 'file', 'event'];

    for (let i = 0; i < 50; i++) {
      await db.insert(activityLogs).values({
        id: crypto.randomUUID(),
        actorId: randomItem(createdUsers).id,
        action: randomItem(actionTypes),
        targetType: randomItem(targetTypes),
        targetId: null,
        metadata: { source: 'seed' },
      });
    }
    console.log('   Created 50 activity logs');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Demo accounts:');
    console.log('   Admin: admin@halolight.h7ml.cn / 123456');
    console.log('   Demo:  demo@halolight.h7ml.cn / 123456');
    console.log('   Users: user1-28@halolight.h7ml.cn / 123456');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

void seed();
