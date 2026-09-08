"use server";

import { createClient } from "@/lib/supabase/server";

export type BuyerResult = { id: string; full_name: string | null; phone: string | null };

export async function searchBuyers(query: string): Promise<BuyerResult[]> {
  // Strip characters that are meaningful in PostgREST's filter syntax
  // (comma separates or() conditions, parens group them) before
  // interpolating user input into the filter string.
  const safe = query.trim().replace(/[,()]/g, "");
  if (safe.length < 2) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .or(`full_name.ilike.%${safe}%,phone.ilike.%${safe}%`)
    .limit(6);
  return data ?? [];
}
