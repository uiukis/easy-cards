import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerNav } from "@/components/CustomerNav";
import { TradeClient, type TradeItem, type MatchRow } from "./TradeClient";

export default async function TenhoPraTrocaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/tenho-pra-troca");

  const [{ data: trades }, { data: profile }, { data: matches }] = await Promise.all([
    supabase
      .from("trade_items")
      .select("id, name, set_name, card_number, image_url, rarity, condition, note")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("wishlist_public, username, share_slug").eq("id", user.id).single(),
    supabase.rpc("trade_matches"),
  ]);

  const m = (matches ?? { theyHaveIWant: [], iHaveTheyWant: [] }) as {
    theyHaveIWant: MatchRow[];
    iHaveTheyWant: MatchRow[];
  };

  return (
    <main className="bg-halftone min-h-screen bg-bg px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <CustomerNav />
        <TradeClient
          initial={(trades ?? []) as TradeItem[]}
          matches={m}
          isPublic={profile?.wishlist_public ?? false}
          shareSlug={profile?.username ?? profile?.share_slug ?? null}
        />
      </div>
    </main>
  );
}
