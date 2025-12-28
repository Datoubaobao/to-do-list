# Supabase 配置详细指南

本文档详细说明如何在 Supabase 控制台配置项目，完成步骤 A 后需要执行的配置。

## 📋 配置清单

完成以下步骤后，你的项目就可以连接到 Supabase 并开始使用数据库了：

- [ ] 创建 Supabase 项目
- [ ] 获取 API 密钥
- [ ] 配置环境变量
- [ ] 执行数据库迁移
- [ ] 配置 Authentication
- [ ] 验证配置

---

## 第一步：创建 Supabase 项目

1. **访问 Supabase**
   - 打开 [https://supabase.com](https://supabase.com)
   - 使用 GitHub 账号登录（推荐）或创建新账号

2. **创建新项目**
   - 点击 Dashboard 右上角的 **"New Project"** 按钮
   - 填写项目信息：
     - **Name**: `ticktick-clone`（或你喜欢的名称）
     - **Database Password**: 设置一个强密码（⚠️ **请务必保存好**，后续无法查看）
     - **Region**: 选择离你最近的区域
       - 中国大陆用户推荐：`Southeast Asia (Singapore)`
       - 其他地区选择最近的区域
   - 点击 **"Create new project"**

3. **等待初始化**
   - 项目创建需要 2-3 分钟
   - 等待状态变为 "Active" 即可继续

---

## 第二步：获取 API 密钥

1. **进入 API 设置**
   - 在项目 Dashboard 左侧菜单，点击 **Settings**（齿轮图标）
   - 点击 **API**

2. **复制密钥信息**
   - 找到 **Project URL**，类似：`https://xxxxx.supabase.co`
   - 找到 **anon/public key**，以 `eyJ...` 开头的长字符串
   - 复制这两个值（稍后会用到）

---

## 第三步：配置环境变量

1. **创建环境变量文件**
   ```bash
   # 在项目根目录执行
   cp env.example .env.local
   ```

2. **填入 Supabase 信息**
   打开 `.env.local` 文件，填入刚才复制的值：

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   ⚠️ **注意**：
   - 不要提交 `.env.local` 到 Git（已在 `.gitignore` 中）
   - 确保 URL 和 Key 都是正确的

---

## 第四步：执行数据库迁移

这是最关键的一步，将创建所有必要的数据库表和 RLS 策略。

1. **打开 SQL Editor**
   - 在 Supabase Dashboard 左侧菜单，点击 **SQL Editor**
   - 点击 **"New query"** 按钮

2. **执行迁移脚本**
   - 打开项目中的 `supabase/migrations/001_initial_schema.sql` 文件
   - 复制整个文件内容
   - 粘贴到 SQL Editor 中
   - 点击右下角的 **"Run"** 按钮（或按 `Cmd/Ctrl + Enter`）

3. **验证执行结果**
   - 应该看到 "Success. No rows returned" 的提示
   - 如果有错误，检查错误信息并修复

4. **验证表是否创建成功**

   在 SQL Editor 中执行以下查询：

   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_type = 'BASE TABLE'
   ORDER BY table_name;
   ```

   应该看到以下 5 个表：
   - `profiles`
   - `lists`
   - `tasks`
   - `tags`
   - `task_tags`

5. **验证 RLS 是否启用**

   执行以下查询：

   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('profiles', 'lists', 'tasks', 'tags', 'task_tags');
   ```

   所有表的 `rowsecurity` 都应该是 `true`。

---

## 第五步：配置 Authentication

1. **进入 Authentication 设置**
   - 在 Supabase Dashboard 左侧菜单，点击 **Authentication**
   - 点击 **Settings**（或直接点击 **Providers**）

2. **启用 Email 认证**
   - 在 **Auth Providers** 部分，找到 **Email**
   - 确保 **Enable Email provider** 已开启（默认已开启）

3. **配置 Site URL**
   - 在 **Site URL** 字段中填入：
     - 本地开发：`http://localhost:3000`
     - 生产环境：你的 Vercel 域名（部署后添加）

4. **配置 Redirect URLs**
   - 在 **Redirect URLs** 部分，点击 **Add URL**
   - 添加以下 URL：
     - `http://localhost:3000/**`（本地开发）
     - `https://your-app.vercel.app/**`（生产环境，部署后添加）

---

## 第六步：验证配置

### 测试数据库连接

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **检查控制台**
   - 打开浏览器控制台（F12）
   - 访问 `http://localhost:3000`
   - 应该没有 Supabase 连接错误

### 测试表结构

在 Supabase Dashboard → Table Editor 中，你应该能看到所有创建的表。

---

## 🎯 下一步

完成以上配置后，你已经完成了：

✅ **步骤 A**：项目初始化和基础 UI

接下来需要完成：

⏳ **步骤 B**：接入 Supabase Auth（登录/注册功能）
- 实现登录页面
- 实现注册功能
- 添加受保护路由中间件

⏳ **步骤 C**：已通过迁移脚本完成（数据库表和 RLS 策略）

⏳ **步骤 D-G**：实现业务逻辑和功能

---

## 🐛 常见问题

### Q1: 执行 SQL 时提示 "permission denied"？

**A**: 确保你使用的是 Supabase Dashboard 的 SQL Editor，而不是通过其他数据库客户端连接。Dashboard 有完整的权限。

### Q2: 表已创建但查询不到数据？

**A**: 检查以下几点：
1. RLS 策略是否正确创建
2. 是否已通过 Auth 登录（未登录时无法查询）
3. 查询时是否使用了正确的 `user_id`

### Q3: 如何查看当前登录用户？

**A**: 在应用代码中：
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log(user?.id);
```

### Q4: 如何重置数据库？

**A**: 在 SQL Editor 中执行：
```sql
-- 删除所有表（谨慎操作！）
DROP TABLE IF EXISTS task_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS lists CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 然后重新执行迁移脚本
```

### Q5: 迁移脚本执行失败，提示表已存在？

**A**: 迁移脚本使用了 `CREATE TABLE IF NOT EXISTS`，如果表已存在，会跳过创建。如果你想重新创建，先执行上面的删除语句。

---

## 📚 参考资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [Row Level Security 文档](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✅ 配置完成检查清单

完成所有配置后，确认以下项目：

- [ ] Supabase 项目已创建并处于 Active 状态
- [ ] `.env.local` 文件已创建并填入正确的 URL 和 Key
- [ ] 数据库迁移脚本已成功执行
- [ ] 5 个表都已创建（profiles, lists, tasks, tags, task_tags）
- [ ] RLS 已启用（所有表的 rowsecurity = true）
- [ ] Authentication 已配置（Email 已启用，Site URL 已设置）
- [ ] 本地开发服务器可以正常启动
- [ ] 浏览器控制台没有 Supabase 连接错误

如果所有项目都已完成，恭喜！🎉 你已经准备好进入下一步开发了。

