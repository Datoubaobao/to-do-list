# 部署说明

## 🚀 快速上线指南

### 第一步：安装依赖

```bash
npm install
```

这会安装所有依赖，包括新添加的 `pg`（PostgreSQL 客户端）。

---

### 第二步：配置数据库连接

#### 本地开发

创建 `.env.local` 文件：

```env
DATABASE_URL=postgresql://username:password@rds-host:5432/database_name?sslmode=require
```

#### 生产环境

在服务器上配置环境变量（推荐使用 `.env` 文件或 PM2 环境变量）：

```bash
# 方式1：创建 .env 文件
echo 'DATABASE_URL=postgresql://...' > .env

# 方式2：PM2 环境变量
pm2 set DATABASE_URL "postgresql://..."
```

**连接字符串格式：**
```
postgresql://用户名:密码@主机:端口/数据库名?sslmode=require
```

**示例（阿里云 RDS）：**
```
postgresql://myuser:mypass@rm-xxxxx.pg.rds.aliyuncs.com:5432/todo?sslmode=require
```

---

### 第三步：创建数据库表

#### 方式 A：使用命令行

```bash
psql "your-database-url" -f db/migrations/001_init.sql
```

#### 方式 B：使用 RDS 控制台

1. 登录阿里云 RDS 控制台
2. 选择你的 PostgreSQL 实例
3. 进入"数据管理" → "SQL 编辑器"
4. 打开项目中的 `db/migrations/001_init.sql`
5. 复制内容并执行

**验证：**
```sql
SELECT COUNT(*) FROM tasks;  -- 应该返回 0
SELECT COUNT(*) FROM lists;  -- 应该返回 0
```

---

### 第四步：本地测试

```bash
# 构建项目
npm run build

# 启动开发服务器
npm run dev
```

**测试功能：**
1. 访问 http://localhost:3000
2. 新增任务 "测试任务"
3. 刷新页面（F5）
4. 任务应该仍然存在 ✅

---

### 第五步：生产环境部署

```bash
# 1. 进入项目目录
cd /path/to/your/project

# 2. 安装依赖
npm install --production
npm install pg @types/pg

# 3. 配置环境变量（如果还没配置）
echo 'DATABASE_URL=your-database-url' > .env

# 4. 构建
npm run build

# 5. 重启应用
pm2 restart all
# 或指定应用名
pm2 restart ticktick-clone

# 6. 查看日志
pm2 logs
```

**检查日志：**
- ✅ 应该看到应用正常启动
- ❌ 不应该看到 Supabase 相关错误
- ❌ 不应该看到数据库连接错误

---

## 🔍 验证部署

### 1. 功能验证

访问生产环境 URL：
- 新增任务
- 刷新页面，任务仍然存在
- 勾选完成状态
- 编辑任务详情

### 2. 数据库验证

在 RDS 上执行：

```sql
-- 查看任务总数
SELECT COUNT(*) FROM tasks;

-- 查看最近创建的任务
SELECT id, title, completed, created_at 
FROM tasks 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 🐛 故障排查

### 问题：构建失败

**错误：** `Module not found: Can't resolve 'pg'`

**解决：**
```bash
npm install pg @types/pg
```

---

### 问题：运行时错误

**错误：** `DATABASE_URL is not set`

**解决：**
1. 检查 `.env.local`（本地）或服务器环境变量
2. 确保变量名是 `DATABASE_URL`（不是 `NEXT_PUBLIC_DATABASE_URL`）
3. 重启应用

---

### 问题：数据库连接失败

**检查：**
1. 连接字符串格式是否正确
2. RDS 白名单是否包含服务器 IP
3. 用户名密码是否正确
4. SSL 配置（阿里云 RDS 需要 `sslmode=require`）

**测试连接：**
```bash
psql "your-database-url" -c "SELECT 1;"
```

---

### 问题：表不存在

**错误：** `relation "tasks" does not exist`

**解决：**
执行 `db/migrations/001_init.sql` 创建表

---

### 问题：刷新后任务消失

**排查步骤：**
1. 检查服务器日志：`pm2 logs`
2. 检查数据库连接是否正常
3. 在数据库中查询：`SELECT * FROM tasks;`
4. 如果表为空，说明写入失败，检查：
   - 数据库连接字符串
   - 表结构是否正确
   - 服务器日志中的错误信息

---

## 📋 上线检查清单

### 代码
- [ ] `npm install` 成功
- [ ] `npm run build` 成功
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 错误

### 配置
- [ ] `DATABASE_URL` 环境变量已配置
- [ ] 数据库表已创建
- [ ] 数据库连接测试通过

### 功能
- [ ] 本地测试通过
- [ ] 新增任务功能正常
- [ ] 刷新后数据持久化
- [ ] 编辑任务功能正常

### 生产环境
- [ ] 服务器环境变量已配置
- [ ] PM2 进程正常运行
- [ ] 日志无错误
- [ ] 生产环境功能测试通过

---

## 📞 需要帮助？

查看详细文档：
- `QUICK_START.md` - 5分钟快速开始
- `PRE_DEPLOY_CHECKLIST.md` - 完整检查清单
- `MIGRATION_GUIDE.md` - 详细迁移指南

