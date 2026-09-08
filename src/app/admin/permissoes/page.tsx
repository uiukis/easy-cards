import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PermissoesClient } from "./PermissoesClient";

export default async function PermissoesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/permissoes");

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!viewerProfile || viewerProfile.role !== "cto") redirect("/admin");

  const [{ data: rows }, { data: profiles }, { data: userRows }] = await Promise.all([
    supabase.from("role_permissions").select("role, permission_key, allowed").order("role"),
    supabase
      .from("profiles")
      .select("id, full_name, phone, role")
      .neq("role", "cto")
      .order("full_name"),
    supabase.from("user_permissions").select("user_id, permission_key, allowed"),
  ]);

  return (
    <PermissoesClient rows={rows ?? []} profiles={profiles ?? []} userRows={userRows ?? []} />
  );
}
