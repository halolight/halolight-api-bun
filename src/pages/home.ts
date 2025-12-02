import { env } from '../utils/env';

/**
 * Generate beautiful home page HTML
 */
export function getHomePage(): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="HaloLight API - 基于 Bun + Hono + Drizzle ORM 的高性能后端服务">
  <meta name="keywords" content="Bun, Hono, API, TypeScript, Drizzle, PostgreSQL, JWT, RBAC">
  <title>HaloLight API | High-Performance Backend Service</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚀</text></svg>">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '#f472b6',
            secondary: '#a78bfa',
            accent: '#38bdf8',
          }
        }
      }
    }
  </script>
  <style>
    :root {
      --primary: #f472b6;
      --secondary: #a78bfa;
      --accent: #38bdf8;
      --gradient: linear-gradient(135deg, var(--accent) 0%, var(--secondary) 50%, var(--primary) 100%);
    }
    .bg-gradient-animated::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at 30% 30%, rgba(244, 114, 182, 0.15) 0%, transparent 50%),
                  radial-gradient(circle at 70% 70%, rgba(167, 139, 250, 0.1) 0%, transparent 50%),
                  radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.05) 0%, transparent 50%);
      animation: rotate 30s linear infinite;
    }
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .text-gradient {
      background: var(--gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .bg-gradient-brand { background: var(--gradient); }
    .btn-gradient {
      background: var(--gradient);
      box-shadow: 0 4px 14px rgba(244, 114, 182, 0.4);
    }
    .btn-gradient:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(244, 114, 182, 0.5);
    }
    .card-hover:hover {
      border-color: var(--primary);
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }
    .module-hover:hover {
      border-color: var(--primary);
      background: rgba(244, 114, 182, 0.1);
    }
    .cta-pattern::before {
      content: '';
      position: absolute;
      inset: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
  </style>
</head>
<body class="bg-slate-900 text-slate-50 min-h-screen overflow-x-hidden font-sans">
  <div class="fixed inset-0 bg-slate-900 -z-10 bg-gradient-animated"></div>

  <!-- Navigation -->
  <nav class="fixed top-0 left-0 right-0 z-50 py-4 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
    <div class="max-w-7xl mx-auto px-6 flex justify-between items-center">
      <div class="text-2xl font-bold text-gradient">🚀 HaloLight API</div>
      <div class="hidden md:flex items-center gap-6">
        <a href="#features" class="text-slate-400 hover:text-white text-sm font-medium transition-colors">Features</a>
        <a href="#modules" class="text-slate-400 hover:text-white text-sm font-medium transition-colors">Modules</a>
        <a href="/docs" class="text-slate-400 hover:text-white text-sm font-medium transition-colors">API Docs</a>
        <a href="https://github.com/halolight/halolight-api-bun" target="_blank" class="text-slate-400 hover:text-white text-sm font-medium transition-colors">GitHub</a>
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">v1.0.0</span>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="min-h-screen flex items-center pt-20">
    <div class="max-w-7xl mx-auto px-6">
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-slate-700/50 rounded-full text-sm text-slate-400 mb-6">
          <span class="text-pink-500">⚡</span> High-Performance Backend Service
        </div>
        <h1 class="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
          极速 API 开发<br>
          <span class="text-gradient">Bun 驱动的未来</span>
        </h1>
        <p class="text-xl text-slate-400 leading-relaxed mb-8">
          基于 Bun + Hono + Drizzle ORM 的高性能后端服务，比 Node.js 快 4 倍，
          提供完整的 JWT 双令牌认证、RBAC 权限管理，开箱即用。
        </p>
        <div class="flex flex-col sm:flex-row gap-4 mb-12">
          <a href="/docs" class="btn-gradient inline-flex items-center justify-center gap-2 px-7 py-4 text-white font-semibold rounded-xl transition-all">
            📖 查看 API 文档
          </a>
          <a href="https://halolight.docs.h7ml.cn/guide/api-bun" class="inline-flex items-center justify-center gap-2 px-7 py-4 bg-slate-800/80 text-white font-semibold rounded-xl border border-slate-700/50 hover:border-pink-500 hover:bg-slate-800 transition-all" target="_blank">
            📚 在线使用指南
          </a>
          <a href="${env.API_PREFIX}/health" class="inline-flex items-center justify-center gap-2 px-7 py-4 bg-slate-800/80 text-white font-semibold rounded-xl border border-slate-700/50 hover:border-pink-500 hover:bg-slate-800 transition-all">
            💚 健康检查
          </a>
        </div>
        <!-- Tech Stack -->
        <div class="flex flex-wrap gap-3 pt-8 border-t border-slate-700/50">
          <div class="flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-slate-700/50 rounded-lg text-sm text-slate-400">
            <img src="https://bun.sh/logo.svg" alt="Bun" class="w-5 h-5">
            Bun 1.1+
          </div>
          <div class="flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-slate-700/50 rounded-lg text-sm text-slate-400">
            <img src="https://hono.dev/images/logo-small.png" alt="Hono" class="w-5 h-5">
            Hono 4.x
          </div>
          <div class="flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-slate-700/50 rounded-lg text-sm text-slate-400">
            <img src="https://orm.drizzle.team/favicon.ico" alt="Drizzle" class="w-5 h-5">
            Drizzle ORM
          </div>
          <div class="flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-slate-700/50 rounded-lg text-sm text-slate-400">
            <img src="https://www.postgresql.org/favicon.ico" alt="PostgreSQL" class="w-5 h-5">
            PostgreSQL 15+
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Stats Section -->
  <section class="py-16">
    <div class="max-w-7xl mx-auto px-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div class="text-center p-8 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
          <div class="text-5xl font-extrabold text-gradient mb-2">4x</div>
          <div class="text-slate-400">比 Node.js 快</div>
        </div>
        <div class="text-center p-8 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
          <div class="text-5xl font-extrabold text-gradient mb-2">50+</div>
          <div class="text-slate-400">API 端点</div>
        </div>
        <div class="text-center p-8 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
          <div class="text-5xl font-extrabold text-gradient mb-2">100%</div>
          <div class="text-slate-400">TypeScript</div>
        </div>
        <div class="text-center p-8 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
          <div class="text-5xl font-extrabold text-gradient mb-2">MIT</div>
          <div class="text-slate-400">开源协议</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section id="features" class="py-24">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold mb-4">核心特性</h2>
        <p class="text-slate-400 text-lg max-w-2xl mx-auto">高性能架构设计，极致开发体验</p>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="p-8 bg-slate-800/50 border border-slate-700/50 rounded-2xl transition-all card-hover">
          <div class="w-12 h-12 flex items-center justify-center bg-gradient-brand rounded-xl text-2xl mb-5">⚡</div>
          <h3 class="text-xl font-semibold mb-3">Bun 运行时</h3>
          <p class="text-slate-400 leading-relaxed">比 Node.js 快 4 倍的启动速度，内置 TypeScript 支持，原生 ESM 模块。</p>
        </div>
        <div class="p-8 bg-slate-800/50 border border-slate-700/50 rounded-2xl transition-all card-hover">
          <div class="w-12 h-12 flex items-center justify-center bg-gradient-brand rounded-xl text-2xl mb-5">🔐</div>
          <h3 class="text-xl font-semibold mb-3">JWT 双令牌认证</h3>
          <p class="text-slate-400 leading-relaxed">AccessToken (${env.JWT_EXPIRES_IN}) + RefreshToken (${env.JWT_REFRESH_EXPIRES_IN})，安全可靠。</p>
        </div>
        <div class="p-8 bg-slate-800/50 border border-slate-700/50 rounded-2xl transition-all card-hover">
          <div class="w-12 h-12 flex items-center justify-center bg-gradient-brand rounded-xl text-2xl mb-5">🛡️</div>
          <h3 class="text-xl font-semibold mb-3">RBAC 权限控制</h3>
          <p class="text-slate-400 leading-relaxed">基于角色的访问控制，支持通配符权限，灵活的权限管理。</p>
        </div>
        <div class="p-8 bg-slate-800/50 border border-slate-700/50 rounded-2xl transition-all card-hover">
          <div class="w-12 h-12 flex items-center justify-center bg-gradient-brand rounded-xl text-2xl mb-5">🔷</div>
          <h3 class="text-xl font-semibold mb-3">Drizzle ORM</h3>
          <p class="text-slate-400 leading-relaxed">TypeScript-first SQL ORM，类型安全，轻量高效。</p>
        </div>
        <div class="p-8 bg-slate-800/50 border border-slate-700/50 rounded-2xl transition-all card-hover">
          <div class="w-12 h-12 flex items-center justify-center bg-gradient-brand rounded-xl text-2xl mb-5">📚</div>
          <h3 class="text-xl font-semibold mb-3">Swagger 文档</h3>
          <p class="text-slate-400 leading-relaxed">动态生成 OpenAPI 文档，支持在线测试，前后端协作更高效。</p>
        </div>
        <div class="p-8 bg-slate-800/50 border border-slate-700/50 rounded-2xl transition-all card-hover">
          <div class="w-12 h-12 flex items-center justify-center bg-gradient-brand rounded-xl text-2xl mb-5">✅</div>
          <h3 class="text-xl font-semibold mb-3">Zod 验证</h3>
          <p class="text-slate-400 leading-relaxed">TypeScript-first schema 验证，自动类型推断，运行时安全。</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Modules Section -->
  <section id="modules" class="py-24">
    <div class="max-w-7xl mx-auto px-6">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold mb-4">API 模块</h2>
        <p class="text-slate-400 text-lg max-w-2xl mx-auto">核心业务模块，覆盖常见企业应用场景</p>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <a href="/docs#/Auth" class="p-5 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center gap-4 transition-all module-hover no-underline">
          <div class="text-2xl">🔑</div>
          <div><h4 class="font-semibold text-white">Auth</h4><span class="text-sm text-slate-400">认证模块</span></div>
        </a>
        <a href="/docs#/Users" class="p-5 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center gap-4 transition-all module-hover no-underline">
          <div class="text-2xl">👥</div>
          <div><h4 class="font-semibold text-white">Users</h4><span class="text-sm text-slate-400">用户管理</span></div>
        </a>
        <a href="/docs#/Roles" class="p-5 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center gap-4 transition-all module-hover no-underline">
          <div class="text-2xl">🎭</div>
          <div><h4 class="font-semibold text-white">Roles</h4><span class="text-sm text-slate-400">角色管理</span></div>
        </a>
        <a href="/docs#/Permissions" class="p-5 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center gap-4 transition-all module-hover no-underline">
          <div class="text-2xl">🔒</div>
          <div><h4 class="font-semibold text-white">Permissions</h4><span class="text-sm text-slate-400">权限管理</span></div>
        </a>
        <a href="/docs#/Teams" class="p-5 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center gap-4 transition-all module-hover no-underline">
          <div class="text-2xl">👨‍👩‍👧‍👦</div>
          <div><h4 class="font-semibold text-white">Teams</h4><span class="text-sm text-slate-400">团队管理</span></div>
        </a>
        <a href="/docs#/Documents" class="p-5 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center gap-4 transition-all module-hover no-underline">
          <div class="text-2xl">📄</div>
          <div><h4 class="font-semibold text-white">Documents</h4><span class="text-sm text-slate-400">文档管理</span></div>
        </a>
        <a href="/docs#/Notifications" class="p-5 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center gap-4 transition-all module-hover no-underline">
          <div class="text-2xl">🔔</div>
          <div><h4 class="font-semibold text-white">Notifications</h4><span class="text-sm text-slate-400">通知管理</span></div>
        </a>
        <a href="/docs#/Dashboard" class="p-5 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center gap-4 transition-all module-hover no-underline">
          <div class="text-2xl">📊</div>
          <div><h4 class="font-semibold text-white">Dashboard</h4><span class="text-sm text-slate-400">仪表盘</span></div>
        </a>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-24">
    <div class="max-w-7xl mx-auto px-6">
      <div class="relative p-16 bg-gradient-brand rounded-3xl overflow-hidden cta-pattern">
        <div class="relative text-center">
          <h2 class="text-4xl font-bold mb-4">开始使用 HaloLight API</h2>
          <p class="text-lg opacity-90 mb-8">查看完整文档，快速集成到你的项目中</p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/docs" class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-pink-600 font-semibold rounded-xl hover:shadow-xl transition-all">
              📖 Swagger 文档
            </a>
            <a href="https://halolight.docs.h7ml.cn/guide/api-bun" class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 text-white font-semibold rounded-xl border border-white/40 hover:bg-white/30 transition-all" target="_blank">
              📚 完整使用指南
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-12 border-t border-slate-700/50">
    <div class="max-w-7xl mx-auto px-6 text-center">
      <div class="flex flex-wrap justify-center gap-8 mb-6">
        <a href="/docs" class="text-slate-400 hover:text-white text-sm transition-colors">API 文档</a>
        <a href="https://halolight.docs.h7ml.cn/guide/api-bun" target="_blank" class="text-slate-400 hover:text-white text-sm transition-colors">在线使用指南</a>
        <a href="https://github.com/halolight/halolight-api-bun" target="_blank" class="text-slate-400 hover:text-white text-sm transition-colors">GitHub</a>
        <a href="https://github.com/halolight/halolight-api-bun/issues" target="_blank" class="text-slate-400 hover:text-white text-sm transition-colors">问题反馈</a>
      </div>
      <p class="text-slate-400 text-sm">
        Built with ❤️ by <a href="https://github.com/h7ml" target="_blank" class="text-pink-400 hover:underline">h7ml</a> |
        Powered by Bun + Hono + Drizzle ORM
      </p>
      <p class="text-slate-500 text-sm mt-2">
        Version 1.0.0 | Environment: ${env.NODE_ENV}
      </p>
    </div>
  </footer>
</body>
</html>
  `.trim();
}
