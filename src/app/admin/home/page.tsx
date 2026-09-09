import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";
import { HomeClient } from "./HomeClient";
import type { CardOfWeek } from "./actions";

export default async function AdminHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/home");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/");

  const permissions = await getEffectivePermissions(supabase, user.id, profile.role);
  if (!permissions.manage_quadro) redirect("/admin");

  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "card_of_week")
    .maybeSingle();

  return <HomeClient initial={(data?.value ?? null) as CardOfWeek} />;
}
