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
