import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";
import { DesejosClient, type WishRow } from "./DesejosClient";

export default async function AdminDesejosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/desejos");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/");

  const permissions = await getEffectivePermissions(supabase, user.id, profile.role);
  if (!permissions.view_wishlists) redirect("/admin");

  const { data } = await supabase
    .from("wishlist_items")
    .select(
      "id, name, set_name, card_number, image_url, rarity, priority, note, acquired, created_at, user_id, profiles(full_name, phone, favorite_pokemon_sprite, wishlist_public, share_slug, verified_at)"
    )
    .eq("acquired", false)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  const rows: WishRow[] = (data ?? []).map((r) => {
    const p = (Array.isArray(r.profiles) ? r.profiles[0] : r.profiles) as {
      full_name: string | null;
      phone: string | null;
      favorite_pokemon_sprite: string | null;
      wishlist_public: boolean;
      share_slug: string | null;
      verified_at: string | null;
    } | null;
    return {
      id: r.id,
      name: r.name,
      set_name: r.set_name,
      card_number: r.card_number,
      image_url: r.image_url,
      rarity: r.rarity,
      priority: r.priority,
      note: r.note,
      created_at: r.created_at,
      user_id: r.user_id,
      person_name: p?.full_name ?? "Sem nome",
      person_phone: p?.phone ?? null,
      person_avatar: p?.favorite_pokemon_sprite ?? null,
      person_public: p?.wishlist_public ?? false,
      person_slug: p?.share_slug ?? null,
      person_verified: !!p?.verified_at,
    };
  });

  return <DesejosClient rows={rows} />;
}
