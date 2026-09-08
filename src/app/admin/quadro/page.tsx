import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";
import { QuadroClient } from "./QuadroClient";

export default async function QuadroPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/quadro");

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!viewerProfile) redirect("/");

  const permissions = await getEffectivePermissions(supabase, user.id, viewerProfile.role);
  if (!permissions.manage_quadro) redirect("/admin");

  const [{ data: eventSettings }, { data: announcements }, { data: supporters }] = await Promise.all([
    supabase.from("event_settings").select("*").single(),
    supabase.from("announcements").select("*").order("created_at", { ascending: false }),
    supabase.from("supporters").select("*").order("sort_order", { ascending: true }),
  ]);

  return (
    <QuadroClient
      eventSettings={eventSettings}
      initialAnnouncements={announcements ?? []}
      initialSupporters={supporters ?? []}
    />
  );
}
