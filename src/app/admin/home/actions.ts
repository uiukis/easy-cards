"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";

export type CardOfWeek = {
  tcg_id: string;
  name: string;
  set_name: string;
  card_number: string;
  image_large: string;
  artist: string | null;
  note: string;
} | null;

async function requireQuadro() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me) throw new Error("Sem perfil.");
  const perms = await getEffectivePermissions(supabase, user.id, me.role);
  if (!perms.manage_quadro) throw new Error("Sem permissão.");
  return supabase;
}

export async function setCardOfWeek(value: CardOfWeek) {
  const supabase = await requireQuadro();
  const { error } = await supabase
    .from("site_settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", "card_of_week");
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin/home");
}
