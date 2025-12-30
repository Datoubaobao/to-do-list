"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface Task {
  id: string;
  title: string;
  notes?: string | null;
  due_date?: string | null;
  scheduled_date?: string | null;
  priority: number;
  completed: boolean;
  completed_at?: string | null;
  list_id?: string | null;
  created_at: string;
  updated_at: string;
}

type ViewType = "today" | "week" | "inbox" | string | undefined;

function mapRowToTask(row: any): Task {
  return {
    id: String(row.id),
    title: row.title,
    notes: row.notes ?? null,
    due_date: row.due_date ? String(row.due_date) : null,
    scheduled_date: row.scheduled_date ? String(row.scheduled_date) : null,
    priority: typeof row.priority === "number" ? row.priority : 0,
    completed: !!row.completed,
    completed_at: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    list_id: row.list_id ?? null,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
  };
}

/**
 * 获取任务列表（不区分用户版本）
 */
export async function getTasks(view?: ViewType): Promise<Task[]> {
  const where: string[] = [];
  const params: any[] = [];

  if (view === "today") {
    const today = new Date().toISOString().split("T")[0];
    // Today：scheduled_date=今天 或 due_date=今天 或 (due_date<今天且未完成)
    params.push(today, today, today);
    where.push(
      "(scheduled_date = $1 OR due_date = $2 OR (due_date < $3 AND completed = false))"
    );
  } else if (view === "week") {
    const today = new Date();
    const weekLater = new Date(today);
    weekLater.setDate(today.getDate() + 7);
    const todayStr = today.toISOString().split("T")[0];
    const weekLaterStr = weekLater.toISOString().split("T")[0];
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
  return rows.map(mapRowToTask);
}

/**
 * 创建新任务
 */
export async function createTask(title: string, listId?: string) {
  if (!title.trim()) {
    return { error: "标题不能为空", data: null as Task | null };
  }

  const sql = `
    INSERT INTO tasks (title, list_id, priority, completed)
    VALUES ($1, $2, 0, false)
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

  const params = [title.trim(), listId ?? null];

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
      params.push((updates as any)[field]);
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


