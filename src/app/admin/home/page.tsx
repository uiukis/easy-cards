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

  const { data: settings } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["card_of_week", "nav_hidden"]);

  const cardOfWeek = settings?.find((s) => s.key === "card_of_week")?.value ?? null;
  const navHiddenRaw = settings?.find((s) => s.key === "nav_hidden")?.value;
  const navHidden = Array.isArray(navHiddenRaw) ? (navHiddenRaw as string[]) : [];

  return <HomeClient initial={cardOfWeek as CardOfWeek} navHidden={navHidden} />;
}
