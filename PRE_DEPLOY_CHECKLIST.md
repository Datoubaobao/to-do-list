# 上线前检查清单

## 🔍 当前状态检查

### ✅ 代码迁移状态
- [x] 已移除 Supabase 依赖
- [x] 已添加 PostgreSQL 连接层 (`lib/db.ts`)
- [x] Server Actions 已改用 SQL 直连
- [x] 数据库迁移脚本已准备 (`db/migrations/001_init.sql`)

### ⚠️ 待完成事项

#### 1. 安装依赖（必须）
```bash
npm install
```
**检查：** `npm list pg` 应该显示已安装

#### 2. 配置环境变量（必须）
创建 `.env.local`（本地）或配置服务器环境变量：
```env
DATABASE_URL=postgresql://username:password@rds-host:5432/database_name?sslmode=require
```

#### 3. 数据库表结构（必须）
- [ ] 检查表是否存在
- [ ] 如果不存在，执行迁移脚本
- [ ] 如果存在，验证字段是否匹配

#### 4. 构建验证（必须）
```bash
npm run build
```
应该成功，无错误

#### 5. 本地功能测试（必须）
```bash
npm run dev
```
- [ ] 访问 http://localhost:3000
- [ ] 新增任务
- [ ] 刷新页面，任务仍然存在
- [ ] 勾选完成状态
- [ ] 编辑任务详情

#### 6. 生产环境准备
- [ ] 服务器环境变量已配置
- [ ] 数据库连接正常
- [ ] PM2 配置正确
- [ ] 日志监控设置

---

## 🚀 上线步骤

### 步骤 1：本地验证（5分钟）

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（创建 .env.local）
echo 'DATABASE_URL=your-database-url' > .env.local

# 3. 验证构建
npm run build

# 4. 启动开发服务器
npm run dev

# 5. 测试功能
# 访问 http://localhost:3000
# - 新增任务
# - 刷新页面验证持久化
```

### 步骤 2：数据库准备（10分钟）

#### 2.1 检查表结构
连接到 RDS，执行：
```sql
-- 检查 tasks 表
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tasks';

-- 检查 lists 表
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lists';
```

#### 2.2 如果表不存在，执行迁移
```bash
# 方式1：使用 psql
psql "your-database-url" -f db/migrations/001_init.sql

# 方式2：在 RDS 控制台 SQL 编辑器中执行
# 复制 db/migrations/001_init.sql 的内容并执行
```

#### 2.3 验证表创建成功
```sql
SELECT COUNT(*) FROM tasks;  -- 应该返回 0（空表）
SELECT COUNT(*) FROM lists;  -- 应该返回 0（空表）
```

### 步骤 3：生产环境部署（15分钟）

#### 3.1 在服务器上准备
```bash
# SSH 到服务器
cd /path/to/your/project

# 拉取最新代码（如果使用 Git）
git pull

# 安装依赖
npm install --production
npm install pg @types/pg
```

#### 3.2 配置环境变量
```bash
# 方式1：创建 .env 文件
cat > .env << EOF
DATABASE_URL=postgresql://username:password@rds-host:5432/database_name?sslmode=require
EOF

# 方式2：使用 PM2 环境变量
pm2 set DATABASE_URL "postgresql://..."
```

#### 3.3 构建和重启
```bash
# 构建
npm run build

# 重启 PM2
pm2 restart all
# 或
pm2 restart <your-app-name>
```

#### 3.4 检查日志
```bash
pm2 logs
```

**应该看到：**
- ✅ 应用正常启动
- ✅ 没有 Supabase 相关错误
- ✅ 没有数据库连接错误

**不应该看到：**
- ❌ `Your project's URL and Key are required to create a Supabase client`
- ❌ `DATABASE_URL is not set`
- ❌ `Module not found: Can't resolve 'pg'`

### 步骤 4：功能验证（5分钟）

1. **访问生产环境**
   - 打开 `http://your-server-ip:3000`

2. **测试核心功能**
   - [ ] 新增任务 "上线测试任务"
   - [ ] 刷新页面，任务仍然存在 ✅
   - [ ] 勾选任务完成
   - [ ] 刷新页面，完成状态保持 ✅
   - [ ] 编辑任务标题
   - [ ] 刷新页面，修改保持 ✅

3. **数据库验证**
   ```sql
   -- 在 RDS 上执行
   SELECT id, title, completed, created_at 
   FROM tasks 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
   - 应该能看到刚才创建的任务记录

---

## 🐛 常见问题排查

### 问题 1：构建失败 - "Module not found: Can't resolve 'pg'"

**解决：**
```bash
npm install pg @types/pg
```

### 问题 2：运行时错误 - "DATABASE_URL is not set"

**解决：**
- 检查 `.env.local`（本地）或服务器环境变量
- 确保变量名正确：`DATABASE_URL`（不是 `NEXT_PUBLIC_DATABASE_URL`）

### 问题 3：数据库连接失败

**检查：**
1. 连接字符串格式是否正确
2. RDS 白名单是否包含服务器 IP
3. SSL 配置是否正确（阿里云 RDS 通常需要 `sslmode=require`）

**测试连接：**
```bash
psql "your-database-url" -c "SELECT 1;"
```

### 问题 4：表不存在错误

**解决：**
执行 `db/migrations/001_init.sql` 创建表

### 问题 5：刷新后任务消失

**排查：**
1. 检查数据库连接（查看服务器日志）
2. 检查 `getTasks()` 是否返回数据
3. 在数据库中查询是否有记录

---

## ✅ 上线检查清单

### 代码层面
- [ ] 所有依赖已安装（`npm install`）
- [ ] 构建成功（`npm run build`）
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 错误

### 配置层面
- [ ] 环境变量已配置（`DATABASE_URL`）
- [ ] 数据库表已创建
- [ ] 数据库连接正常

### 功能层面
- [ ] 本地测试通过
- [ ] 新增任务功能正常
- [ ] 刷新后数据持久化
- [ ] 编辑任务功能正常
- [ ] 完成状态切换正常

### 生产环境
- [ ] 服务器环境变量已配置
- [ ] PM2 进程正常运行
- [ ] 日志无错误
- [ ] 生产环境功能测试通过

---

## 📞 需要帮助？

如果遇到问题，检查：
1. `MIGRATION_GUIDE.md` - 详细迁移指南
2. `VERIFICATION.md` - 快速验证步骤
3. 服务器日志：`pm2 logs`
4. 数据库日志：RDS 控制台

