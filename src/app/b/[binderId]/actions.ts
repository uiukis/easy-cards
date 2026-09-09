"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Entra na sua conta pra curtir ou comentar.");
  return { supabase, user };
}

export async function toggleBinderLike(binderId: string) {
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("binder_likes")
    .select("binder_id")
    .eq("binder_id", binderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("binder_likes")
      .delete()
      .eq("binder_id", binderId)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
    revalidatePath(`/b/${binderId}`);
    return { liked: false };
  }

  const { error } = await supabase
    .from("binder_likes")
    .insert({ binder_id: binderId, user_id: user.id });
  if (error) throw new Error(error.message);
  await supabase.rpc("notify_binder_social", { p_binder_id: binderId, p_kind: "like" });
  revalidatePath(`/b/${binderId}`);
  return { liked: true };
}

export async function addBinderComment(binderId: string, body: string) {
  const { supabase, user } = await requireUser();
  const clean = body.trim().slice(0, 500);
  if (!clean) throw new Error("Escreve alguma coisa.");

  const { data: me } = await supabase
    .from("profiles")
    .select("full_name, favorite_pokemon_sprite")
    .eq("id", user.id)
    .single();

  const { error } = await supabase.from("binder_comments").insert({
    binder_id: binderId,
    user_id: user.id,
    body: clean,
    author_name: me?.full_name?.split(" ")[0] ?? "Colecionador",
    author_sprite: me?.favorite_pokemon_sprite ?? null,
  });
  if (error) throw new Error(error.message);
  await supabase.rpc("notify_binder_social", { p_binder_id: binderId, p_kind: "comment" });
  revalidatePath(`/b/${binderId}`);
}

export async function deleteBinderComment(id: string, binderId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("binder_comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/b/${binderId}`);
}
