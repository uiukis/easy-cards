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

  const [{ data: supporters }, { data: pressMentions }, { data: founders }] = await Promise.all([
    supabase.from("supporters").select("*").order("sort_order", { ascending: true }),
    supabase.from("press_mentions").select("*").order("published_date", { ascending: false }),
    supabase.from("founders").select("*").order("sort_order", { ascending: true }),
  ]);

  return (
    <QuadroClient
      initialSupporters={supporters ?? []}
      initialPressMentions={pressMentions ?? []}
      initialFounders={founders ?? []}
    />
  );
}
