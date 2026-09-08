"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PermissionKey } from "@/lib/permissions";
import type { UserRole } from "@/lib/supabase/types";

export async function setPermission(role: UserRole, permissionKey: PermissionKey, allowed: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("role_permissions")
    .update({ allowed })
    .eq("role", role)
    .eq("permission_key", permissionKey);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/permissoes");
}

export async function setUserPermission(userId: string, permissionKey: PermissionKey, allowed: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_permissions")
    .upsert(
      { user_id: userId, permission_key: permissionKey, allowed },
      { onConflict: "user_id,permission_key" }
    );

  if (error) throw new Error(error.message);
  revalidatePath("/admin/permissoes");
}

export async function clearUserPermission(userId: string, permissionKey: PermissionKey) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_permissions")
    .delete()
    .eq("user_id", userId)
    .eq("permission_key", permissionKey);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/permissoes");
}
