import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerNav } from "@/components/CustomerNav";
import type { WishlistItem } from "@/lib/supabase/types";
import { WishlistClient } from "./WishlistClient";

export default async function ListaDeDesejosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/lista-de-desejos");

  const [{ data: items }, { data: profile }, { count: wantedInBinders }] = await Promise.all([
    supabase
      .from("wishlist_items")
      .select("*")
      .eq("user_id", user.id)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("wishlist_public, share_slug")
      .eq("id", user.id)
      .single(),
    supabase
      .from("binder_cards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("want", true)
      .eq("is_image", false),
  ]);

  return (
    <main className="bg-halftone min-h-screen bg-bg px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <CustomerNav />
        <WishlistClient
          initialItems={(items ?? []) as WishlistItem[]}
          isPublic={profile?.wishlist_public ?? false}
          shareSlug={profile?.share_slug ?? null}
          wantedInBinders={wantedInBinders ?? 0}
        />
      </div>
    </main>
  );
}
