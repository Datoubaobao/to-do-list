"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface List {
  id: string;
  name: string;
  color?: string;
  created_at: string;
}

/**
 * 获取当前用户的所有清单
 */
export async function getLists() {
  const supabase = await createClient();

  // 获取当前用户
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from("lists")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching lists:", error);
    return [];
  }

  return (data || []) as List[];
}

