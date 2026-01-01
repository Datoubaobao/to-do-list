"use server";

import { query } from "@/lib/db";
import type { List } from "@/types/list";

// 重新导出以便其他地方使用
export type { List } from "@/types/list";

function mapRowToList(row: any): List {
  return {
    id: String(row.id),
    name: row.name,
    // 将 null 转换为 undefined
    color: row.color ?? undefined,
    created_at: new Date(row.created_at).toISOString(),
  };
}

/**
 * 获取所有清单（不区分用户版本）
 */
export async function getLists(): Promise<List[]> {
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


