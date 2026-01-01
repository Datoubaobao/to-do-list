/**
 * 统一的类型定义
 * 注意：数据库可能返回 null，但在 actions 中会统一转换为 undefined
 * 因此类型定义中使用 string | undefined（不允许 null）
 */

/**
 * 任务类型
 * 可空字段：notes, due_date, scheduled_date, completed_at, list_id
 */
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
 * 清单类型
 * 可空字段：color
 */
export interface List {
  id: string;
  name: string;
  color?: string;
  created_at: string;
}

