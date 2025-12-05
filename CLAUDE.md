# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是 HaloLight 后台管理系统的 **高性能后端 API 实现**，基于 Bun + Hono + Drizzle ORM 构建，提供完整的认证、用户管理和数据库集成。

### 技术栈特点

| 组件 | 版本 | 说明 |
|------|------|------|
| Bun | 1.1+ | 快速的 JavaScript/TypeScript 运行时（2-4x 比 Node.js 快） |
| Hono | 4.x | 轻量级、高性能的 Web 框架 |
| Drizzle ORM | 0.36+ | TypeScript-first SQL ORM，类型安全 |
| PostgreSQL | 15+ | 生产级关系数据库 |
| Zod | 3.x | Schema 验证库 |

## 前置要求

- **Bun**: >= 1.1.0
- **PostgreSQL**: 15+
- **Docker**: (可选)
- **Git**: 版本控制

## 常用命令

```bash
# 开发
bun run dev            # 启动开发服务器（热重载）
bun run build          # 构建生产版本
bun run start          # 启动生产服务器

# 数据库
bun run db:generate    # 生成 Drizzle schema 迁移
bun run db:migrate     # 运行数据库迁移
bun run db:push        # 推送 schema 到数据库（无迁移文件）
bun run db:studio      # 打开 Drizzle Studio（数据库 GUI）
bun run db:seed        # 运行种子数据

# 代码质量
bun run lint           # ESLint 检查
bun run format         # Prettier 格式化
bun test               # 运行单元测试

# Docker
make docker-build      # 构建镜像
make docker-up         # 启动容器
make docker-down       # 停止容器
make docker-logs       # 查看日志
```

## 项目结构

```
halolight-api-bun/
├── src/
│   ├── db/
│   │   ├── schema.ts          # Drizzle ORM schema 定义
│   │   ├── index.ts           # 数据库连接池
│   │   ├── migrate.ts         # 迁移脚本
│   │   └── seed.ts            # 种子数据脚本
│   ├── middleware/
│   │   ├── auth.ts            # JWT 认证中间件
│   │   ├── cors.ts            # CORS 配置
│   │   ├── error.ts           # 全局错误处理
│   │   └── logger.ts          # 请求日志中间件
│   ├── routes/
│   │   ├── auth.ts            # 认证端点（登录/注册）
│   │   ├── users.ts           # 用户管理端点
│   │   └── index.ts           # 路由汇总
│   ├── services/
│   │   ├── auth.service.ts    # 认证业务逻辑
│   │   └── user.service.ts    # 用户业务逻辑
│   ├── utils/
│   │   ├── env.ts             # 环境变量验证
│   │   ├── jwt.ts             # JWT 签名/验证
│   │   ├── hash.ts            # 密码哈希（Bun 内置）
│   │   └── response.ts        # 统一响应格式
│   └── index.ts               # 应用入口
├── drizzle/                    # 迁移文件（自动生成，不提交）
├── dist/                       # 构建产物（自动生成，不提交）
├── .env.example                # 环境变量示例
├── .gitignore
├── Dockerfile                  # 多阶段 Docker 构建
├── docker-compose.yml          # Docker Compose 配置
├── drizzle.config.ts           # Drizzle Kit 配置
├── Makefile                    # Make 命令速查表
├── package.json
├── tsconfig.json
└── README.md
```

## 运行时约束

### Node.js 兼容性

Bun 提供对 Node.js API 的广泛支持，但存在部分限制：

**完全支持**：
- `Buffer` - 二进制数据处理
- `process.env` - 环境变量读取
- `crypto` - Web Crypto API (推荐)、部分 Node.js crypto API

**不支持的 API**：
- `fs.watch()` - 文件系统监听（可使用 `Bun.watch()`）
- `child_process` - 子进程
- `net`、`dgram` - 原生网络套接字

**特有功能**：
- `Bun.password` - 内置密码哈希（bcrypt）
- `Bun.hash()` - 快速哈希函数
- `Bun.file()` - 文件 API

## 环境变量

| 变量名 | 说明 | 默认值 | 必需 | 环境 |
|--------|------|--------|------|------|
| `NODE_ENV` | 应用环境 | `development` | ❌ | 所有 |
| `PORT` | 服务端口 | `3002` | ❌ | 所有 |
| `DATABASE_URL` | PostgreSQL 连接 URL | - | ✅ | 所有 |
| `JWT_SECRET` | JWT 签名密钥（最少 32 字符） | - | ✅ | 所有 |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `7d` | ❌ | 所有 |
| `CORS_ORIGIN` | CORS 允许的源（逗号分隔） | `http://localhost:3000` | ❌ | 所有 |
| `API_PREFIX` | API 路由前缀 | `/api` | ❌ | 所有 |

### 本地开发

创建 `.env` 文件（基于 `.env.example`，不提交到 git）：

```bash
NODE_ENV=development
PORT=3002
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/halolight
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
API_PREFIX=/api
```

## 数据库架构

### Users Table

```typescript
users {
  id: UUID (PK)                // 主键
  email: VARCHAR(255) UNIQUE   // 邮箱（唯一）
  username: VARCHAR(100) UNIQUE // 用户名（唯一）
  password: TEXT               // bcrypt 密码哈希
  firstName: VARCHAR(100)      // 名字
  lastName: VARCHAR(100)       // 姓氏
  avatar: TEXT                 // 头像 URL
  isActive: BOOLEAN            // 是否激活
  isVerified: BOOLEAN          // 邮箱是否验证
  role: VARCHAR(50)            // 角色 (user|admin|moderator)
  lastLoginAt: TIMESTAMP       // 最后登录时间
  createdAt: TIMESTAMP         // 创建时间
  updatedAt: TIMESTAMP         // 更新时间
}
```

