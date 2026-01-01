"use server";

import { query } from "@/lib/db";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { format } from "date-fns";
import type { Task } from "@/lib/types";

// 重新导出以便其他地方使用
export type { Task } from "@/lib/types";

type ViewType = "today" | "week" | "inbox" | string | undefined;

/**
 * 将数据库行转换为 Task 对象
 * 统一将 null 转换为 undefined，确保类型兼容
 */
function mapRowToTask(row: any): Task {
  return {
    id: String(row.id),
    title: row.title,
    // 将 null 转换为 undefined（数据库可能返回 null，但类型定义不允许 null）
    notes: row.notes != null ? String(row.notes) : undefined,
    due_date: row.due_date != null ? String(row.due_date) : undefined,
    scheduled_date: row.scheduled_date != null ? String(row.scheduled_date) : undefined,
    priority: typeof row.priority === "number" ? row.priority : 0,
    completed: !!row.completed,
    completed_at: row.completed_at != null ? new Date(row.completed_at).toISOString() : undefined,
    list_id: row.list_id != null ? String(row.list_id) : undefined,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
  };
}

/**
 * 获取任务列表（不区分用户版本）
 */
export async function getTasks(view?: ViewType): Promise<Task[]> {
  // 强制动态渲染，不使用缓存
  noStore();
  
  const where: string[] = [];
  const params: any[] = [];

  if (view === "today") {
    // 使用本地时区获取今天的日期字符串（YYYY-MM-DD），与 createTask 保持一致
    const todayStr = format(new Date(), "yyyy-MM-dd");
    
    // Today 视图：优先使用 scheduled_date，如果没有则使用 due_date
    // 筛选条件：scheduled_date = 今天 OR due_date = 今天 OR (due_date < 今天且未完成)
    params.push(todayStr, todayStr, todayStr);
    where.push(
      "(scheduled_date = $1 OR due_date = $2 OR (due_date < $3 AND completed = false))"
    );
    
    // Debug: 输出筛选条件
    console.log("[getTasks] Today 视图筛选条件:", {
      view,
      todayStr,
      sqlCondition: "(scheduled_date = $1 OR due_date = $2 OR (due_date < $3 AND completed = false))",
      params: [todayStr, todayStr, todayStr],
    });
  } else if (view === "week") {
    // 使用本地时区获取日期，与 createTask 保持一致
    const today = new Date();
    const weekLater = new Date(today);
    weekLater.setDate(today.getDate() + 7);
    const todayStr = format(today, "yyyy-MM-dd");
    const weekLaterStr = format(weekLater, "yyyy-MM-dd");
    params.push(todayStr, weekLaterStr);
    // 最近7天：scheduled_date 在 [今天, 今天+7天]
    where.push("scheduled_date >= $1 AND scheduled_date <= $2");
  } else if (view === "inbox") {
    // Inbox：list_id 为空
    where.push("list_id IS NULL");
  } else if (view && view !== "today" && view !== "week" && view !== "inbox") {
    params.push(view);
    // 自定义清单：按 list_id 过滤
    where.push(`list_id = $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `
    SELECT
      id,
      title,
      notes,
      due_date,
      scheduled_date,
      COALESCE(priority, 0) AS priority,
      COALESCE(completed, false) AS completed,
      completed_at,
      list_id,
      created_at,
      updated_at
    FROM tasks
    ${whereSql}
    ORDER BY created_at DESC
  `;

  const { rows } = await query(sql, params);
  const tasks = rows.map(mapRowToTask);
  
  // Debug: 如果是 Today 视图，输出每条任务的日期信息
  if (view === "today") {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    console.log("[getTasks] Today 视图查询结果:", {
      totalTasks: tasks.length,
      todayStr,
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        scheduled_date: task.scheduled_date,
        due_date: task.due_date,
        completed: task.completed,
        scheduledMatches: task.scheduled_date === todayStr,
        dueMatches: task.due_date === todayStr,
        isOverdue: task.due_date && task.due_date < todayStr && !task.completed,
        shouldShow: 
          task.scheduled_date === todayStr || 
          task.due_date === todayStr || 
          (task.due_date && task.due_date < todayStr && !task.completed),
      })),
    });
  }
  
  return tasks;
}

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
    // 使用 date-fns format 获取今天的日期字符串（本地时区），格式：YYYY-MM-DD
    // 与 getTasks 中的日期格式保持一致
    scheduledDate = format(new Date(), "yyyy-MM-dd");
    
    // Debug: 输出创建任务时的日期设置
    console.log("[createTask] Today 视图创建任务，设置 scheduled_date:", {
      currentView,
      scheduledDate,
      localDate: new Date().toLocaleString("zh-CN", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
    });
  }

  const sql = `
    INSERT INTO tasks (title, list_id, priority, completed, scheduled_date)
    VALUES ($1, $2, 0, false, $3)
    RETURNING
      id,
      title,
      notes,
      due_date,
      scheduled_date,
      COALESCE(priority, 0) AS priority,
      COALESCE(completed, false) AS completed,
      completed_at,
      list_id,
      created_at,
      updated_at
  `;

  const params = [title.trim(), listId ?? null, scheduledDate];

  try {
    const { rows } = await query(sql, params);
    const task = mapRowToTask(rows[0]);
    revalidatePath("/");
    return { error: null, data: task };
  } catch (err: any) {
    console.error("Error creating task:", err);
    return { error: err.message ?? "创建任务失败", data: null };
  }
}

/**
 * 更新任务
 */
export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<{ error: string | null; data: Task | null }> {
  // 强制动态渲染，不使用缓存
  noStore();
  
  const allowedFields: (keyof Task)[] = [
    "title",
    "notes",
    "due_date",
    "scheduled_date",
    "priority",
    "list_id",
    "completed",
    "completed_at",
  ];

  const sets: string[] = [];
  const params: any[] = [];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      const value = (updates as any)[field];
      // 将 undefined 转换为 null（数据库需要 null）
      params.push(value === undefined ? null : value);
      sets.push(`${field} = $${params.length}`);
    }
  }

  if (!sets.length) {
    return { error: null, data: null };
  }

  // updated_at 始终更新
  params.push(new Date().toISOString());
  sets.push(`updated_at = $${params.length}`);

  params.push(taskId);
  const sql = `
    UPDATE tasks
    SET ${sets.join(", ")}
    WHERE id = $${params.length}
    RETURNING
      id,
      title,
      notes,
      due_date,
      scheduled_date,
      COALESCE(priority, 0) AS priority,
      COALESCE(completed, false) AS completed,
      completed_at,
      list_id,
      created_at,
      updated_at
  `;

  try {
    const { rows } = await query(sql, params);
    if (!rows.length) {
      return { error: "任务不存在", data: null };
    }
    const task = mapRowToTask(rows[0]);
    revalidatePath("/");
    return { error: null, data: task };
  } catch (err: any) {
    console.error("Error updating task:", err);
    return { error: err.message ?? "更新任务失败", data: null };
  }
}

/**
 * 切换任务完成状态
 */
export async function toggleTask(
  taskId: string,
  completed: boolean
): Promise<{ error: string | null; data: Task | null }> {
  // 强制动态渲染，不使用缓存
  noStore();
  
  const now = new Date().toISOString();
  const params = [completed, completed ? now : null, now, taskId];

  const sql = `
    UPDATE tasks
    SET
      completed = $1,
      completed_at = $2,
      updated_at = $3
    WHERE id = $4
    RETURNING
      id,
      title,
      notes,
      due_date,
      scheduled_date,
      COALESCE(priority, 0) AS priority,
      COALESCE(completed, false) AS completed,
      completed_at,
      list_id,
      created_at,
      updated_at
  `;

  try {
    const { rows } = await query(sql, params);
    if (!rows.length) {
      return { error: "任务不存在", data: null };
    }
    const task = mapRowToTask(rows[0]);
    revalidatePath("/");
    return { error: null, data: task };
  } catch (err: any) {
    console.error("Error toggling task:", err);
    return { error: err.message ?? "更新任务状态失败", data: null };
  }
}

/**
 * 删除任务
 */
export async function deleteTask(
  taskId: string
): Promise<{ error: string | null }> {
  // 强制动态渲染，不使用缓存
  noStore();
  
  const sql = `DELETE FROM tasks WHERE id = $1`;

  try {
    await query(sql, [taskId]);
    revalidatePath("/");
    return { error: null };
  } catch (err: any) {
    console.error("Error deleting task:", err);
    return { error: err.message ?? "删除任务失败" };
  }
}


