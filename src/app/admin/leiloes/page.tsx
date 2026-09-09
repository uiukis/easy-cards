import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";
import type { Auction } from "@/lib/supabase/types";
import { LeiloesClient } from "./LeiloesClient";

export default async function LeiloesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/leiloes");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/");

  const permissions = await getEffectivePermissions(supabase, user.id, profile.role);
  if (!permissions.manage_auctions) redirect("/admin");

  const { data } = await supabase
    .from("auctions")
    .select("*")
    .order("happens_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return <LeiloesClient initial={(data ?? []) as Auction[]} />;
}
