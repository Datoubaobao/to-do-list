"use server";

import { query } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import type { List } from "@/lib/types";

// 重新导出以便其他地方使用
export type { List } from "@/lib/types";

/**
 * 将数据库行转换为 List 对象
 * 统一将 null 转换为 undefined，确保类型兼容
 */
function mapRowToList(row: any): List {
  return {
    id: String(row.id),
    name: row.name,
    // 将 null 转换为 undefined（数据库可能返回 null，但类型定义不允许 null）
    color: row.color != null ? String(row.color) : undefined,
    created_at: new Date(row.created_at).toISOString(),
  };
}

/**
 * 获取所有清单（不区分用户版本）
 */
export async function getLists(): Promise<List[]> {
  // 强制动态渲染，不使用缓存
  noStore();
  
  const sql = `
    SELECT
      id,
      name,
      color,
      created_at
    FROM lists
    ORDER BY created_at ASC
  `;

  try {
    const { rows } = await query(sql);
    return rows.map(mapRowToList);
  } catch (err) {
    console.error("Error fetching lists:", err);
    return [];
  }
}


