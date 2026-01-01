# Today 视图任务创建修复总结

## ✅ 修复完成

在「今天」视图创建任务时，自动设置 `scheduled_date` 为今天，确保刷新后任务仍然显示在 Today 视图中。

---

## 📋 修改的文件清单

### 修改文件（2个）

1. **`app/actions/tasks.ts`** - 修改 `createTask` 函数，支持根据当前视图自动设置日期
2. **`app/page.tsx`** - 修改 `handleTaskCreate` 函数，传递当前视图信息

---

## 🔑 关键代码改动

### 1. Server Action：`createTask` 函数（`app/actions/tasks.ts`）

#### 修改前：
```typescript
export async function createTask(title: string, listId?: string) {
  // ...
  const sql = `
    INSERT INTO tasks (title, list_id, priority, completed)
    VALUES ($1, $2, 0, false)
    RETURNING ...
  `;
  const params = [title.trim(), listId ?? null];
  // ...
}
```

#### 修改后：
```typescript
/**
 * 创建新任务
 * @param title 任务标题
 * @param listId 清单ID（可选）
 * @param currentView 当前视图（可选），如果是 "today"，则自动设置 scheduled_date 为今天
 */
export async function createTask(
  title: string,
  listId?: string,
  currentView?: string
) {
  // 强制动态渲染，不使用缓存
  noStore();
  
  if (!title.trim()) {
    return { error: "标题不能为空", data: null as Task | null };
  }

  // 如果当前视图是 "today"，自动设置 scheduled_date 为今天
  let scheduledDate: string | null = null;
  if (currentView === "today") {
    // 获取今天的日期（本地时区），格式：YYYY-MM-DD
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    scheduledDate = `${year}-${month}-${day}`;
  }

  const sql = `
    INSERT INTO tasks (title, list_id, priority, completed, scheduled_date)
    VALUES ($1, $2, 0, false, $3)
    RETURNING ...
  `;

  const params = [title.trim(), listId ?? null, scheduledDate];
  // ...
}
```

**关键改动：**
- ✅ 添加 `currentView?: string` 参数
- ✅ 如果 `currentView === "today"`，计算今天的日期（YYYY-MM-DD 格式）
- ✅ 在 INSERT 语句中包含 `scheduled_date` 字段
- ✅ 将 `scheduledDate` 添加到参数数组

**日期格式：**
- 使用 `YYYY-MM-DD` 格式（例如：`2026-01-15`）
- 符合 PostgreSQL `DATE` 类型要求
- 使用本地时区计算（`new Date()`）

### 2. 前端：`handleTaskCreate` 函数（`app/page.tsx`）

#### 修改前：
```typescript
const handleTaskCreate = async (title: string) => {
  // ...
  const optimisticTask: Task = {
    id: `temp-${Date.now()}`,
    title,
    priority: 0,
    completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  // ...
  const result = await createTask(title);
  // ...
};
```

#### 修改后：
```typescript
const handleTaskCreate = async (title: string) => {
  if (!title.trim()) return;

  // 如果当前视图是 "today"，在乐观更新中也设置 scheduled_date
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  // 乐观更新
  const optimisticTask: Task = {
    id: `temp-${Date.now()}`,
    title,
    priority: 0,
    completed: false,
    scheduled_date: currentView === "today" ? todayStr : undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  setTasks((prev) => [optimisticTask, ...prev]);

  // 同步到数据库，传递当前视图信息
  startTransition(async () => {
    const result = await createTask(title, undefined, currentView);
    // ...
  });
};
```

**关键改动：**
- ✅ 计算今天的日期字符串（用于乐观更新）
- ✅ 在乐观更新的 `optimisticTask` 中设置 `scheduled_date`（如果是 Today 视图）
- ✅ 调用 `createTask` 时传递 `currentView` 参数

---

## 📊 修复原理

### 问题分析

1. **Today 视图的筛选逻辑：**
   ```sql
   WHERE (scheduled_date = $1 OR due_date = $2 OR (due_date < $3 AND completed = false))
   ```
   - 筛选条件要求 `scheduled_date` 或 `due_date` 等于今天
   - 如果两个字段都为空（NULL），任务不会出现在 Today 视图中

2. **创建任务时的问题：**
   - 之前的 `createTask` 函数没有设置 `scheduled_date` 或 `due_date`
   - 导致新任务在 Today 视图中不显示

### 解决方案

1. **自动设置日期：**
   - 当用户在 Today 视图创建任务时，自动设置 `scheduled_date` 为今天
   - 使用本地时区计算日期，格式为 `YYYY-MM-DD`

