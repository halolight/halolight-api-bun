# HaloLight API | Bun

[![CI](https://github.com/halolight/halolight-api-bun/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/halolight/halolight-api-bun/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/halolight/halolight-api-bun/blob/main/LICENSE)
[![Bun](https://img.shields.io/badge/Bun-1.1+-%23fbf0df.svg)](https://bun.sh/)
[![Hono](https://img.shields.io/badge/Hono-4.x-%23E36002.svg)](https://hono.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-%233178C6.svg)](https://www.typescriptlang.org/)
[![Drizzle](https://img.shields.io/badge/Drizzle-0.36+-%23C5F74F.svg)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-%23336791.svg)](https://www.postgresql.org/)

基于 Bun + Hono + Drizzle ORM 的高性能后端 API 实现，比 Node.js 快 4 倍，支持 JWT 双令牌认证、RBAC 权限、Swagger 文档，为 HaloLight 多框架管理后台提供极速、轻量的服务端支持。

- 在线预览：<http://halolight-api-bun.h7ml.cn>
- API 文档：<http://halolight-api-bun.h7ml.cn/docs>
- GitHub：<https://github.com/halolight/halolight-api-bun>

## 功能亮点

- **Bun 1.1+ 运行时**：比 Node.js 快 4 倍的启动速度，内置 TypeScript 支持，原生 ESM 模块
- **Hono 4.x 框架**：轻量级、高性能的 Web 框架，~14KB 体积，支持多运行时
- **Drizzle ORM + PostgreSQL**：TypeScript-first SQL ORM，类型安全，轻量高效
- **JWT 双令牌认证**：AccessToken (15m) + RefreshToken (7d)，安全可靠的身份验证
- **RBAC 权限控制**：基于角色的访问控制，支持通配符权限
- **Swagger/OpenAPI 文档**：动态生成交互式 API 文档，支持在线测试
- **Zod 验证**：TypeScript-first schema 验证，自动类型推断
- **9 个业务模块**：50+ RESTful API 端点，覆盖用户、角色、权限、文档、团队、通知等
- **Docker 部署**：多阶段构建优化、Docker Compose 一键部署、健康检查机制
- **完整 CI/CD**：GitHub Actions 自动化 lint、type-check、test、build、security 审计

## 性能优势

| 指标 | Bun | Node.js | 提升 |
|------|-----|---------|------|
| 启动速度 | ~100ms | ~500ms | **4x** |
| HTTP 吞吐量 | ~50,000 req/s | ~20,000 req/s | **2.5x** |
| 内存占用 | ~30MB | ~50MB+ | **40%** |
| 依赖安装 | 极快 | 较慢 | **20-30x** |

## 目录结构

```
src/
├── db/
│   ├── schema.ts          # Drizzle ORM schema 定义（17 个实体）
│   ├── index.ts           # 数据库连接池
│   ├── migrate.ts         # 迁移脚本
│   └── seed.ts            # 种子数据脚本
├── middleware/
│   ├── auth.ts            # JWT 认证中间件
│   ├── cors.ts            # CORS 配置
│   ├── error.ts           # 全局错误处理
│   └── logger.ts          # 请求日志中间件
├── routes/
│   ├── auth.ts            # 认证端点（登录/注册/刷新令牌）
│   ├── users.ts           # 用户管理端点
│   ├── roles.ts           # 角色管理端点
│   ├── permissions.ts     # 权限管理端点
│   ├── teams.ts           # 团队管理端点
│   ├── documents.ts       # 文档管理端点
│   ├── notifications.ts   # 通知管理端点
│   ├── dashboard.ts       # 仪表盘统计端点
│   └── index.ts           # 路由汇总
├── services/
│   ├── auth.service.ts    # 认证业务逻辑
│   ├── user.service.ts    # 用户业务逻辑
│   └── ...                # 其他业务服务
├── swagger/
│   ├── openapi.ts         # OpenAPI 规范动态生成
│   ├── zod-to-json.ts     # Zod Schema 转 JSON Schema
│   └── index.ts           # Swagger UI 路由
├── pages/
│   └── home.ts            # 首页 HTML 模板
├── utils/
│   ├── env.ts             # 环境变量验证
│   ├── jwt.ts             # JWT 签名/验证
│   ├── hash.ts            # 密码哈希（Bun 内置）
│   └── response.ts        # 统一响应格式
└── index.ts               # 应用入口
drizzle/                    # 迁移文件（自动生成）
dist/                       # 构建产物（自动生成）
test/
├── unit/                   # 单元测试
└── e2e/                    # E2E 测试
```

## 快速开始

环境要求：Bun >= 1.1、PostgreSQL >= 15、pnpm >= 8（可选）。

```bash
git clone https://github.com/halolight/halolight-api-bun.git
cd halolight-api-bun

# 安装依赖
bun install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置数据库连接、JWT 密钥等

# 推送数据库 schema
bun run db:push

# 填充测试数据（可选）
bun run db:seed

# 启动开发服务器
bun run dev   # 默认 http://localhost:3002
```

生产构建与启动

```bash
bun run build
bun run start   # 使用构建产物启动
```

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `development` |
| `PORT` | 服务端口 | `3002` |
| `DATABASE_URL` | PostgreSQL 数据库连接 | - |
| `JWT_SECRET` | JWT 密钥（≥32字符） | - |
| `JWT_REFRESH_SECRET` | RefreshToken 密钥（可选） | - |
| `JWT_EXPIRES_IN` | AccessToken 过期时间 | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | RefreshToken 过期时间 | `7d` |
| `CORS_ORIGIN` | CORS 允许源（逗号分隔） | `http://localhost:3000` |
| `API_PREFIX` | API 路由前缀 | `/api` |
| `SWAGGER_ENABLED` | 是否启用 Swagger | `true` |
| `SWAGGER_PATH` | Swagger UI 路径 | `/swagger` |

在项目根目录创建 `.env` 文件来配置环境变量：

```bash
# .env 示例
NODE_ENV=development
PORT=3002
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/halolight
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

## 常用脚本

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
bun run lint:fix       # ESLint 自动修复
bun run type-check     # TypeScript 类型检查
bun run format         # Prettier 格式化
bun test               # 运行单元测试
bun test:e2e           # 运行 E2E 测试
```

## API 模块

项目包含 **9 个核心业务模块**，提供 **50+ RESTful API 端点**：

| 模块 | 端点数 | 描述 |
|------|--------|------|
| **Auth** | 5 | 用户认证（登录、注册、刷新 Token、获取当前用户、登出） |
| **Users** | 5 | 用户管理（CRUD、分页、搜索、过滤） |
| **Roles** | 5 | 角色管理（CRUD + 权限分配） |
| **Permissions** | 2 | 权限管理 |
| **Teams** | 6 | 团队管理（CRUD + 成员管理） |
| **Documents** | 5 | 文档管理 |
| **Notifications** | 4 | 通知管理（列表、未读数、标记已读） |
| **Dashboard** | 7 | 仪表盘统计（统计、趋势、活动、任务） |

### 在线文档

- **Swagger API 文档**：<http://halolight-api-bun.h7ml.cn/docs> - 交互式 API 测试与调试
- **完整使用指南（中文）**：<https://halolight.docs.h7ml.cn/guide/api-bun> - 详细的 API 参考和使用示例
- **完整使用指南（英文）**：<https://halolight.docs.h7ml.cn/en/guide/api-bun> - Full API reference in English

## 代码规范

- **路径别名**：使用相对路径导入模块
- **ESLint 规则**：TypeScript 严格模式 + Prettier 集成
- **类型安全**：严格的 TypeScript 配置，确保类型完整性
- **Zod 验证**：所有请求数据使用 Zod schema 验证
- **测试规范**：单元测试覆盖核心业务逻辑，E2E 测试覆盖关键路径
- **提交规范**：遵循 Conventional Commits 规范（`feat:`, `fix:`, `docs:` 等）

## CI/CD

项目配置了 GitHub Actions 自动化工作流 (`.github/workflows/ci.yml`)：

| Job | 说明 |
|-----|------|
| `lint` | ESLint 检查 + TypeScript 类型检查 |
| `test` | 单元测试 + 覆盖率报告 |
| `e2e` | E2E 测试（PostgreSQL 服务） |
| `build` | Bun 生产构建 + 构建产物缓存 |
| `security` | 依赖安全审计（bun pm audit） |

## 部署

### Docker Compose（推荐）

```bash
# 克隆项目
git clone https://github.com/halolight/halolight-api-bun.git
cd halolight-api-bun

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置数据库密码、JWT密钥等

# 启动所有服务（API + PostgreSQL）
docker-compose up -d

# 查看日志
docker-compose logs -f api

# 停止服务
docker-compose down
```

### Docker 镜像构建

```bash
docker build -t halolight-api-bun .
docker run -p 3002:3002 --env-file .env halolight-api-bun
```

### 自托管部署

1. **环境准备**：确保 Bun >= 1.1 已安装
2. **配置环境变量**：复制 `.env.example` 为 `.env` 并设置必要变量
3. **构建项目**：
   ```bash
   bun install
   bun run build
   ```
4. **启动服务**：
   ```bash
   bun run start  # 生产模式启动
   ```
5. **进程守护**（可选）：使用 PM2、systemd 或 Docker 运行

### 云平台部署

支持部署到：
- **Fly.io** - `fly launch`
- **Railway** - Docker + GitHub 自动部署
- **Render** - 拖拽部署
- **Vercel Edge** - 边缘函数部署
- **自托管** - Systemd 服务

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

## 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进项目！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 相关链接

- [在线预览](http://halolight-api-bun.h7ml.cn)
- [API 文档](http://halolight-api-bun.h7ml.cn/docs)
- [HaloLight 文档](https://github.com/halolight/docs)
- [HaloLight Next.js](https://github.com/halolight/halolight)
- [HaloLight Vue](https://github.com/halolight/halolight-vue)
- [HaloLight Angular](https://github.com/halolight/halolight-angular)
- [HaloLight API NestJS](https://github.com/halolight/halolight-api-nestjs)
- [HaloLight API Java](https://github.com/halolight/halolight-api-java)
- [问题反馈](https://github.com/halolight/halolight-api-bun/issues)

## 许可证

[MIT](LICENSE)
