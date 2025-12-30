"use server";

import { query } from "@/lib/db";

export interface List {
  id: string;
  name: string;
  color?: string | null;
  created_at: string;
}

function mapRowToList(row: any): List {
  return {
    id: String(row.id),
    name: row.name,
    color: row.color ?? null,
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


