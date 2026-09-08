import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";
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

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <UsuariosClient
      profiles={profiles ?? []}
      currentUserId={user.id}
      canEditRoles={viewerProfile.role === "cto"}
    />
  );
}
