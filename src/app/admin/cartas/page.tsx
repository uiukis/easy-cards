import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";
import type { CardFinance } from "@/lib/supabase/types";
import { CartasClient } from "./CartasClient";

export default async function CartasPage({
  searchParams,
}: {
  searchParams: Promise<{ finance?: string }>;
}) {
  const supabase = await createClient();
  const { finance: financeParam } = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/cartas");

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!viewerProfile) redirect("/");

  const permissions = await getEffectivePermissions(supabase, user.id, viewerProfile.role);
  if (!permissions.manage_cards) redirect("/admin");

  const { data: cards } = await supabase
    .from("cards")
    .select("*")
    .order("created_at", { ascending: false });

  let financeByCardId: Record<string, CardFinance> = {};
  if (permissions.view_finance) {
    const { data: finance } = await supabase.from("card_finance").select("*");
    financeByCardId = Object.fromEntries((finance ?? []).map((f) => [f.card_id, f]));
  }

  return (
    <CartasClient
      initialCards={cards ?? []}
      canViewFinance={permissions.view_finance}
      financeByCardId={financeByCardId}
      openFinanceCardId={permissions.view_finance ? financeParam ?? null : null}
    />
  );
}
