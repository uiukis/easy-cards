"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";

async function requireAuctions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me) throw new Error("Sem perfil.");
  const perms = await getEffectivePermissions(supabase, user.id, me.role);
  if (!perms.manage_auctions) throw new Error("Sem permissão.");
  return { supabase, user };
}

function refresh() {
  revalidatePath("/admin/leiloes");
  revalidatePath("/");
  revalidatePath("/leiloes");
}

export type AuctionInput = {
  title: string;
  happens_at: string; // datetime-local value or ""
  note: string;
  image_url: string;
  result: string;
};

export async function saveAuction(id: string | null, input: AuctionInput) {
  const { supabase, user } = await requireAuctions();
  const row = {
    title: input.title.trim(),
    happens_at: input.happens_at ? new Date(input.happens_at).toISOString() : null,
    note: input.note.trim() || null,
    image_url: input.image_url.trim() || null,
    result: input.result.trim() || null,
  };
  if (!row.title) throw new Error("Dá um título pro leilão.");

  if (id) {
    const { error } = await supabase.from("auctions").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("auctions").insert({ ...row, created_by: user.id });
    if (error) throw new Error(error.message);
  }
  refresh();
}

export async function deleteAuction(id: string) {
  const { supabase } = await requireAuctions();
  const { error } = await supabase.from("auctions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

/** Feature one auction on the homepage (or clear the feature entirely). */
export async function setFeaturedAuction(id: string | null) {
  const { supabase } = await requireAuctions();
  await supabase.from("auctions").update({ featured: false }).eq("featured", true);
  if (id) {
    const { error } = await supabase.from("auctions").update({ featured: true }).eq("id", id);
    if (error) throw new Error(error.message);
  }
  refresh();
}
