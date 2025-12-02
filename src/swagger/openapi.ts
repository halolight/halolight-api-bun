import { env } from '../utils/env';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  updateUserSchema,
  createRoleSchema,
  createTeamSchema,
  createDocumentSchema,
} from '../db/schema';
import { zodToJsonSchema } from './zod-to-json';

/**
 * Generate OpenAPI specification dynamically
 */
export function generateOpenApiSpec() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'HaloLight API',
      description: `HaloLight 后台管理系统 API - 基于 Bun + Hono + Drizzle ORM 构建

## 认证方式
使用 JWT Bearer Token 认证。登录后获取 \`accessToken\`，在请求头中添加：
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

## 双令牌机制
- **AccessToken**: 短期令牌（${env.JWT_EXPIRES_IN}），用于 API 认证
- **RefreshToken**: 长期令牌（${env.JWT_REFRESH_EXPIRES_IN}），用于刷新 AccessToken

## 环境信息
- **环境**: ${env.NODE_ENV}
- **API 前缀**: ${env.API_PREFIX}
`,
      version: '1.0.0',
      contact: {
        name: 'HaloLight Team',
        url: 'https://github.com/halolight/halolight-api-bun',
        email: 'support@halolight.h7ml.cn',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Local Development',
      },
      {
        url: 'https://halolight-api-bun.h7ml.cn',
        description: 'Production Server',
      },
      {
        url: 'https://halolight-api-bun-staging.h7ml.cn',
        description: 'Staging Server',
      },
    ],
    tags: [
      { name: 'Health', description: '健康检查接口' },
      { name: 'Auth', description: '认证相关接口（登录、注册、刷新令牌）' },
      { name: 'Users', description: '用户管理接口（CRUD、分页、搜索）' },
      { name: 'Roles', description: '角色管理接口（CRUD、权限分配）' },
      { name: 'Permissions', description: '权限管理接口' },
      { name: 'Teams', description: '团队管理接口（CRUD、成员管理）' },
      { name: 'Documents', description: '文档管理接口（CRUD、分享、标签）' },
      { name: 'Notifications', description: '通知管理接口（列表、已读标记）' },
      { name: 'Dashboard', description: '仪表盘统计接口' },
    ],
    paths: {
      // Health
      [`${env.API_PREFIX}/health`]: {
        get: {
          tags: ['Health'],
          summary: '健康检查',
          description: '检查 API 服务状态',
          operationId: 'healthCheck',
          responses: {
            200: {
              description: '服务正常',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthResponse' },
                  example: {
                    success: true,
                    data: {
                      status: 'healthy',
                      timestamp: '2024-01-01T00:00:00.000Z',
                      uptime: 3600,
                      version: '1.0.0',
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Auth - Login
      [`${env.API_PREFIX}/auth/login`]: {
        post: {
          tags: ['Auth'],
          summary: '用户登录',
          description: '使用邮箱和密码登录，返回 JWT 双令牌',
          operationId: 'login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: zodToJsonSchema(loginSchema),
                example: {
                  email: 'admin@halolight.h7ml.cn',
                  password: '123456',
                },
              },
            },
          },
          responses: {
            200: {
              description: '登录成功',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            401: {
              description: '认证失败',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },

      // Auth - Register
      [`${env.API_PREFIX}/auth/register`]: {
        post: {
          tags: ['Auth'],
          summary: '用户注册',
          description: '注册新用户账号',
          operationId: 'register',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: zodToJsonSchema(registerSchema),
              },
            },
          },
          responses: {
            201: {
              description: '注册成功',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            409: {
              description: '邮箱或用户名已存在',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },

      // Auth - Refresh
      [`${env.API_PREFIX}/auth/refresh`]: {
        post: {
          tags: ['Auth'],
          summary: '刷新令牌',
          description: '使用 RefreshToken 获取新的 AccessToken',
          operationId: 'refreshToken',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: zodToJsonSchema(refreshTokenSchema),
              },
            },
          },
          responses: {
            200: {
              description: '刷新成功',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/TokenResponse' },
                },
              },
            },
            401: {
              description: 'Token 无效或已过期',
            },
          },
        },
      },

      // Auth - Me
      [`${env.API_PREFIX}/auth/me`]: {
        get: {
          tags: ['Auth'],
          summary: '获取当前用户',
          description: '获取当前登录用户的详细信息（包含角色和权限）',
          operationId: 'getCurrentUser',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: '成功',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UserWithRolesResponse' },
                },
              },
            },
            401: { description: '未认证' },
          },
        },
      },

      // Auth - Logout
      [`${env.API_PREFIX}/auth/logout`]: {
        post: {
          tags: ['Auth'],
          summary: '用户登出',
          description: '登出当前用户，使 RefreshToken 失效',
          operationId: 'logout',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: '登出成功' },
          },
        },
      },

      // Users
      [`${env.API_PREFIX}/users`]: {
        get: {
          tags: ['Users'],
          summary: '获取用户列表',
          description: '获取用户列表，支持分页、搜索和状态过滤',
          operationId: 'getUsers',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: '页码' },
            {
              name: 'pageSize',
              in: 'query',
              schema: { type: 'integer', default: 20, maximum: 100 },
              description: '每页数量',
            },
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
              description: '搜索关键词（姓名、邮箱、用户名）',
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string', enum: ['all', 'active', 'inactive', 'suspended'] },
              description: '用户状态过滤',
            },
          ],
          responses: {
            200: {
              description: '成功',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PaginatedUsersResponse' },
                },
              },
            },
          },
        },
        post: {
          tags: ['Users'],
          summary: '创建用户',
          description: '创建新用户（管理员功能）',
          operationId: 'createUser',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateUserRequest' },
              },
            },
          },
          responses: {
            201: { description: '创建成功' },
            409: { description: '邮箱或用户名已存在' },
          },
        },
      },

      [`${env.API_PREFIX}/users/{id}`]: {
        get: {
          tags: ['Users'],
          summary: '获取用户详情',
          operationId: 'getUserById',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: '成功' },
            404: { description: '用户不存在' },
          },
        },
        patch: {
          tags: ['Users'],
          summary: '更新用户',
          operationId: 'updateUser',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: zodToJsonSchema(updateUserSchema),
              },
            },
          },
          responses: {
            200: { description: '更新成功' },
          },
        },
        delete: {
          tags: ['Users'],
          summary: '删除用户',
          operationId: 'deleteUser',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: '删除成功' },
          },
        },
      },

      // Roles
      [`${env.API_PREFIX}/roles`]: {
        get: {
          tags: ['Roles'],
          summary: '获取角色列表',
          operationId: 'getRoles',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '成功' } },
        },
        post: {
          tags: ['Roles'],
          summary: '创建角色',
          operationId: 'createRole',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: zodToJsonSchema(createRoleSchema),
              },
            },
          },
          responses: { 201: { description: '创建成功' } },
        },
      },

      [`${env.API_PREFIX}/roles/{id}`]: {
        get: {
          tags: ['Roles'],
          summary: '获取角色详情',
          operationId: 'getRoleById',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: '成功' } },
        },
        patch: {
          tags: ['Roles'],
          summary: '更新角色',
          operationId: 'updateRole',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: '更新成功' } },
        },
        delete: {
          tags: ['Roles'],
          summary: '删除角色',
          operationId: 'deleteRole',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: '删除成功' } },
        },
      },

      [`${env.API_PREFIX}/roles/{id}/permissions`]: {
        post: {
          tags: ['Roles'],
          summary: '分配权限给角色',
          operationId: 'assignPermissions',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['permissionIds'],
                  properties: {
                    permissionIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
                  },
                },
              },
            },
          },
          responses: { 200: { description: '分配成功' } },
        },
      },

      // Permissions
      [`${env.API_PREFIX}/permissions`]: {
        get: {
          tags: ['Permissions'],
          summary: '获取权限列表',
          operationId: 'getPermissions',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '成功' } },
        },
      },

      // Teams
      [`${env.API_PREFIX}/teams`]: {
        get: {
          tags: ['Teams'],
          summary: '获取团队列表',
          operationId: 'getTeams',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: '成功' } },
        },
        post: {
          tags: ['Teams'],
          summary: '创建团队',
          operationId: 'createTeam',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: zodToJsonSchema(createTeamSchema),
              },
            },
          },
          responses: { 201: { description: '创建成功' } },
        },
      },

      [`${env.API_PREFIX}/teams/{id}`]: {
        get: {
          tags: ['Teams'],
          summary: '获取团队详情',
          operationId: 'getTeamById',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: '成功' } },
        },
        patch: {
          tags: ['Teams'],
          summary: '更新团队',
          operationId: 'updateTeam',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: '更新成功' } },
        },
        delete: {
          tags: ['Teams'],
          summary: '删除团队',
          operationId: 'deleteTeam',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: '删除成功' } },
        },
      },

      [`${env.API_PREFIX}/teams/{id}/members`]: {
        post: {
          tags: ['Teams'],
          summary: '添加团队成员',
          operationId: 'addTeamMember',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['userId'],
                  properties: {
                    userId: { type: 'string', format: 'uuid' },
                    role: { type: 'string', default: 'member' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: '添加成功' } },
        },
      },

      [`${env.API_PREFIX}/teams/{id}/members/{userId}`]: {
        delete: {
          tags: ['Teams'],
          summary: '移除团队成员',
          operationId: 'removeTeamMember',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: '移除成功' } },
        },
      },

      // Documents
      [`${env.API_PREFIX}/documents`]: {
        get: {
          tags: ['Documents'],
          summary: '获取文档列表',
          operationId: 'getDocuments',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: '成功' } },
        },
        post: {
          tags: ['Documents'],
          summary: '创建文档',
          operationId: 'createDocument',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: zodToJsonSchema(createDocumentSchema),
              },
            },
          },
          responses: { 201: { description: '创建成功' } },
        },
      },

      [`${env.API_PREFIX}/documents/{id}`]: {
        get: {
          tags: ['Documents'],
          summary: '获取文档详情',
          operationId: 'getDocumentById',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: '成功' } },
        },
        put: {
          tags: ['Documents'],
          summary: '更新文档',
          operationId: 'updateDocument',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: '更新成功' } },
        },
        delete: {
          tags: ['Documents'],
          summary: '删除文档',
          operationId: 'deleteDocument',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: '删除成功' } },
        },
      },

      // Notifications
      [`${env.API_PREFIX}/notifications`]: {
        get: {
          tags: ['Notifications'],
          summary: '获取通知列表',
          operationId: 'getNotifications',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '成功' } },
        },
      },

      [`${env.API_PREFIX}/notifications/unread-count`]: {
        get: {
          tags: ['Notifications'],
          summary: '获取未读通知数量',
          operationId: 'getUnreadCount',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '成功' } },
        },
      },

      [`${env.API_PREFIX}/notifications/{id}/read`]: {
        put: {
          tags: ['Notifications'],
          summary: '标记通知为已读',
          operationId: 'markAsRead',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: '成功' } },
        },
      },

      [`${env.API_PREFIX}/notifications/read-all`]: {
        put: {
          tags: ['Notifications'],
          summary: '标记所有通知为已读',
          operationId: 'markAllAsRead',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '成功' } },
        },
      },

      // Dashboard
      [`${env.API_PREFIX}/dashboard/stats`]: {
        get: {
          tags: ['Dashboard'],
          summary: '获取统计数据',
          operationId: 'getDashboardStats',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '成功' } },
        },
      },

      [`${env.API_PREFIX}/dashboard/visits`]: {
        get: {
          tags: ['Dashboard'],
          summary: '获取访问趋势（7天）',
          operationId: 'getVisitTrends',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '成功' } },
        },
      },

      [`${env.API_PREFIX}/dashboard/sales`]: {
        get: {
          tags: ['Dashboard'],
          summary: '获取销售趋势（6个月）',
          operationId: 'getSalesTrends',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '成功' } },
        },
      },

      [`${env.API_PREFIX}/dashboard/activities`]: {
        get: {
          tags: ['Dashboard'],
          summary: '获取最近活动',
          operationId: 'getRecentActivities',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '成功' } },
        },
      },

      [`${env.API_PREFIX}/dashboard/pie`]: {
        get: {
          tags: ['Dashboard'],
          summary: '获取饼图数据',
          operationId: 'getPieChartData',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '成功' } },
        },
      },

      [`${env.API_PREFIX}/dashboard/tasks`]: {
        get: {
          tags: ['Dashboard'],
          summary: '获取任务列表',
          operationId: 'getTaskList',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '成功' } },
        },
      },

      [`${env.API_PREFIX}/dashboard/overview`]: {
        get: {
          tags: ['Dashboard'],
          summary: '获取系统概览',
          operationId: 'getSystemOverview',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: '成功' } },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
        },
      },
      schemas: {
        HealthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'healthy' },
                timestamp: { type: 'string', format: 'date-time' },
                uptime: { type: 'number' },
                version: { type: 'string' },
              },
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                user: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
        TokenResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            username: { type: 'string' },
            name: { type: 'string' },
            phone: { type: 'string' },
            avatar: { type: 'string' },
            department: { type: 'string' },
            position: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
            isVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        UserWithRolesResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              allOf: [
                { $ref: '#/components/schemas/User' },
                {
                  type: 'object',
                  properties: {
                    roles: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          permissions: { type: 'array', items: { type: 'string' } },
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        PaginatedUsersResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                pageSize: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
        CreateUserRequest: {
          type: 'object',
          required: ['email', 'username', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            username: { type: 'string', minLength: 3 },
            password: { type: 'string', minLength: 8 },
            name: { type: 'string' },
            phone: { type: 'string' },
            avatar: { type: 'string' },
            department: { type: 'string' },
            position: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'object' },
              },
            },
          },
        },
      },
    },
  };
}
