/**
 * 统一的 List 类型定义
 * 注意：数据库可能返回 null，但在 actions 中会统一转换为 undefined
 */
export interface List {
  id: string;
  name: string;
  color?: string;
  created_at: string;
}

