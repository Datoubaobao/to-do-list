/**
 * 统一的 Task 类型定义
 * 注意：数据库可能返回 null，但在 actions 中会统一转换为 undefined
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

