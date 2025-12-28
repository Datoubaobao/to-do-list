# 快速启动指南

## ✅ 步骤 A 已完成

项目基础结构已创建完成，包括：

- ✅ Next.js 15 项目初始化
- ✅ TypeScript + TailwindCSS 配置
- ✅ shadcn/ui 基础组件库
- ✅ 三栏布局 UI（Sidebar + TaskList + DetailPanel）
- ✅ 模拟数据展示
- ✅ Supabase 客户端配置
- ✅ 数据库迁移 SQL 脚本
- ✅ 项目文档

## 🚀 立即开始

### 1. 安装依赖（如果还没安装）

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

**当前状态**：应用使用模拟数据运行，UI 已完整，但还未连接 Supabase。

---

## 📋 下一步：配置 Supabase

要连接真实的数据库，你需要完成以下配置：

### 快速配置步骤

1. **创建 Supabase 项目**
   - 访问 [supabase.com](https://supabase.com) 并登录
   - 创建新项目

2. **获取 API 密钥**
   - Settings → API
   - 复制 Project URL 和 anon key

3. **配置环境变量**
   ```bash
   cp env.example .env.local
   # 编辑 .env.local，填入 Supabase 信息
   ```

4. **执行数据库迁移**
   - 在 Supabase Dashboard → SQL Editor
   - 复制 `supabase/migrations/001_initial_schema.sql` 内容
   - 执行 SQL

5. **配置 Authentication**
   - Authentication → Settings
   - 设置 Site URL: `http://localhost:3000`
   - 添加 Redirect URL: `http://localhost:3000/**`

**详细步骤请查看**：[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

---

## 📁 项目结构

```
.
├── app/                      # Next.js App Router
│   ├── layout.tsx           # 根布局
│   ├── page.tsx             # 主页（三栏布局）
│   └── globals.css          # 全局样式
├── components/              # React 组件
│   ├── ui/                  # shadcn/ui 组件
│   ├── sidebar.tsx          # 左侧边栏
│   ├── task-list.tsx        # 中间任务列表
│   └── detail-panel.tsx     # 右侧详情面板
├── lib/                     # 工具函数
│   ├── supabase/           # Supabase 客户端
│   └── utils.ts            # 通用工具
├── supabase/               # 数据库迁移
│   └── migrations/         # SQL 脚本
├── env.example             # 环境变量模板
├── README.md               # 项目文档
└── SUPABASE_SETUP.md       # Supabase 配置指南
```

---

## 🎯 功能演示

当前应用已实现：

1. **三栏布局**
   - 左侧：Today、最近7天、收集箱、清单列表
   - 中间：任务列表（可勾选、可新增）
   - 右侧：任务详情面板（可编辑）

2. **基础交互**
   - 点击任务查看详情
   - 勾选任务完成/取消完成
   - 输入框回车新增任务
   - 详情面板编辑任务信息

3. **UI 特性**
   - 已完成任务样式（划线、灰化）
   - 空状态提示
   - 响应式布局

---

## ⏭️ 下一步开发计划

完成 Supabase 配置后，继续实现：

- **步骤 B**：接入 Supabase Auth（登录/注册）
- **步骤 C**：✅ 已完成（数据库表和 RLS）
- **步骤 D**：实现 tasks/lists 的 CRUD（Server Actions）
- **步骤 E**：实现视图过滤（Today/Week/Inbox）
- **步骤 F**：实现详情面板保存功能
- **步骤 G**：完善文档和部署指南

---

## 🐛 遇到问题？

1. **查看详细文档**：[README.md](./README.md)
2. **Supabase 配置问题**：[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
3. **构建错误**：确保已安装所有依赖 `npm install`
4. **类型错误**：运行 `npm run build` 检查 TypeScript 错误

---

## ✨ 提示

- 当前使用模拟数据，所有操作都在前端完成
- 配置 Supabase 后，数据将持久化到数据库
- 所有表都启用了 RLS，确保数据安全隔离

