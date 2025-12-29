"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Task {
  id: string;
  title: string;
  notes?: string;
  due_date?: string;
  scheduled_date?: string;
  priority: number;
  completed: boolean;
  completed_at?: string;
  list_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 获取当前用户的所有任务
 */
export async function getTasks(view?: "today" | "week" | "inbox" | string) {
  const supabase = await createClient();

  // 获取当前用户
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Auth error:", authError);
    return [];
  }

  // 构建查询
  let query = supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // 根据视图过滤
  if (view === "today") {
    const today = new Date().toISOString().split("T")[0];
    // Today: scheduled_date=今天 或 due_date=今天 或 (due_date<今天且未完成)
    query = query.or(
      `scheduled_date.eq.${today},due_date.eq.${today},and(due_date.lt.${today},completed.eq.false)`
    );
  } else if (view === "week") {
    const today = new Date();
    const weekLater = new Date(today);
    weekLater.setDate(today.getDate() + 7);
    const todayStr = today.toISOString().split("T")[0];
    const weekLaterStr = weekLater.toISOString().split("T")[0];
    // 最近7天：scheduled_date 在 [今天, 今天+7天]
    query = query
      .gte("scheduled_date", todayStr)
      .lte("scheduled_date", weekLaterStr);
  } else if (view === "inbox") {
    // Inbox：list_id 为空
    query = query.is("list_id", null);
  } else if (view && view !== "today" && view !== "week" && view !== "inbox") {
    // 自定义清单
    query = query.eq("list_id", view);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  return (data || []) as Task[];
}

/**
 * 创建新任务
 */
export async function createTask(title: string, listId?: string) {
  const supabase = await createClient();

  // 获取当前用户
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "未登录", data: null };
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title,
      list_id: listId || null,
      priority: 0,
      completed: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating task:", error);
    return { error: error.message, data: null };
  }

  // 刷新页面缓存
  revalidatePath("/");

  return { error: null, data: data as Task };
}

/**
 * 更新任务
 */
export async function updateTask(taskId: string, updates: Partial<Task>) {
  const supabase = await createClient();

  // 获取当前用户
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "未登录", data: null };
  }

  // 构建更新对象，排除不允许直接更新的字段
  const { id, created_at, ...updateFields } = updates;
  // 确保不包含 user_id（从数据库读取的任务可能包含，但不应该更新）
  delete (updateFields as any).user_id;

  const { data, error } = await supabase
    .from("tasks")
    .update(updateFields)
    .eq("id", taskId)
    .eq("user_id", user.id) // 确保只能更新自己的任务
    .select()
    .single();

  if (error) {
    console.error("Error updating task:", error);
    return { error: error.message, data: null };
  }

  // 刷新页面缓存
  revalidatePath("/");

  return { error: null, data: data as Task };
}

/**
 * 切换任务完成状态
 */
export async function toggleTask(taskId: string, completed: boolean) {
  const supabase = await createClient();

  // 获取当前用户
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "未登录", data: null };
  }

  const updateData: any = {
    completed,
  };

  if (completed) {
    updateData.completed_at = new Date().toISOString();
  } else {
    updateData.completed_at = null;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling task:", error);
    return { error: error.message, data: null };
  }

  // 刷新页面缓存
  revalidatePath("/");

  return { error: null, data: data as Task };
}

/**
 * 删除任务
 */
export async function deleteTask(taskId: string) {
  const supabase = await createClient();

  // 获取当前用户
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "未登录" };
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting task:", error);
    return { error: error.message };
  }

  // 刷新页面缓存
  revalidatePath("/");

  return { error: null };
}

