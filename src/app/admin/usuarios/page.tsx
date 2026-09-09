import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";
import { resolvePermissions, type PermissionKey } from "@/lib/permissions";
import type { UserRole } from "@/lib/supabase/types";
import { UsuariosClient } from "./UsuariosClient";

export default async function UsuariosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/usuarios");

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!viewerProfile) redirect("/");

  const permissions = await getEffectivePermissions(supabase, user.id, viewerProfile.role);
  if (!permissions.manage_users) redirect("/admin");

  const [{ data: profiles }, { data: roleRows }, { data: userRows }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
    supabase.from("role_permissions").select("permission_key, allowed"),
    supabase.from("user_permissions").select("user_id, permission_key, allowed"),
  ]);

  // What each person actually sees, resolved the same way the app resolves it.
  const permsById: Record<string, PermissionKey[]> = {};
  for (const p of profiles ?? []) {
    const overrides = (userRows ?? []).filter((r) => r.user_id === p.id);
    const resolved = resolvePermissions(p.role as UserRole, roleRows ?? [], overrides);
    permsById[p.id] = (Object.keys(resolved) as PermissionKey[]).filter((k) => resolved[k]);
  }

  return (
    <UsuariosClient
      profiles={profiles ?? []}
      currentUserId={user.id}
      canEditRoles={viewerProfile.role === "cto"}
      permsById={permsById}
    />
  );
}
