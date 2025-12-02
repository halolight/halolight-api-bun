# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

HaloLight API Bun 是基于 Bun + Hono + Drizzle ORM 构建的高性能后端 API，与 NestJS/Java 版本共用同一数据库（PostgreSQL/Neon）和接口规范，为 HaloLight 多框架管理后台生态系统提供 50+ RESTful 端点，覆盖 9 个核心业务模块。

## 技术栈速览

- **运行时**: Bun 1.1+ (比 Node.js 快 4 倍)
- **框架**: Hono 4.x (轻量级、高性能 Web 框架)
- **ORM**: Drizzle ORM 0.36+ (TypeScript-first SQL ORM)
- **数据库**: PostgreSQL 15+
- **认证**: JWT 双令牌机制 (AccessToken + RefreshToken)
- **权限**: RBAC 角色权限控制
- **文档**: Swagger/OpenAPI 动态生成
- **验证**: Zod 3.x
- **构建工具**: pnpm、ESLint 9 + Prettier

## 常用命令

```bash
# 开发
bun run dev                 # 启动开发服务器（热重载，http://localhost:3002）
bun run build               # 生产构建，输出到 dist/
bun run start               # 运行生产构建

# 代码质量
bun run lint                # ESLint 检查
bun run lint:fix            # ESLint 自动修复
bun run type-check          # TypeScript 类型检查（不输出文件）
bun run format              # Prettier 格式化

# 测试
bun test                    # 运行单元测试
bun test --watch            # 监视模式
bun test --coverage         # 生成覆盖率报告

# 数据库 (Drizzle)
bun run db:generate         # 生成 Drizzle 迁移文件
bun run db:migrate          # 运行数据库迁移
bun run db:push             # 推送 schema 到数据库（跳过迁移文件）
bun run db:studio           # 打开 Drizzle Studio 数据库 GUI
bun run db:seed             # 填充测试数据
```

## 架构

### 模块结构

项目采用分层架构：

```
src/
├── db/
│   ├── schema.ts           # Drizzle ORM schema 定义（17 个实体）
│   ├── index.ts            # 数据库连接池
│   ├── migrate.ts          # 迁移脚本
│   └── seed.ts             # 种子数据脚本
├── middleware/
│   ├── auth.ts             # JWT 认证中间件
│   ├── cors.ts             # CORS 配置
│   ├── error.ts            # 全局错误处理
│   └── logger.ts           # 请求日志中间件
├── routes/                 # 路由层（Controller）
│   ├── auth.ts             # 认证端点（登录、注册、刷新令牌、登出）
│   ├── users.ts            # 用户管理（CRUD、分页、搜索）
│   ├── roles.ts            # 角色管理（CRUD + 权限分配）
│   ├── permissions.ts      # 权限管理
│   ├── teams.ts            # 团队管理
│   ├── documents.ts        # 文档管理
│   ├── notifications.ts    # 通知管理
│   ├── dashboard.ts        # 仪表盘统计
│   └── index.ts            # 路由汇总
├── services/               # 业务逻辑层
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── role.service.ts
│   ├── permission.service.ts
│   ├── team.service.ts
│   ├── document.service.ts
│   ├── notification.service.ts
│   └── dashboard.service.ts
├── swagger/                # Swagger 文档
│   ├── openapi.ts          # OpenAPI 规范动态生成
│   ├── zod-to-json.ts      # Zod Schema 转 JSON Schema
│   └── index.ts            # Swagger UI 路由
├── pages/
│   └── home.ts             # 首页 HTML 模板
├── utils/                  # 工具函数
│   ├── env.ts              # 环境变量验证（Zod）
│   ├── jwt.ts              # JWT 签名/验证
│   ├── hash.ts             # 密码哈希（Bun.password）
│   └── response.ts         # 统一响应格式
└── index.ts                # 应用入口
```

### 核心设计模式

**认证流程:**
- JWT 认证通过 `authMiddleware` 中间件实现
- 公开端点在路由定义时不应用认证中间件
- 双令牌策略：AccessToken（15分钟）+ RefreshToken（7天）
- RefreshToken 存储于数据库 `refresh_tokens` 表

**数据库访问:**
- 所有模块通过 Drizzle ORM 进行数据库操作
- Schema 定义在 `src/db/schema.ts`，包含 17 个数据模型
- 主键使用 UUID，配置了适当的级联删除

**API 结构:**
- 全局前缀：`/api`（可通过 `API_PREFIX` 环境变量配置）
- Swagger UI：`/swagger`（可通过 `SWAGGER_PATH` 环境变量配置）
- 首页：`/`（漂亮的 HTML 页面）
- API 信息：`/info`（JSON 格式）
- 文档重定向：`/docs` → `/swagger`

### 数据流模式

