import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

// 注意：数据库中实际使用的枚举名是 "UserStatus"，值为大写
export const userStatusEnum = pgEnum('UserStatus', ['ACTIVE', 'INACTIVE', 'SUSPENDED']);
export const sharePermissionEnum = pgEnum('share_permission', ['read', 'write', 'admin']);
export const attendeeStatusEnum = pgEnum('attendee_status', ['pending', 'accepted', 'declined', 'tentative']);
export const notificationTypeEnum = pgEnum('notification_type', ['system', 'user', 'message', 'task', 'alert']);
export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'file', 'system']);
export const eventTypeEnum = pgEnum('event_type', ['meeting', 'task', 'reminder', 'holiday']);

// ============================================================================
// Users Table (对齐 Next.js 数据库结构)
// ============================================================================

export const users = pgTable('users', {
  id: text('id').primaryKey().notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  status: userStatusEnum('status').notNull().default('ACTIVE'),
  department: text('department'),
  position: text('position'),
  bio: text('bio'),
  quotaUsed: bigint('quotaUsed', { mode: 'number' }).notNull().default(0),
  lastLoginAt: timestamp('lastLoginAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// ============================================================================
// Authorization Tables (RBAC)
// ============================================================================

export const roles = pgTable('roles', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull().unique(),
  label: text('label'),
  description: text('description'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const permissions = pgTable('permissions', {
  id: text('id').primaryKey().notNull(),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  description: text('description'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: text('roleId')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: text('permissionId')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  }),
);

export const userRoles = pgTable(
  'user_roles',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: text('roleId')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
  }),
);

// ============================================================================
// Teams and Membership - 对齐 Next.js 数据库结构
// ============================================================================

export const teams = pgTable('teams', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  avatar: text('avatar'),
  ownerId: text('ownerId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const teamMembers = pgTable(
  'team_members',
  {
    teamId: text('teamId')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: text('roleId'),
    joinedAt: timestamp('joinedAt').notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.teamId, table.userId] }),
  }),
);

// ============================================================================
// Folders (Tree Structure)
// ============================================================================

