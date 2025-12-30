# Supabase → 阿里云 RDS PostgreSQL 迁移指南

## ✅ 已完成的改动

### 1. 数据库访问层
- ✅ 新增 `lib/db.ts` - PostgreSQL 连接池（使用 `pg` 库）
- ✅ 支持 SSL 连接（自动检测 `sslmode=require`）
- ✅ 连接池复用（避免 PM2 环境重复创建）

### 2. Server Actions 重写
- ✅ `app/actions/tasks.ts` - 所有任务 CRUD 改用 SQL 直连 PostgreSQL
- ✅ `app/actions/lists.ts` - 清单查询改用 SQL
- ✅ 移除所有 Supabase 依赖（`createClient`, `supabase.auth.getUser()` 等）

### 3. 依赖更新
- ✅ `package.json` - 移除 `@supabase/supabase-js`, `@supabase/ssr`
- ✅ `package.json` - 新增 `pg`, `@types/pg`

### 4. 环境变量
- ✅ `env.example` - 改为只需要 `DATABASE_URL`

### 5. 数据库迁移脚本
- ✅ `db/migrations/001_init.sql` - 创建 `tasks` 和 `lists` 表

---

## 📋 迁移步骤

### 步骤 1：安装依赖

```bash
npm install pg @types/pg
npm uninstall @supabase/supabase-js @supabase/ssr
```

### 步骤 2：配置环境变量

创建或更新 `.env.local`（本地）或服务器环境变量：

```env
# 阿里云 RDS PostgreSQL 连接字符串
DATABASE_URL=postgresql://username:password@rds-host:5432/database_name?sslmode=require

# 可选：如果 SSL 配置需要
# DB_SSL=true
# DB_SSL_REJECT_UNAUTHORIZED=false
```

**连接字符串格式说明：**
- `postgresql://` - 协议
- `username:password` - 数据库用户名和密码
- `@rds-host:5432` - RDS 主机地址和端口
- `/database_name` - 数据库名
- `?sslmode=require` - SSL 模式（阿里云 RDS 通常需要）

### 步骤 3：检查/创建数据库表

#### 3.1 检查现有表结构

连接到你的 RDS PostgreSQL，执行：

```sql
-- 检查 tasks 表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

-- 检查 lists 表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'lists'
ORDER BY ordinal_position;
```

#### 3.2 如果表不存在，执行迁移脚本

```bash
# 连接到 RDS（使用 psql 或其他工具）
psql "postgresql://username:password@rds-host:5432/database_name?sslmode=require"

# 执行迁移脚本
\i db/migrations/001_init.sql
```

或者直接在 RDS 控制台的 SQL 编辑器中执行 `db/migrations/001_init.sql` 的内容。

#### 3.3 如果表已存在但字段不同

根据检查结果，执行必要的 `ALTER TABLE` 语句。例如：

```sql
-- 如果缺少 priority 字段
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0;

-- 如果缺少 notes 字段
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT;

-- 如果缺少 updated_at 触发器
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tasks_set_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();
```

### 步骤 4：验证构建

```bash
npm run build
```

应该成功构建，没有 Supabase 相关错误。

### 步骤 5：本地测试

```bash
npm run dev
```

访问 `http://localhost:3000`：
1. 新增任务 "测试任务 1"
2. 刷新页面（F5）
3. **任务应该仍然存在** ✅

### 步骤 6：部署到生产环境（ECS）

#### 6.1 在服务器上安装依赖

```bash
cd /path/to/your/project
npm install --production
npm install pg @types/pg
```

#### 6.2 配置环境变量

在服务器上设置 `DATABASE_URL`（推荐使用 `.env` 文件或系统环境变量）：

```bash
# 方式1：创建 .env 文件
echo 'DATABASE_URL=postgresql://username:password@rds-host:5432/database_name?sslmode=require' > .env

# 方式2：使用系统环境变量（PM2）
export DATABASE_URL="postgresql://username:password@rds-host:5432/database_name?sslmode=require"
```

#### 6.3 重新构建和重启

```bash
npm run build
pm2 restart <your-app-name>
# 或
pm2 restart all
```

#### 6.4 检查日志