1. **请求处理**: Route Handler → Service → Drizzle ORM → Database
2. **认证拦截**: authMiddleware → JWT 验证 → 用户注入到 Context
3. **异常处理**: errorHandler 中间件统一捕获并格式化错误响应
4. **数据验证**: Zod schema + @hono/zod-validator 自动验证请求数据

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 数据库连接字符串 | - |
| `JWT_SECRET` | JWT 签名密钥（≥32字符） | - |
| `JWT_REFRESH_SECRET` | RefreshToken 密钥（可选） | - |
| `PORT` | 服务端口 | `3002` |
| `NODE_ENV` | 运行环境 | `development` |
| `CORS_ORIGIN` | CORS 允许源（逗号分隔） | `http://localhost:3000` |
| `API_PREFIX` | API 路由前缀 | `/api` |
| `JWT_EXPIRES_IN` | AccessToken 过期时间 | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | RefreshToken 过期时间 | `7d` |
| `SWAGGER_ENABLED` | 是否启用 Swagger | `true` |
| `SWAGGER_PATH` | Swagger UI 路径 | `/swagger` |

## 代码规范

- ESLint 配置：TypeScript 严格规则 + Prettier 集成
- 未使用变量：前缀 `_` 可抑制错误（`@typescript-eslint/no-unused-vars`）
- 提交规范：遵循 Conventional Commits（`feat:`、`fix:`、`docs:` 等）
- 使用相对路径导入模块

## CI/CD

GitHub Actions 工作流 (`.github/workflows/ci.yml`) 包含：

- **lint**: ESLint + TypeScript 类型检查
- **test**: 单元测试 + 覆盖率报告
- **e2e**: E2E 测试（PostgreSQL 服务）
- **build**: Bun 生产构建
- **security**: 依赖安全审计

## API 模块

项目覆盖 9 个核心业务模块，与 NestJS/Java 版本保持接口一致：

| 模块 | 端点 | 描述 |
|------|------|------|
| **Auth** | `/api/auth/*` | 登录、注册、刷新令牌、获取当前用户、登出 |
| **Users** | `/api/users/*` | 用户 CRUD、分页、搜索、状态过滤 |
| **Roles** | `/api/roles/*` | 角色 CRUD、权限分配 |
| **Permissions** | `/api/permissions/*` | 权限管理 |
| **Teams** | `/api/teams/*` | 团队 CRUD、成员管理 |
| **Documents** | `/api/documents/*` | 文档 CRUD |
| **Notifications** | `/api/notifications/*` | 通知管理、已读标记 |
| **Dashboard** | `/api/dashboard/*` | 仪表盘统计、图表数据 |

## 新增功能开发指南

### 添加新实体

1. 在 `src/db/schema.ts` 添加 Drizzle 表定义
2. 运行 `bun run db:push` 推送到数据库
3. 创建对应的 Zod schema 用于验证

### 添加新 API 端点

1. 在 `src/services/` 创建 Service 类
2. 在 `src/routes/` 创建路由文件
3. 在 `src/routes/index.ts` 注册路由
4. 在 `src/swagger/openapi.ts` 添加 OpenAPI 文档

### 示例：添加新路由

```typescript
// src/routes/posts.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth';
import { PostService } from '../services/post.service';
import { createPostSchema } from '../db/schema';
import { successResponse } from '../utils/response';

export const postRoutes = new Hono();
const postService = new PostService();

// 需要认证的路由
postRoutes.use('/*', authMiddleware);

postRoutes.get('/', async (c) => {
  const posts = await postService.findAll();
  return successResponse(c, posts);
});

postRoutes.post('/', zValidator('json', createPostSchema), async (c) => {
  const data = c.req.valid('json');
  const user = c.get('user');
  const post = await postService.create({ ...data, authorId: user.id });
  return successResponse(c, post, 201);
});
```

## Bun 特有功能

使用 Bun 内置 API 提升性能：

```typescript
// 密码哈希（比 bcrypt 包更快）
const hash = await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 });
const isValid = await Bun.password.verify(password, hash, 'bcrypt');

// 文件操作
const file = Bun.file('./path/to/file');
const content = await file.text();

// 快速哈希
const hash = Bun.hash(data);
```

## 与前端集成

配置前端 API 地址：

```env
# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3002/api

# Vue/Vite
VITE_API_URL=http://localhost:3002/api

# Angular
API_URL=http://localhost:3002/api
```

## 性能优势

| 指标 | Bun | Node.js | 提升 |
|------|-----|---------|------|
| 启动速度 | ~100ms | ~500ms | **4x** |
| HTTP 吞吐量 | ~50,000 req/s | ~20,000 req/s | **2.5x** |
| 内存占用 | ~30MB | ~50MB+ | **40%** |