2. **保持其他视图不变：**
   - Inbox 视图创建任务时，`scheduled_date` 仍为空（NULL）
   - 其他视图（week、自定义清单）创建任务时，也不自动设置日期
   - 用户可以在详情面板中手动设置日期

---

## ✅ 验证结果

### 构建验证

```bash
rm -rf .next && npm run build
```

**结果：**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (2/2)

Route (app)
┌ ƒ /                                    17.7 kB         120 kB

ƒ  (Dynamic)  server-rendered on demand
```

**关键变化：**
- ✅ 构建成功，无 TypeScript 错误
- ✅ 无 lint 错误
- ✅ 类型检查通过

---

## 🚀 本地验证步骤

### 1. 清理构建缓存并重新构建

```bash
rm -rf .next
npm run build
```

**预期：** 构建成功，无错误

### 2. 启动生产服务器

```bash
npm start
```

### 3. 功能验证

#### 测试 1：Today 视图创建任务

1. **访问应用**
   - 打开 `http://localhost:3000`
   - 确保当前视图是「今天」（Today）

2. **创建任务**
   - 在输入框中输入 "测试任务 - Today 视图" 并回车
   - 任务应该立即显示在列表中 ✅

3. **刷新页面（F5）**
   - 刷新浏览器
   - **任务应该仍然存在** ✅

4. **验证数据库**
   - 在数据库中查询：
     ```sql
     SELECT id, title, scheduled_date, due_date, created_at
     FROM tasks
     WHERE title LIKE '%Today 视图%'
     ORDER BY created_at DESC
     LIMIT 1;
     ```
   - 应该看到 `scheduled_date` 字段被设置为今天的日期（例如：`2026-01-15`）✅

#### 测试 2：Inbox 视图创建任务（保持原有逻辑）

1. **切换到 Inbox 视图**
   - 点击左侧边栏的「收集箱」（Inbox）

2. **创建任务**
   - 在输入框中输入 "测试任务 - Inbox 视图" 并回车
   - 任务应该立即显示在列表中 ✅

3. **验证数据库**
   - 在数据库中查询：
     ```sql
     SELECT id, title, scheduled_date, due_date, created_at
     FROM tasks
     WHERE title LIKE '%Inbox 视图%'
     ORDER BY created_at DESC
     LIMIT 1;
     ```
   - 应该看到 `scheduled_date` 字段为 `NULL`（空）✅

#### 测试 3：最近7天视图创建任务

1. **切换到「最近7天」视图**
   - 点击左侧边栏的「最近7天」（Next 7 Days）

2. **创建任务**
   - 在输入框中输入 "测试任务 - Week 视图" 并回车
   - 任务应该立即显示在列表中 ✅

3. **验证数据库**
   - `scheduled_date` 应该为 `NULL`（不自动设置）✅
   - 用户可以在详情面板中手动设置日期

---

## 📝 技术说明

### 日期格式

- **数据库字段类型：** `DATE`（PostgreSQL）
- **传入格式：** `YYYY-MM-DD`（例如：`2026-01-15`）
- **时区处理：** 使用本地时区（`new Date()`）

### 视图判断逻辑

```typescript
if (currentView === "today") {
  // 设置 scheduled_date 为今天
  scheduledDate = `${year}-${month}-${day}`;
} else {
  // 其他视图不自动设置日期
  scheduledDate = null;
}
```

### 乐观更新

- 前端在调用 Server Action 之前，先更新本地状态（乐观更新）
- 如果当前视图是 Today，乐观更新中也设置 `scheduled_date`
- 确保 UI 立即响应，无需等待服务器响应

---

## ✅ 修复完成检查清单

- [x] `createTask` 函数添加 `currentView` 参数
- [x] Today 视图创建任务时自动设置 `scheduled_date` 为今天
- [x] Inbox 视图创建任务时 `scheduled_date` 仍为空（保持原有逻辑）
- [x] 其他视图创建任务时 `scheduled_date` 仍为空（保持原有逻辑）
- [x] 前端传递 `currentView` 参数
- [x] 乐观更新中也设置 `scheduled_date`（如果是 Today 视图）
- [x] 构建成功，无 TypeScript 错误
- [x] 日期格式正确（YYYY-MM-DD）

---

## 🎉 修复完成

所有问题已修复，项目现在：
- ✅ Today 视图创建任务时自动设置 `scheduled_date` 为今天
- ✅ 刷新后任务仍然显示在 Today 视图中
- ✅ Inbox 视图创建任务时 `scheduled_date` 仍为空（保持原有逻辑）
- ✅ 构建成功，无错误
- ✅ 可以正常部署上线

**执行 `rm -rf .next && npm run build && npm start` 后，在 Today 视图创建任务→刷新→任务仍然存在！** ✅

