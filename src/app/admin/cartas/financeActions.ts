"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CardFinanceInput = {
  final_price: string;
  buyer_id: string | null;
  buyer_name: string;
  delivery_method: string;
  dominaria_fee: string;
  dominaria_deposited: boolean;
  dominaria_deposit_date: string;
  notes: string;
  mark_sold: boolean;
  sold_date: string;
};

export async function upsertCardFinance(cardId: string, input: CardFinanceInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase.from("card_finance").upsert(
    {
      card_id: cardId,
      final_price: input.final_price ? Number(input.final_price) : null,
      delivery_method: input.delivery_method || null,
      dominaria_fee:
        input.delivery_method === "dominaria" && input.dominaria_fee
          ? Number(input.dominaria_fee)
          : null,
      dominaria_deposited_at:
        input.delivery_method === "dominaria" && input.dominaria_deposited
          ? input.dominaria_deposit_date || new Date().toISOString().slice(0, 10)
          : null,
      buyer_id: input.buyer_id,
      buyer_name: input.buyer_name || null,
      sold_at: input.mark_sold ? new Date(input.sold_date || Date.now()).toISOString() : null,
      notes: input.notes || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "card_id" }
  );

  if (error) throw new Error(error.message);

  if (input.mark_sold) {
    await supabase.from("cards").update({ status: "sold" }).eq("id", cardId);
  }

  revalidatePath("/admin/cartas");
}
