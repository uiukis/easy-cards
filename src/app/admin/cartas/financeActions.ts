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
  payment_status: "aberto" | "parcial" | "pago";
  amount_paid: string;
  paid_date: string;
  due_date: string;
  auction_label: string;
  notes: string;
  mark_sold: boolean;
  sold_date: string;
  consignor_name: string;
  commission_pct: string;
  consignor_paid: boolean;
  consignor_paid_date: string;
  photo_url: string;
};

export async function upsertCardFinance(cardId: string, input: CardFinanceInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const price = input.final_price ? Number(input.final_price) : null;
  const status = input.payment_status;
  const amountPaid =
    status === "pago"
      ? (price ?? 0)
      : status === "parcial"
        ? Number(input.amount_paid || 0)
        : 0;

  const { error } = await supabase.from("card_finance").upsert(
    {
      card_id: cardId,
      final_price: price,
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
      payment_status: status,
      amount_paid: amountPaid,
      paid_at:
        status === "pago"
          ? input.paid_date || new Date().toISOString().slice(0, 10)
          : null,
      due_date: input.due_date || null,
      auction_label: input.auction_label?.trim() || null,
      notes: input.notes || null,
      consignor_name: input.consignor_name?.trim() || null,
      commission_pct: input.commission_pct ? Number(input.commission_pct) : null,
      consignor_paid_at: input.consignor_paid
        ? input.consignor_paid_date || new Date().toISOString().slice(0, 10)
        : null,
      photo_url: input.photo_url?.trim() || null,
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
