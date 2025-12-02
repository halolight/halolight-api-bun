# HaloLight API Bun

[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Bun](https://img.shields.io/badge/Bun-1.1+-F472B6.svg?logo=bun)](https://bun.sh/)
[![Hono](https://img.shields.io/badge/Hono-4.x-E36002.svg)](https://hono.dev/)
[![Drizzle](https://img.shields.io/badge/Drizzle-0.36+-C5F74F.svg)](https://orm.drizzle.team/)

HaloLight 后台管理系统的 **Bun + Hono + Drizzle 高性能后端 API 服务**。

- API 文档: <https://api-bun.halolight.h7ml.cn>
- GitHub: <https://github.com/halolight/halolight-api-bun>

## 特性

- **Bun Runtime** - 极快的 JavaScript 运行时（比 Node.js 快 2-4x）
- **Hono Framework** - 轻量级、高性能的 Web 框架
- **Drizzle ORM** - TypeScript-first 的 SQL ORM
- **JWT 认证** - 基于令牌的身份验证
- **PostgreSQL** - 生产级数据库
- **Zod 验证** - 类型安全的输入验证
- **Docker 支持** - 容器化部署
- **完善的错误处理** - 统一的错误响应格式
- **分层架构** - Service/Repository 模式

## 技术栈

- **Bun** 1.1+ - JavaScript/TypeScript 运行时
- **Hono** 4.x - Web 框架
- **Drizzle ORM** 0.36+ - SQL ORM
- **PostgreSQL** 15+ - 数据库
- **Zod** - Schema 验证
- **@hono/zod-validator** - Hono Zod 集成

## 性能对比

| 运行时 | 请求/秒 | 启动时间 | 内存占用 |
|--------|---------|----------|----------|
| Bun | ~50,000 | ~100ms | ~30MB |
| Node.js | ~20,000 | ~500ms | ~50MB |
| Deno | ~25,000 | ~300ms | ~45MB |

> 基准测试基于简单的 "Hello World" 端点，实际性能取决于应用复杂度。

## 快速开始

### 前置要求

- **Bun** 1.1 或更高版本
- **PostgreSQL** 15+
- **Docker** (可选)

### 安装

```bash
# 克隆仓库
git clone https://github.com/halolight/halolight-api-bun.git
cd halolight-api-bun

# 安装依赖
bun install

# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件，配置数据库连接等信息
# vim .env

# 生成 Drizzle schema
bun run db:generate

# 运行数据库迁移
bun run db:migrate

# 种子数据（可选）
bun run db:seed

# 启动开发服务器
bun run dev
```

服务器将在 `http://localhost:3002` 启动。

### 使用 Docker

```bash
# 启动所有服务（API + PostgreSQL）
docker-compose up -d

# 或使用 Makefile
make docker-up

# 查看日志
make docker-logs

# 停止服务
make docker-down
```

## 可用命令

```bash
# 开发
bun run dev            # 启动开发服务器（热重载）
bun run build          # 构建生产版本
bun run start          # 启动生产服务器

# 数据库
bun run db:generate    # 生成 Drizzle schema
bun run db:migrate     # 运行数据库迁移
bun run db:push        # 推送 schema 到数据库（无迁移）
bun run db:studio      # 打开 Drizzle Studio（数据库 GUI）
bun run db:seed        # 种子数据

# 代码质量
bun run lint           # 运行 ESLint
bun run format         # 格式化代码
bun test               # 运行测试

# Docker
make docker-build      # 构建 Docker 镜像
make docker-up         # 启动容器
make docker-down       # 停止容器
make docker-logs       # 查看日志

# 其他
make help              # 显示所有可用命令
make clean             # 清理构建产物
```

## 项目结构

```
halolight-api-bun/
├── src/
│   ├── db/
│   │   ├── schema.ts          # Drizzle schema 定义
│   │   ├── index.ts           # 数据库连接
│   │   ├── migrate.ts         # 迁移脚本
│   │   └── seed.ts            # 种子数据脚本
│   ├── middleware/
│   │   ├── auth.ts            # JWT 认证中间件
│   │   ├── cors.ts            # CORS 配置
│   │   ├── error.ts           # 错误处理
│   │   └── logger.ts          # 日志中间件
│   ├── routes/
│   │   ├── auth.ts            # 认证路由
│   │   ├── users.ts           # 用户路由
│   │   └── index.ts           # 路由汇总
│   ├── services/
│   │   ├── auth.service.ts    # 认证服务
│   │   └── user.service.ts    # 用户服务
│   ├── utils/
│   │   ├── env.ts             # 环境变量验证
│   │   ├── jwt.ts             # JWT 工具
│   │   ├── hash.ts            # 密码哈希（Bun 内置）
│   │   └── response.ts        # 响应工具
│   └── index.ts               # 应用入口
├── drizzle/                   # 迁移文件（自动生成）
├── .env.example               # 环境变量示例
├── .gitignore
├── Dockerfile                 # Docker 配置
├── docker-compose.yml         # Docker Compose 配置
├── drizzle.config.ts          # Drizzle Kit 配置
├── Makefile                   # Make 命令
├── package.json
├── tsconfig.json
└── README.md
```

## API 端点

### 认证 (Public)

| 方法 | 路径 | 描述 | Body |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | `{ email, username, password, firstName?, lastName? }` |
| POST | `/api/auth/login` | 用户登录 | `{ email, password }` |
| GET | `/api/auth/me` | 获取当前用户 | - (需要 JWT) |

### 用户管理 (Protected - 需要认证)

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/users` | 获取用户列表（分页） | 任何认证用户 |
| GET | `/api/users/:id` | 获取单个用户 | 任何认证用户 |
| PUT | `/api/users/:id` | 更新用户信息 | 仅管理员 |
| DELETE | `/api/users/:id` | 删除用户 | 仅管理员 |

### 健康检查

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/` | API 信息 |

## API 示例

### 注册

```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 登录

```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 获取用户列表（需要认证）

```bash
curl -X GET "http://localhost:3002/api/users?page=1&pageSize=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**响应**:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 获取当前用户

```bash
curl -X GET http://localhost:3002/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 更新用户（管理员）

```bash
curl -X PUT http://localhost:3002/api/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin",
    "isActive": true
  }'
```

## 环境变量

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `NODE_ENV` | 应用环境 | `development` | ❌ |
| `PORT` | 服务端口 | `3002` | ❌ |
| `DATABASE_URL` | 数据库连接 URL | - | ✅ |
| `JWT_SECRET` | JWT 密钥（至少 32 字符） | - | ✅ |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `7d` | ❌ |
| `CORS_ORIGIN` | CORS 允许的源（逗号分隔） | `http://localhost:3000` | ❌ |
| `API_PREFIX` | API 路由前缀 | `/api` | ❌ |

## 架构设计

### 分层架构

```
┌─────────────────────────────────────┐
│         Routes (Hono)               │  ← HTTP 层：路由、验证
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│          Services                   │  ← 业务逻辑层
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      Drizzle ORM                    │  ← 数据访问层
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      PostgreSQL Database            │
└─────────────────────────────────────┘
```

### 认证流程

1. 用户登录 → 验证凭据
2. 生成 JWT token（包含 userId、email、role）
3. 客户端在后续请求中携带 token（`Authorization: Bearer <token>`）
4. `authMiddleware` 验证 token
5. 从 token 提取用户信息并注入到 Hono context
6. 业务逻辑通过 `c.get('user')` 获取当前用户

### 数据库 Schema

```typescript
users {
  id: UUID (PK)
  email: VARCHAR(255) UNIQUE
  username: VARCHAR(100) UNIQUE
  password: TEXT
  firstName: VARCHAR(100)
  lastName: VARCHAR(100)
  avatar: TEXT
  isActive: BOOLEAN
  isVerified: BOOLEAN
  role: VARCHAR(50) (user|admin|moderator)
  lastLoginAt: TIMESTAMP
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

## 开发指南

### 添加新的 API 端点

1. **定义 Schema** (`src/db/schema.ts`)
   ```typescript
   export const posts = pgTable('posts', { ... });
   export const insertPostSchema = createInsertSchema(posts);
   ```

2. **创建 Service** (`src/services/post.service.ts`)
   ```typescript
   export class PostService {
     async findAll() { ... }
   }
   ```

3. **添加 Route** (`src/routes/posts.ts`)
   ```typescript
   export const postRoutes = new Hono();
   postRoutes.get('/', async (c) => { ... });
   ```

4. **注册路由** (`src/routes/index.ts`)
   ```typescript
   apiRoutes.route('/posts', postRoutes);
   ```

### 运行数据库迁移

```bash
# 1. 修改 schema (src/db/schema.ts)
# 2. 生成迁移文件
bun run db:generate

# 3. 查看生成的迁移 SQL（drizzle/ 目录）
# 4. 运行迁移
bun run db:migrate

# 或者直接推送 schema（跳过迁移文件）
bun run db:push
```

### 使用 Drizzle Studio

```bash
# 启动 Drizzle Studio（数据库可视化工具）
bun run db:studio

# 访问 https://local.drizzle.studio/
```

## 性能优化

### Bun 性能优势

- **更快的启动**: Bun 比 Node.js 启动快 4x
- **内置 API**: 无需 bcryptjs，使用 `Bun.password` 内置加密
- **更快的依赖安装**: `bun install` 比 `npm install` 快 20-30x
- **HTTP 性能**: Hono + Bun 比 Express + Node.js 快 2-3x

### 数据库优化

- 使用连接池（`postgres` 库自动管理）
- 适当的索引（email、username 已建立 UNIQUE 索引）
- 分页查询避免全表扫描

### 生产部署建议

- 启用 PostgreSQL 连接池
- 使用 Redis 缓存频繁查询
- 启用 HTTPS（反向代理）
- 设置速率限制中间件
- 使用环境变量管理配置

## 安全最佳实践

- ✅ 密码使用 Bun 内置 bcrypt 哈希（cost=10）
- ✅ JWT 签名验证（HS256）
- ✅ CORS 中间件配置
- ✅ Zod 输入验证
- ✅ SQL 注入防护（Drizzle 参数化查询）
- ✅ 错误信息不泄露敏感数据
- ⚠️ 生产环境务必修改 `JWT_SECRET`（至少 32 字符）
- ⚠️ 生产环境建议使用 HTTPS
- ⚠️ 考虑添加速率限制中间件
- ⚠️ 定期更新依赖

## 故障排查

### 常见问题

**问题**: 无法连接数据库

```bash
# 检查 PostgreSQL 是否运行
docker-compose ps

# 查看数据库日志
docker-compose logs db

# 测试连接
psql postgresql://postgres:postgres@localhost:5432/halolight
```

**问题**: JWT token 无效

- 确认 `JWT_SECRET` 配置正确（至少 32 字符）
- 检查 token 是否过期
- 验证 Authorization header 格式: `Bearer <token>`

**问题**: Drizzle 迁移失败

```bash
# 删除旧迁移文件
rm -rf drizzle/

# 重新生成
bun run db:generate

# 或直接推送（跳过迁移）
bun run db:push
```

**问题**: Docker 容器启动失败

```bash
# 查看详细日志
docker-compose logs api

# 重新构建
docker-compose build --no-cache

# 清理并重启
docker-compose down -v
docker-compose up -d
```

## 测试

```bash
# 运行单元测试
bun test

# 运行测试（watch 模式）
bun test --watch

# 生成覆盖率报告
bun test --coverage
```

## 部署

### Docker 部署

```bash
# 构建镜像
docker build -t halolight-api-bun .

# 运行容器
docker run -d \
  -p 3002:3002 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e JWT_SECRET=your-secret \
  halolight-api-bun
```

### 云平台部署

支持部署到：
- **Fly.io** - `fly launch`
- **Railway** - 连接 GitHub 仓库
- **Render** - Docker 部署
- **自托管** - Systemd 服务

## 相关链接

- [HaloLight 文档](https://halolight.docs.h7ml.cn)
- [Bun 文档](https://bun.sh/docs)
- [Hono 文档](https://hono.dev/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

[MIT](LICENSE)

---

Made with ❤️ by HaloLight Team
