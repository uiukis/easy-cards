import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";
import type { CardFinance } from "@/lib/supabase/types";
import { CartasClient, type WishMatch } from "./CartasClient";

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

  const [{ data: cards }, { data: shopSetting }] = await Promise.all([
    supabase.from("cards").select("*").order("created_at", { ascending: false }),
    supabase.from("site_settings").select("value").eq("key", "shop_enabled").maybeSingle(),
  ]);
  const shopEnabled = shopSetting?.value === true;

  let financeByCardId: Record<string, CardFinance> = {};
  if (permissions.view_finance) {
    const { data: finance } = await supabase.from("card_finance").select("*");
    financeByCardId = Object.fromEntries((finance ?? []).map((f) => [f.card_id, f]));
  }

  // "3 pessoas querem essa carta" — match the catalogue against open wishlists.
  const wishlistMatches: Record<string, WishMatch[]> = {};
  if (permissions.view_wishlists) {
    const { data: wl } = await supabase
      .from("wishlist_items")
      .select("tcg_api_id, name, card_number, note, priority, profiles(full_name, phone)")
      .eq("acquired", false);

    const byKey = new Map<string, WishMatch[]>();
    const push = (k: string, m: WishMatch) => {
      const arr = byKey.get(k) ?? [];
      arr.push(m);
      byKey.set(k, arr);
    };
    for (const w of wl ?? []) {
      const p = (Array.isArray(w.profiles) ? w.profiles[0] : w.profiles) as
        | { full_name: string | null; phone: string | null }
        | null;
      const m: WishMatch = {
        name: p?.full_name ?? "Alguém",
        phone: p?.phone ?? null,
        note: w.note,
        priority: w.priority,
      };
      if (w.tcg_api_id) push(`id:${w.tcg_api_id}`, m);
      push(`nm:${w.name.trim().toLowerCase()}|${(w.card_number ?? "").trim()}`, m);
    }
    for (const c of cards ?? []) {
      const hits = [
        ...(c.tcg_api_id ? byKey.get(`id:${c.tcg_api_id}`) ?? [] : []),
        ...(byKey.get(`nm:${c.name.trim().toLowerCase()}|${(c.card_number ?? "").trim()}`) ?? []),
      ];
      const seen = new Set<string>();
      const uniq = hits.filter((h) => {
        const key = `${h.name}|${h.phone}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (uniq.length) wishlistMatches[c.id] = uniq;
    }
  }

  return (
    <CartasClient
      initialCards={cards ?? []}
      canViewFinance={permissions.view_finance}
      financeByCardId={financeByCardId}
      openFinanceCardId={permissions.view_finance ? financeParam ?? null : null}
      shopEnabled={shopEnabled}
      wishlistMatches={wishlistMatches}
    />
  );
}
