"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BINDER_LIMITS } from "@/lib/features";

export type NewBinderCard = {
  tcg_api_id: string;
  name: string;
  set_name: string;
  card_number: string;
  image_url: string;
  rarity?: string | null;
  types?: string | null;
};

export async function createBinder(input: {
  name: string;
  description?: string;
  gridSize: string;
  cards?: NewBinderCard[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { count } = await supabase
    .from("binders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) >= BINDER_LIMITS.user) {
    throw new Error(
      `Durante o beta você pode ter no máximo ${BINDER_LIMITS.user} fichários. Apague um pra criar outro.`
    );
  }

  const { data: binder, error } = await supabase
    .from("binders")
    .insert({
      user_id: user.id,
      name: input.name || "Meu Fichário",
      description: input.description?.trim() || null,
      grid_size: input.gridSize,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  if (input.cards && input.cards.length > 0) {
    const rows = input.cards.map((c, i) => ({
      user_id: user.id,
      binder_id: binder.id,
      tcg_api_id: c.tcg_api_id || null,
      name: c.name,
      set_name: c.set_name || null,
      card_number: c.card_number || null,
      image_url: c.image_url,
      rarity: c.rarity || null,
      types: c.types || null,
      position: i,
    }));
    const { error: insertError } = await supabase.from("binder_cards").insert(rows);
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath("/fichario");
  return binder;
}

export async function updateBinderDescription(id: string, description: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("binders")
    .update({ description: description.trim() || null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/fichario");
  revalidatePath(`/b/${id}`);
}

export async function deleteBinder(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("binders").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/fichario");
}

export async function renameBinder(id: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("binders").update({ name }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/fichario");
}

export async function updateGridSize(binderId: string, gridSize: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("binders")
    .update({ grid_size: gridSize })
    .eq("id", binderId);
  if (error) throw new Error(error.message);
  revalidatePath("/fichario");
}

export async function setBinderShared(binderId: string, enabled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("binders")
    .update({ share_enabled: enabled })
    .eq("id", binderId);
  if (error) throw new Error(error.message);
  revalidatePath("/fichario");
  revalidatePath(`/b/${binderId}`);
}

export async function reorderBinder(binderId: string, orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, position) =>
      supabase.from("binder_cards").update({ position }).eq("id", id).eq("binder_id", binderId)
    )
  );
  revalidatePath("/fichario");
}

export async function addToBinder(
  binderId: string,
  input: {
    tcg_api_id: string;
    name: string;
    set_name: string;
    card_number: string;
    image_url: string;
    rarity?: string | null;
    types?: string | null;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { count } = await supabase
    .from("binder_cards")
    .select("*", { count: "exact", head: true })
    .eq("binder_id", binderId);

  const { data, error } = await supabase
    .from("binder_cards")
    .insert({
      user_id: user.id,
      binder_id: binderId,
      tcg_api_id: input.tcg_api_id || null,
      name: input.name,
      set_name: input.set_name || null,
      card_number: input.card_number || null,
      image_url: input.image_url,
      rarity: input.rarity || null,
      types: input.types || null,
      position: count ?? 0,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/fichario");
  return { id: data.id as string };
}

export async function addManyToBinder(
  binderId: string,
  cards: {
    tcg_api_id: string;
    name: string;
    set_name: string;
    card_number: string;
    image_url: string;
    rarity?: string | null;
    types?: string | null;
  }[],
  atIndex?: number
) {
  if (cards.length === 0) return { ids: [] as string[] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: existing } = await supabase
    .from("binder_cards")
    .select("id, position")
    .eq("binder_id", binderId)
    .order("position", { ascending: true });

  const ordered = existing ?? [];
  const insertAt = atIndex == null ? ordered.length : Math.max(0, Math.min(atIndex, ordered.length));

  // Insert the new rows at the tail first (positions are fixed up next).
  const rows = cards.map((c, i) => ({
    user_id: user.id,
    binder_id: binderId,
    tcg_api_id: c.tcg_api_id || null,
    name: c.name,
    set_name: c.set_name || null,
    card_number: c.card_number || null,
    image_url: c.image_url,
    rarity: c.rarity || null,
    types: c.types || null,
    position: ordered.length + i,
  }));
  const { data: inserted, error } = await supabase.from("binder_cards").insert(rows).select("id");
  if (error) throw new Error(error.message);

  const newIds = (inserted ?? []).map((r) => r.id as string);
  const finalOrder = [
    ...ordered.slice(0, insertAt).map((r) => r.id as string),
    ...newIds,
    ...ordered.slice(insertAt).map((r) => r.id as string),
  ];
  await Promise.all(
    finalOrder.map((id, position) =>
      supabase.from("binder_cards").update({ position }).eq("id", id).eq("binder_id", binderId)
    )
  );

  revalidatePath("/fichario");
  return { ids: newIds };
}

export async function removeFromBinder(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("binder_cards").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/fichario");
}

export async function updateCardVariant(cardId: string, variant: string | null) {
  const supabase = await createClient();
  const { error } = await supabase.from("binder_cards").update({ variant }).eq("id", cardId);
  if (error) throw new Error(error.message);
  revalidatePath("/fichario");
}

export async function updateCardSpan(cardId: string, spanCols: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("binder_cards")
    .update({ span_cols: spanCols })
    .eq("id", cardId);
  if (error) throw new Error(error.message);
  revalidatePath("/fichario");
}

export async function bulkDeleteCards(cardIds: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("binder_cards").delete().in("id", cardIds);
  if (error) throw new Error(error.message);
  revalidatePath("/fichario");
}

export async function moveCardsToBinder(cardIds: string[], targetBinderId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("binder_cards")
    .select("*", { count: "exact", head: true })
    .eq("binder_id", targetBinderId);

  let nextPosition = count ?? 0;
  for (const id of cardIds) {
    const { error } = await supabase
      .from("binder_cards")
      .update({ binder_id: targetBinderId, position: nextPosition })
      .eq("id", id);
    if (error) throw new Error(error.message);
    nextPosition += 1;
  }
  revalidatePath("/fichario");
}

export async function listOtherBinders(excludeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("binders")
    .select("id, name")
    .eq("user_id", user.id)
    .neq("id", excludeId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function reorderPages(binderId: string, pageOrder: string[][]) {
  const supabase = await createClient();
  const flatOrder = pageOrder.flat();
  await Promise.all(
    flatOrder.map((id, position) =>
      supabase.from("binder_cards").update({ position }).eq("id", id).eq("binder_id", binderId)
    )
  );
  revalidatePath("/fichario");
}
