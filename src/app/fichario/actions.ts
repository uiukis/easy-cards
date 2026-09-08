"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addToBinder(input: {
  tcg_api_id: string;
  name: string;
  set_name: string;
  card_number: string;
  image_url: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { count } = await supabase
    .from("binder_cards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { error } = await supabase.from("binder_cards").insert({
    user_id: user.id,
    tcg_api_id: input.tcg_api_id || null,
    name: input.name,
    set_name: input.set_name || null,
    card_number: input.card_number || null,
    image_url: input.image_url,
    position: count ?? 0,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/fichario");
}

export async function removeFromBinder(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("binder_cards").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/fichario");
}

export async function swapBinderCards(idA: string, idB: string) {
  const supabase = await createClient();
  const { data: cards, error: fetchError } = await supabase
    .from("binder_cards")
    .select("id, position")
    .in("id", [idA, idB]);
  if (fetchError) throw new Error(fetchError.message);
  if (!cards || cards.length !== 2) return;

  const [a, b] = cards;
  const { error: errorA } = await supabase
    .from("binder_cards")
    .update({ position: b.position })
    .eq("id", a.id);
  if (errorA) throw new Error(errorA.message);

  const { error: errorB } = await supabase
    .from("binder_cards")
    .update({ position: a.position })
    .eq("id", b.id);
  if (errorB) throw new Error(errorB.message);

  revalidatePath("/fichario");
}

export async function updateGridSize(gridSize: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase
    .from("binder_settings")
    .upsert({ user_id: user.id, grid_size: gridSize, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath("/fichario");
}
