"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Card } from "@/lib/supabase/types";

export type CardInput = {
  name: string;
  set_name: string;
  card_number: string;
  image_url: string;
  condition: string;
  description: string;
  status: Card["status"];
  tcg_api_id: string;
  in_stock: boolean;
  price: string; // plain "1234.56" or ""
};

export async function createCard(input: CardInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase.from("cards").insert({
    name: input.name,
    set_name: input.set_name || null,
    card_number: input.card_number || null,
    image_url: input.image_url || null,
    condition: input.condition || null,
    description: input.description || null,
    status: input.status,
    in_stock: input.in_stock,
    price: input.price ? Number(input.price) : null,
    tcg_api_id: input.tcg_api_id || null,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/cartas");
}

export async function updateCard(id: string, input: CardInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("cards")
    .update({
      name: input.name,
      set_name: input.set_name || null,
      card_number: input.card_number || null,
      image_url: input.image_url || null,
      condition: input.condition || null,
      description: input.description || null,
      status: input.status,
      in_stock: input.in_stock,
      price: input.price ? Number(input.price) : null,
      updated_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/cartas");
}

export async function deleteCard(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/cartas");
}

export async function setShopEnabled(enabled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ value: enabled, updated_at: new Date().toISOString() })
    .eq("key", "shop_enabled");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/cartas");
  revalidatePath("/loja");
  revalidatePath("/");
}
