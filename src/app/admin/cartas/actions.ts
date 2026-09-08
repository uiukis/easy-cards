"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCard(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const startingPrice = formData.get("starting_price") as string;

  const { error } = await supabase.from("cards").insert({
    name: formData.get("name") as string,
    set_name: (formData.get("set_name") as string) || null,
    image_url: (formData.get("image_url") as string) || null,
    condition: (formData.get("condition") as string) || null,
    description: (formData.get("description") as string) || null,
    starting_price: startingPrice ? Number(startingPrice) : null,
    status: formData.get("status") as string,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/cartas");
}

export async function updateCard(id: string, formData: FormData) {
  const supabase = await createClient();
  const startingPrice = formData.get("starting_price") as string;

  const { error } = await supabase
    .from("cards")
    .update({
      name: formData.get("name") as string,
      set_name: (formData.get("set_name") as string) || null,
      image_url: (formData.get("image_url") as string) || null,
      condition: (formData.get("condition") as string) || null,
      description: (formData.get("description") as string) || null,
      starting_price: startingPrice ? Number(startingPrice) : null,
      status: formData.get("status") as string,
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
