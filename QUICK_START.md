# 快速开始 - 5分钟上线检查

## 🎯 你现在需要做的 5 件事

### 1️⃣ 安装依赖（1分钟）

```bash
npm install
```

**验证：**
```bash
npm list pg
```
应该显示 `pg@8.13.1`

---

### 2️⃣ 配置数据库连接（1分钟）

创建 `.env.local` 文件：

```bash
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://username:password@rds-host:5432/database_name?sslmode=require
EOF
```

**替换为你的实际 RDS 连接信息：**
- `username`: 数据库用户名
- `password`: 数据库密码
- `rds-host`: RDS 主机地址（如：rm-xxxxx.pg.rds.aliyuncs.com）
- `database_name`: 数据库名（如：todo）

---

### 3️⃣ 创建数据库表（2分钟）

#### 方式 A：使用 psql（推荐）

```bash
psql "your-database-url" -f db/migrations/001_init.sql
```

#### 方式 B：在 RDS 控制台

1. 登录阿里云 RDS 控制台
2. 进入你的 PostgreSQL 实例
3. 点击"SQL 洞察"或"数据管理"
4. 打开 `db/migrations/001_init.sql` 文件
5. 复制全部内容并执行

**验证表创建：**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tasks', 'lists');
```
应该返回 2 行：`tasks` 和 `lists`

---

### 4️⃣ 本地测试（1分钟）

```bash
# 构建
npm run build

# 启动
npm run dev
```

**测试步骤：**
1. 访问 http://localhost:3000
2. 输入 "测试任务 1" 并回车
3. 刷新页面（F5）
4. **任务应该仍然存在** ✅

如果任务消失，检查：
- `.env.local` 中的 `DATABASE_URL` 是否正确
- 数据库表是否已创建
- 浏览器控制台是否有错误

---

### 5️⃣ 生产环境部署（按需）

```bash
# 在服务器上
cd /path/to/project
npm install --production
npm install pg @types/pg

# 配置环境变量（创建 .env 或使用 PM2）
echo 'DATABASE_URL=your-database-url' > .env

# 构建
npm run build

# 重启
pm2 restart all

# 检查日志
pm2 logs
```

---

## ⚠️ 常见问题快速修复

### ❌ "Module not found: Can't resolve 'pg'"
```bash
npm install pg @types/pg
```

### ❌ "DATABASE_URL is not set"
检查 `.env.local` 文件是否存在且包含 `DATABASE_URL`

### ❌ "relation 'tasks' does not exist"
执行 `db/migrations/001_init.sql` 创建表

### ❌ 刷新后任务消失
1. 检查数据库连接（查看终端日志）
2. 在数据库中查询：`SELECT * FROM tasks;`
3. 如果表为空，说明写入失败，检查连接字符串

---

## ✅ 验证清单

完成以上 5 步后，确认：

- [ ] `npm run build` 成功
- [ ] `npm run dev` 启动无错误
- [ ] 浏览器访问 http://localhost:3000 正常显示
- [ ] 新增任务后刷新，任务仍然存在
- [ ] 数据库中能看到新记录

**如果以上都 ✅，恭喜！可以上线了！** 🎉

---

## 📚 详细文档

- `PRE_DEPLOY_CHECKLIST.md` - 完整上线检查清单
- `MIGRATION_GUIDE.md` - 详细迁移指南
- `VERIFICATION.md` - 验证步骤

