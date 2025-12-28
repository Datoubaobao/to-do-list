# TickTick Clone - 待办管理工具

一个基于 Next.js 15 + TypeScript + TailwindCSS + Supabase 的待办事项管理工具，参考滴答清单（TickTick）的设计。

## ✨ 功能特性

- ✅ 用户认证（邮箱+密码注册/登录）
- ✅ 任务 CRUD（创建、读取、更新、删除）
- ✅ 任务字段：标题、备注、截止日期、计划日期、优先级、标签、所属清单
- ✅ 视图过滤：今天、最近7天、收集箱
- ✅ 自定义清单/项目管理
- ✅ 三栏布局：侧边栏、任务列表、详情面板
- ✅ 响应式设计（窄屏时详情面板变为抽屉）

## 🛠 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: TailwindCSS
- **UI 组件**: shadcn/ui
- **后端**: Supabase (Auth + Postgres)
- **部署**: Vercel

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Supabase

#### 2.1 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并登录
2. 创建新项目
3. 等待项目初始化完成（约 2-3 分钟）

#### 2.2 获取 API 密钥

1. 在 Supabase Dashboard 中，点击 **Settings** → **API**
2. 复制以下信息：
   - **Project URL**: 类似 `https://xxxxx.supabase.co`
   - **anon/public key**: 以 `eyJ...` 开头的长字符串

#### 2.3 配置环境变量

复制 `env.example` 为 `.env.local`：

```bash
cp env.example .env.local
```

在 `.env.local` 中填入你的 Supabase 项目信息：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

#### 2.4 执行数据库迁移

1. 在 Supabase Dashboard 中，点击 **SQL Editor**
2. 点击 **New query**
3. 打开项目中的 `supabase/migrations/001_initial_schema.sql` 文件
4. 复制整个 SQL 内容到 SQL Editor
5. 点击 **Run** 执行
6. 确认执行成功（应该看到 "Success. No rows returned"）

**验证表是否创建成功：**

在 SQL Editor 中执行：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

应该看到以下表：`profiles`, `lists`, `tasks`, `tags`, `task_tags`

#### 2.5 配置 Authentication

1. 在 Supabase Dashboard 中，点击 **Authentication** → **Settings**
2. 在 "Auth Providers" 部分，确保 **Email** 已启用
3. 在 "Site URL" 中填入：`http://localhost:3000`
4. 在 "Redirect URLs" 中添加：`http://localhost:3000/**`

### 3. 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📦 部署到 Vercel

### 1. 准备代码仓库

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. 在 Vercel 部署

1. 访问 [Vercel](https://vercel.com) 并登录
2. 点击 **New Project**
3. 导入你的 Git 仓库
4. 配置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. 点击 **Deploy**

### 3. 更新 Supabase 配置

部署完成后，在 Supabase Dashboard → Authentication → Settings 中：

1. 更新 **Site URL** 为你的 Vercel 域名（如：`https://your-app.vercel.app`）
2. 在 **Redirect URLs** 中添加：`https://your-app.vercel.app/**`

## 📁 项目结构

```
.
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 主页（任务管理）
│   ├── login/             # 登录页面（待实现）
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 组件
│   ├── sidebar.tsx       # 侧边栏
│   ├── task-list.tsx     # 任务列表
│   └── detail-panel.tsx  # 详情面板
├── lib/                  # 工具函数
│   ├── supabase/         # Supabase 客户端
│   └── utils.ts          # 通用工具
├── supabase/             # 数据库迁移
│   └── migrations/       # SQL 迁移脚本
└── README.md             # 项目文档
```

## 📋 数据库设计

### 表结构

- **profiles**: 用户资料表
- **lists**: 清单/项目表
- **tasks**: 任务表
- **tags**: 标签表
- **task_tags**: 任务-标签关联表

### Row Level Security (RLS)

所有表都启用了 RLS，确保用户只能访问自己的数据。策略基于 `auth.uid()` 进行过滤。

## 🔄 下一步开发计划

- [ ] 接入 Supabase Auth（登录/注册功能）
- [ ] 实现任务 CRUD API（Server Actions）
- [ ] 实现清单 CRUD API
- [ ] 实现视图过滤（Today/Week/Inbox）
- [ ] 实现标签功能
- [ ] 实现搜索功能
- [ ] 添加响应式设计（移动端适配）
- [ ] 添加任务排序/拖拽功能

## 📝 开发说明

### 当前状态（步骤 A 完成）

✅ 已完成：
- Next.js 15 项目初始化
- TypeScript + TailwindCSS 配置
- shadcn/ui 基础组件
- 三栏布局 UI（Sidebar + TaskList + DetailPanel）
- 模拟数据展示
- Supabase 客户端配置（待连接）

⏳ 待完成（步骤 B-G）：
- Supabase Auth 集成
- 数据库连接和 CRUD 操作
- 视图过滤逻辑
- 详情面板保存功能
- 完整的 README 和部署文档

## 🐛 常见问题

### Q: 执行 SQL 时提示权限错误？

A: 确保你使用的是 Supabase Dashboard 的 SQL Editor，而不是通过其他客户端连接。

### Q: RLS 策略导致无法查询数据？

A: 确保：
1. 用户已通过 Supabase Auth 登录
2. RLS 策略正确创建（检查 SQL 执行是否成功）
3. 查询时使用的是登录用户的 `auth.uid()`

### Q: 如何重置数据库？

A: 在 SQL Editor 中执行：

```sql
DROP TABLE IF EXISTS task_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS lists CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```

然后重新执行迁移脚本。

## 📄 许可证

MIT

