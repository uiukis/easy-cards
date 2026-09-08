"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

export async function updateUserRole(id: string, role: UserRole) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/usuarios");
}
