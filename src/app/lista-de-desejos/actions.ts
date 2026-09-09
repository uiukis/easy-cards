"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type NewWishlistItem = {
  tcg_api_id: string | null;
  name: string;
  set_name: string | null;
  card_number: string | null;
  image_url: string;
  rarity: string | null;
  types: string | null;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  return { supabase, user };
}

export async function addWishlistItems(items: NewWishlistItem[]) {
  if (items.length === 0) return { added: 0 };
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("tcg_api_id, name, card_number")
    .eq("user_id", user.id);

  const seen = new Set(
    (existing ?? []).map((e) => e.tcg_api_id || `${e.name}|${e.card_number ?? ""}`)
  );

  const rows = items
    .filter((c) => {
      const key = c.tcg_api_id || `${c.name}|${c.card_number ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((c) => ({
      user_id: user.id,
      tcg_api_id: c.tcg_api_id,
      name: c.name,
      set_name: c.set_name,
      card_number: c.card_number,
      image_url: c.image_url,
      rarity: c.rarity,
      types: c.types,
    }));

  if (rows.length === 0) return { added: 0 };
  const { error } = await supabase.from("wishlist_items").insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath("/lista-de-desejos");
  return { added: rows.length };
}

export async function updateWishlistItem(
  id: string,
  patch: { priority?: number; note?: string | null; acquired?: boolean }
) {
  const { supabase } = await requireUser();
  const clean: Record<string, unknown> = {};
  if (patch.priority !== undefined) clean.priority = patch.priority;
  if (patch.note !== undefined) clean.note = patch.note?.trim() || null;
  if (patch.acquired !== undefined) clean.acquired = patch.acquired;
  const { error } = await supabase.from("wishlist_items").update(clean).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/lista-de-desejos");
}

export async function removeWishlistItem(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("wishlist_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/lista-de-desejos");
}

/** Pull every card marked "Quero" across the user's binders into the wishlist. */
export async function importWantedFromBinders() {
  const { supabase, user } = await requireUser();

  const { data: wanted } = await supabase
    .from("binder_cards")
    .select("tcg_api_id, name, set_name, card_number, image_url, rarity, types")
    .eq("user_id", user.id)
    .eq("want", true)
    .eq("is_image", false);

  const items: NewWishlistItem[] = (wanted ?? []).map((c) => ({
    tcg_api_id: c.tcg_api_id,
    name: c.name,
    set_name: c.set_name,
    card_number: c.card_number,
    image_url: c.image_url,
    rarity: c.rarity,
    types: c.types,
  }));

  return addWishlistItems(items);
}

export async function addTradeItems(items: NewWishlistItem[]) {
  if (items.length === 0) return { added: 0 };
  const { supabase, user } = await requireUser();
  const { data: existing } = await supabase
    .from("trade_items")
    .select("tcg_api_id, name, card_number")
    .eq("user_id", user.id);
  const seen = new Set(
    (existing ?? []).map((e) => e.tcg_api_id || `${e.name}|${e.card_number ?? ""}`)
  );
  const rows = items
    .filter((c) => {
      const key = c.tcg_api_id || `${c.name}|${c.card_number ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((c) => ({
      user_id: user.id,
      tcg_api_id: c.tcg_api_id,
      name: c.name,
      set_name: c.set_name,
      card_number: c.card_number,
      image_url: c.image_url,
      rarity: c.rarity,
    }));
  if (rows.length === 0) return { added: 0 };
  const { error } = await supabase.from("trade_items").insert(rows);
  if (error) throw new Error(error.message);
  revalidatePath("/lista-de-desejos");
  return { added: rows.length };
}

export async function updateTradeItem(id: string, patch: { note?: string | null; condition?: string | null }) {
  const { supabase } = await requireUser();
  const clean: Record<string, unknown> = {};
  if (patch.note !== undefined) clean.note = patch.note?.trim() || null;
  if (patch.condition !== undefined) clean.condition = patch.condition || null;
  const { error } = await supabase.from("trade_items").update(clean).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/lista-de-desejos");
}

export async function removeTradeItem(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("trade_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/lista-de-desejos");
}

function makeSlug() {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

export async function setWishlistPublic(enabled: boolean) {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("share_slug")
    .eq("id", user.id)
    .single();

  const patch: Record<string, unknown> = { wishlist_public: enabled };
  const slug = profile?.share_slug ?? null;

  if (enabled && !slug) {
    // retry a few times on the (tiny) chance of a unique collision
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = makeSlug();
      const { error } = await supabase
        .from("profiles")
        .update({ ...patch, share_slug: candidate })
        .eq("id", user.id);
      if (!error) {
        revalidatePath("/lista-de-desejos");
        return { slug: candidate };
      }
      if (!`${error.message}`.toLowerCase().includes("duplicate")) break;
    }
  }

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/lista-de-desejos");
  return { slug };
}
