import { pgTable, uuid, varchar, timestamp, text, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Users table schema
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  password: text('password').notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  avatar: text('avatar'),
  isActive: boolean('is_active').notNull().default(true),
  isVerified: boolean('is_verified').notNull().default(false),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Type definitions
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

/**
 * Zod schemas for validation
 */
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.enum(['user', 'admin', 'moderator']).default('user'),
});

export const selectUserSchema = createSelectSchema(users);

/**
 * Public user schema (without sensitive fields)
 */
export const publicUserSchema = selectUserSchema.omit({
  password: true,
});

export type PublicUser = z.infer<typeof publicUserSchema>;

/**
 * Auth schemas
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
});

/**
 * User update schema (partial)
 */
export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  username: z.string().min(3).max(100).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  role: z.enum(['user', 'admin', 'moderator']).optional(),
});