```bash
pm2 logs
```

**不应该再看到：**
- ❌ `Your project's URL and Key are required to create a Supabase client`
- ❌ 任何 Supabase 相关错误

**应该看到：**
- ✅ 应用正常启动
- ✅ 数据库连接成功（如果没有错误，说明连接正常）

---

## 🔍 验证 SQL（在 RDS 上执行）

### 1. 任务总数

```sql
SELECT COUNT(*) AS task_count FROM tasks;
```

### 2. 最近 5 条任务（按创建时间）

```sql
SELECT 
  id, 
  title, 
  completed, 
  created_at
FROM tasks
ORDER BY created_at DESC
LIMIT 5;
```

### 3. 最近 5 条更新（按更新时间）

```sql
SELECT 
  id, 
  title, 
  completed, 
  updated_at
FROM tasks
ORDER BY updated_at DESC
LIMIT 5;
```

**预期结果：**
- 新增/勾选/编辑后的任务，都能在这些查询结果中看到
- 浏览器刷新后，列表与数据库查询结果一致

---

## 🐛 常见问题

### Q1: 构建时提示 "Module not found: Can't resolve 'pg'"

**A**: 需要安装依赖：
```bash
npm install pg @types/pg
```

### Q2: 运行时提示 "DATABASE_URL is not set"

**A**: 确保环境变量已配置：
- 本地：`.env.local` 文件中有 `DATABASE_URL`
- 生产：服务器环境变量或 `.env` 文件中有 `DATABASE_URL`

### Q3: 连接数据库失败（SSL 相关错误）

**A**: 检查连接字符串和 SSL 配置：
```env
# 如果 RDS 需要 SSL
DATABASE_URL=postgresql://...?sslmode=require
DB_SSL=true

# 如果是自签名证书
DB_SSL_REJECT_UNAUTHORIZED=false
```

### Q4: 表不存在错误

**A**: 执行 `db/migrations/001_init.sql` 创建表结构。

### Q5: 字段类型不匹配

**A**: 
1. 先执行"表结构检查 SQL"查看现有字段
2. 根据差异执行 `ALTER TABLE` 语句
3. 或参考 `db/migrations/001_init.sql` 重建表

### Q6: 刷新后任务消失

**A**: 检查：
1. 数据库连接是否正常（查看服务器日志）
2. `getTasks()` 是否返回数据（在 Server Action 中添加 `console.log`）
3. 数据库表中是否有记录（执行验证 SQL）

---

## 📝 文件变更清单

### 新增文件
- `lib/db.ts` - PostgreSQL 连接池
- `db/migrations/001_init.sql` - 数据库迁移脚本
- `MIGRATION_GUIDE.md` - 本迁移指南

### 修改文件
- `app/actions/tasks.ts` - 改用 pg 替代 Supabase
- `app/actions/lists.ts` - 改用 pg 替代 Supabase
- `package.json` - 移除 Supabase 依赖，新增 pg
- `env.example` - 改为 DATABASE_URL

### 不再使用的文件（可删除）
- `lib/supabase/client.ts` - 不再被引用
- `lib/supabase/server.ts` - 不再被引用
- `SUPABASE_SETUP.md` - Supabase 配置文档（已过时）

---

## ✅ 迁移完成检查清单

- [ ] 已安装 `pg` 和 `@types/pg`
- [ ] 已配置 `DATABASE_URL` 环境变量
- [ ] 已执行数据库迁移脚本（或确认表结构兼容）
- [ ] `npm run build` 成功
- [ ] 本地测试：新增任务后刷新仍然存在
- [ ] 生产环境：已更新环境变量并重启应用
- [ ] `pm2 logs` 中没有 Supabase 相关错误
- [ ] 生产环境：新增任务后刷新仍然存在

---

## 🎯 下一步（可选）

如果需要添加用户认证：
1. 在 `tasks` 和 `lists` 表中添加 `user_id` 字段
2. 在 Server Actions 中添加用户身份验证逻辑
3. 在 SQL 查询中添加 `WHERE user_id = $1` 过滤

---

## 📚 参考

- [pg 官方文档](https://node-postgres.com/)
- [PostgreSQL 连接字符串格式](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

