"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";

async function requireFinance() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Sem perfil.");

  const permissions = await getEffectivePermissions(supabase, user.id, profile.role);
  if (!permissions.view_finance) throw new Error("Sem permissão.");

  return { supabase, user };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Dashboard quick-action: mark a sale as fully paid (money landed). */
export async function markCardPaid(cardId: string, date?: string) {
  const { supabase, user } = await requireFinance();
  const { data: row } = await supabase
    .from("card_finance")
    .select("final_price")
    .eq("card_id", cardId)
    .maybeSingle();
  const { error } = await supabase
    .from("card_finance")
    .update({
      payment_status: "pago",
      amount_paid: row?.final_price ?? 0,
      paid_at: date || today(),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("card_id", cardId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/cartas");
}

/** Dashboard quick-action: mark the Dominaria deposit as done. */
export async function markDominariaDeposited(cardId: string, date?: string) {
  const { supabase, user } = await requireFinance();
  const { error } = await supabase
    .from("card_finance")
    .update({
      dominaria_deposited_at: date || today(),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("card_id", cardId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/cartas");
}
