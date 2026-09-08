"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateOwnProfile(input: { full_name: string; favorite_pokemon: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      favorite_pokemon: input.favorite_pokemon || null,
    })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/perfil");
  revalidatePath("/admin");
}
