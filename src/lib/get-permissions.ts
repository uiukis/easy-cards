import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePermissions, type Permissions } from "./permissions";
import type { UserRole } from "./supabase/types";

export async function getEffectivePermissions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- avoids importing the generated DB type just for this helper
  supabase: SupabaseClient<any>,
  userId: string,
  role: UserRole
): Promise<Permissions> {
  const [{ data: roleRows }, { data: userRows }] = await Promise.all([
    supabase.from("role_permissions").select("role, permission_key, allowed").eq("role", role),
    supabase.from("user_permissions").select("permission_key, allowed").eq("user_id", userId),
  ]);
  return resolvePermissions(role, roleRows ?? [], userRows ?? []);
}
