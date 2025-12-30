# 迁移验证步骤

## 快速验证清单

### ✅ 1. 安装依赖

```bash
npm install pg @types/pg
```

### ✅ 2. 配置环境变量

创建 `.env.local`：

```env
DATABASE_URL=postgresql://username:password@rds-host:5432/database_name?sslmode=require
```

### ✅ 3. 检查/创建数据库表

**如果表不存在，执行：**
```bash
psql "your-database-url" -f db/migrations/001_init.sql
```

**如果表已存在，检查结构：**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks';
```

### ✅ 4. 构建验证

```bash
npm run build
```

应该成功，没有错误。

### ✅ 5. 本地测试

```bash
npm run dev
```

1. 访问 `http://localhost:3000`
2. 新增任务 "测试任务"
3. 刷新页面（F5）
4. **任务应该仍然存在** ✅

### ✅ 6. 生产环境部署

```bash
# 在服务器上
npm install --production
npm install pg @types/pg
npm run build
pm2 restart all
pm2 logs  # 检查没有 Supabase 错误
```

### ✅ 7. 数据库验证 SQL

在 RDS 上执行：

```sql
-- 1. 任务总数
SELECT COUNT(*) FROM tasks;

-- 2. 最近5条任务
SELECT id, title, completed, created_at 
FROM tasks 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. 最近更新的任务
SELECT id, title, completed, updated_at 
FROM tasks 
ORDER BY updated_at DESC 
LIMIT 5;
```

---

## 预期结果

✅ **修复前（Supabase）：**
- pm2 logs 报错：`Your project's URL and Key are required...`
- 新增任务后刷新消失

✅ **修复后（RDS PostgreSQL）：**
- pm2 logs 无 Supabase 错误
- 新增任务后刷新仍然存在
- 数据库查询能看到新记录