### Schema 修改流程

1. 编辑 `src/db/schema.ts`
2. 生成迁移：`bun run db:generate`
3. 审查生成的 SQL（`drizzle/` 目录）
4. 运行迁移：`bun run db:migrate`

或直接推送（跳过迁移文件）：
```bash
bun run db:push
```

## 认证流程

### JWT 工作流

1. **用户注册** → POST `/api/auth/register`
   - 验证输入（Zod）
   - 密码使用 `Bun.password.hash()` 加密
   - 保存到数据库

2. **用户登录** → POST `/api/auth/login`
   - 验证凭据
   - 生成 JWT token（包含 userId、email、role）
   - 返回 token

3. **认证请求**
   - 客户端在 header 添加 `Authorization: Bearer <token>`
   - `authMiddleware` 验证 token
   - 从 token 提取用户信息注入到 Hono context

4. **业务逻辑访问用户**
   ```typescript
   export async function GET(c: Context) {
     const user = c.get('user');  // 从中间件注入
     // ...
   }
   ```

## 开发指南

### 添加新的 API 端点

**第 1 步**：定义 Schema (`src/db/schema.ts`)
```typescript
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  userId: uuid('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertPostSchema = createInsertSchema(posts);
export type InsertPost = z.infer<typeof insertPostSchema>;
```

**第 2 步**：创建 Service (`src/services/post.service.ts`)
```typescript
export class PostService {
  async findAll() {
    return await db.select().from(posts);
  }

  async create(data: InsertPost) {
    return await db.insert(posts).values(data).returning();
  }
}
```

**第 3 步**：添加 Route (`src/routes/posts.ts`)
```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

export const postRoutes = new Hono();
const postService = new PostService();

postRoutes.get('/', async (c) => {
  const data = await postService.findAll();
  return c.json(success(data));
});

postRoutes.post('/', zValidator('json', insertPostSchema), async (c) => {
  const data = await c.req.valid('json');
  const result = await postService.create(data);
  return c.json(success(result), 201);
});
```

**第 4 步**：注册路由 (`src/routes/index.ts`)
```typescript
apiRoutes.route('/posts', postRoutes);
```

### 密码安全

使用 Bun 内置的密码哈希：

```typescript
// 创建密码哈希
const hash = await Bun.password.hash(plainPassword, {
  algorithm: "bcrypt",
  cost: 10,
});

// 验证密码
const isValid = await Bun.password.verify(plainPassword, hash, "bcrypt");
```

## API 端点示例

### 用户注册

```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "securepass123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 用户登录

```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123"
  }'
```

### 获取用户列表（需认证）

```bash
curl -X GET "http://localhost:3002/api/users?page=1&pageSize=20" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## 性能优化

### Bun 的优势

- **快速启动**: 比 Node.js 快 4x（~100ms vs ~500ms）
- **内存效率**: 通常占用 30MB vs Node.js 的 50MB+
- **HTTP 性能**: ~50,000 req/s vs Node.js ~20,000 req/s
- **依赖安装**: `bun install` 比 `npm install` 快 20-30x

### 推荐实践

- ✅ 启用连接池（`postgres` 库自动处理）
- ✅ 使用 Drizzle 查询优化
- ✅ 在关键路径缓存数据
- ✅ 使用分页避免大批量查询
- ⚠️ 生产环境配置反向代理（Nginx）
- ⚠️ 启用 HTTPS/TLS

## 部署

### Docker 部署

```bash
# 构建镜像
docker build -t halolight-api-bun .

# 运行容器
docker run -d \
  -p 3002:3002 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/halolight \
  -e JWT_SECRET=your-secret-key \
  halolight-api-bun
```

### Docker Compose

```bash
# 启动完整栈（API + PostgreSQL）
docker-compose up -d

# 查看日志
docker-compose logs -f api

# 停止服务
docker-compose down
```

### 云平台

支持部署到：
- **Fly.io** - `fly launch`
- **Railway** - Docker + GitHub 自动部署
- **Render** - 拖拽部署
- **自托管** - Systemd 服务

## 测试

```bash
# 运行测试
bun test

# Watch 模式
bun test --watch

# 生成覆盖率报告
bun test --coverage
```

## 故障排查

### 无法连接数据库

```bash
# 检查 PostgreSQL 运行状态
docker-compose ps

# 查看数据库日志
docker-compose logs db

# 测试连接
psql postgresql://postgres:postgres@localhost:5432/halolight
```

### JWT token 无效

- 确认 `JWT_SECRET` 配置正确（最少 32 字符）
- 检查 token 格式：`Authorization: Bearer <token>`
- 验证 token 是否过期

### Drizzle 迁移失败

```bash
# 删除旧迁移文件
rm -rf drizzle/

# 重新生成
bun run db:generate

# 或直接推送
bun run db:push
```

## 安全最佳实践

- ✅ 密码使用 Bun 内置 bcrypt 哈希（cost=10）
- ✅ JWT 签名验证（HS256）
- ✅ Zod 输入验证
- ✅ SQL 注入防护（Drizzle 参数化查询）
- ✅ CORS 中间件配置
- ⚠️ 生产环境修改 `JWT_SECRET`（32+ 字符强密钥）
- ⚠️ 启用 HTTPS
- ⚠️ 定期更新依赖

## 相关资源

- [HaloLight 文档](https://halolight.docs.h7ml.cn)
- [Bun 官方文档](https://bun.sh/docs)
- [Hono 框架文档](https://hono.dev/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)

## 贡献指南

1. Fork 仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. Commit 更改 (`git commit -m 'Add amazing feature'`)
4. Push 到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

[MIT](LICENSE)

---

Made with ❤️ by HaloLight Team