export const folders = pgTable('folders', {
  id: text('id').primaryKey().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  path: varchar('path', { length: 1000 }),
  parentId: text('parentId'),
  ownerId: text('ownerId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  teamId: text('teamId').references(() => teams.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// Documents - 对齐 Next.js 数据库结构
// ============================================================================

export const documents = pgTable('documents', {
  id: text('id').primaryKey().notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  folder: text('folder'),
  type: text('type').notNull(),
  size: bigint('size', { mode: 'number' }).notNull().default(0),
  views: integer('views').notNull().default(0),
  ownerId: text('ownerId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  teamId: text('teamId').references(() => teams.id, { onDelete: 'set null' }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const documentShares = pgTable('document_shares', {
  id: text('id').primaryKey().notNull(),
  documentId: text('documentId')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  sharedWithUserId: text('sharedWithUserId').references(() => users.id, { onDelete: 'cascade' }),
  sharedWithTeamId: text('sharedWithTeamId').references(() => teams.id, { onDelete: 'cascade' }),
  permission: sharePermissionEnum('permission').notNull().default('read'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const tags = pgTable('tags', {
  id: text('id').primaryKey().notNull(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  color: varchar('color', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const documentTags = pgTable(
  'document_tags',
  {
    documentId: text('documentId')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    tagId: text('tagId')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.documentId, table.tagId] }),
  }),
);

// ============================================================================
// Files
// ============================================================================

export const files = pgTable('files', {
  id: text('id').primaryKey().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  path: varchar('path', { length: 1000 }),
  mimeType: varchar('mime_type', { length: 150 }),
  size: integer('size').default(0),
  thumbnail: text('thumbnail'),
  folderId: text('folderId').references(() => folders.id, { onDelete: 'set null' }),
  ownerId: text('ownerId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  teamId: text('teamId').references(() => teams.id, { onDelete: 'set null' }),
  isFavorite: boolean('is_favorite').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// Calendar Events
// ============================================================================

export const calendarEvents = pgTable('calendar_events', {
  id: text('id').primaryKey().notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  type: eventTypeEnum('type').notNull().default('meeting'),
  color: varchar('color', { length: 20 }),
  allDay: boolean('all_day').notNull().default(false),
  location: varchar('location', { length: 255 }),
  ownerId: text('ownerId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  teamId: text('teamId').references(() => teams.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const eventAttendees = pgTable(
  'event_attendees',
  {
    eventId: text('eventId')
      .notNull()
      .references(() => calendarEvents.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: attendeeStatusEnum('status').notNull().default('pending'),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.eventId, table.userId] }),
  }),
);

export const eventReminders = pgTable('event_reminders', {
  id: text('id').primaryKey().notNull(),
  eventId: text('eventId')
    .notNull()
    .references(() => calendarEvents.id, { onDelete: 'cascade' }),
  remindAt: timestamp('remind_at', { withTimezone: true }).notNull(),
  method: varchar('method', { length: 30 }).notNull().default('email'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
});

// ============================================================================
// Conversations and Messaging
// ============================================================================

export const conversations = pgTable('conversations', {
  id: text('id').primaryKey().notNull(),
  name: varchar('name', { length: 200 }),
  isGroup: boolean('is_group').notNull().default(false),
  avatar: text('avatar'),
  teamId: text('teamId').references(() => teams.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const conversationParticipants = pgTable(
  'conversation_participants',
  {
    conversationId: text('conversationId')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    unreadCount: integer('unread_count').notNull().default(0),
    lastReadAt: timestamp('last_read_at', { withTimezone: true }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.conversationId, table.userId] }),
  }),
);

export const messages = pgTable('messages', {
  id: text('id').primaryKey().notNull(),
  conversationId: text('conversationId')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: text('senderId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: messageTypeEnum('type').notNull().default('text'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// Notifications - 对齐 Next.js 数据库结构
// ============================================================================

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().notNull(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  link: text('link'),
  payload: jsonb('payload').$type<Record<string, unknown>>(),
  read: boolean('read').notNull().default(false),
  readAt: timestamp('readAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

// ============================================================================
// Activity Logs - 对齐 Next.js 数据库结构
// ============================================================================

export const activityLogs = pgTable('activity_logs', {
  id: text('id').primaryKey().notNull(),
  actorId: text('actorId').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  targetType: text('targetType').notNull(),
  targetId: text('targetId'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

// ============================================================================
// Refresh Tokens - 对齐 Next.js 数据库结构
// ============================================================================

export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id').primaryKey().notNull(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

// ============================================================================
// Type Definitions
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

// User schemas
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100),
  phone: z.string().max(50).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
});

export const selectUserSchema = createSelectSchema(users);

export const publicUserSchema = selectUserSchema.omit({
  password: true,
});

export type PublicUser = z.infer<typeof publicUserSchema>;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(50).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// User update schema
export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  username: z.string().min(3).max(100).optional(),
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(50).optional(),
  avatar: z.string().url().optional().nullable(),
  department: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
  bio: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

// Role schemas
export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  label: z.string().max(100).optional(),
  description: z.string().optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

// Permission schemas
export const createPermissionSchema = z.object({
  action: z.string().min(1).max(100),
  resource: z.string().min(1).max(100),
  description: z.string().optional(),
});

// Team schemas
export const createTeamSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().optional(),
  avatar: z.string().url().optional(),
});

export const updateTeamSchema = createTeamSchema.partial();

// Document schemas
export const createDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().optional(),
  folder: z.string().max(255).optional(),
  type: z.string().max(50).optional(),
  teamId: z.string().uuid().optional(),
});

export const updateDocumentSchema = createDocumentSchema.partial();

// Folder schemas
export const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().optional().nullable(),
  teamId: z.string().uuid().optional(),
});

export const updateFolderSchema = createFolderSchema.partial();

// File schemas
export const createFileSchema = z.object({
  name: z.string().min(1).max(255),
  path: z.string().max(1000).optional(),
  mimeType: z.string().max(150).optional(),
  size: z.number().int().optional(),
  folderId: z.string().uuid().optional().nullable(),
  teamId: z.string().uuid().optional(),
});

// Calendar event schemas
export const createEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  type: z.enum(['meeting', 'task', 'reminder', 'holiday']).optional(),
  color: z.string().max(20).optional(),
  allDay: z.boolean().optional(),
  location: z.string().max(255).optional(),
  teamId: z.string().uuid().optional(),
  attendeeIds: z.array(z.string().uuid()).optional(),
});

export const updateEventSchema = createEventSchema.partial();

// Conversation schemas
export const createConversationSchema = z.object({
  name: z.string().max(200).optional(),
  isGroup: z.boolean().optional(),
  participantIds: z.array(z.string().uuid()).min(1),
  teamId: z.string().uuid().optional(),
});

// Message schemas
export const createMessageSchema = z.object({
  conversationId: z.string().uuid(),
  type: z.enum(['text', 'image', 'file', 'system']).optional(),
  content: z.string().min(1),
});

// Notification schemas
export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['system', 'user', 'message', 'task', 'alert']).optional(),
  title: z.string().min(1).max(255),
  content: z.string().optional(),
  link: z.string().max(500).optional(),
  payload: z.record(z.unknown()).optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});
