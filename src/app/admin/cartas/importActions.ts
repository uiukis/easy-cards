"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";

async function requireCards() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me) throw new Error("Sem perfil.");
  const perms = await getEffectivePermissions(supabase, user.id, me.role);
  if (!perms.manage_cards) throw new Error("Sem permissão.");
  return { supabase, user };
}

export type ImportRow = {
  buyer: string;
  price: number | null;
  free: boolean;
  paymentStatus: "aberto" | "parcial" | "pago";
  notes: string;
  card: {
    tcg_api_id: string;
    name: string;
    set_name: string;
    card_number: string;
    image_url: string;
  };
};

/** Parsing + TCG matching happen in the browser; this only writes the DB. */
export async function importAuctionRows(
  rows: ImportRow[],
  opts: { auctionLabel: string; soldDate: string; dueDate: string }
) {
  const { supabase, user } = await requireCards();
  if (rows.length === 0) return { added: 0 };

  const soldAt = new Date(
    `${opts.soldDate || new Date().toISOString().slice(0, 10)}T12:00:00`
  ).toISOString();
  const label = opts.auctionLabel.trim() || null;

  const { data: cards, error: cardErr } = await supabase
    .from("cards")
    .insert(
      rows.map((r) => ({
        name: r.card.name,
        set_name: r.card.set_name || null,
        card_number: r.card.card_number || null,
        image_url: r.card.image_url || null,
        condition: "NM",
        status: "sold" as const,
        in_stock: false,
        price: r.price,
        tcg_api_id: r.card.tcg_api_id || null,
        created_by: user.id,
      }))
    )
    .select("id");
  if (cardErr || !cards || cards.length !== rows.length) {
    throw new Error(cardErr?.message ?? "Falha ao criar as cartas.");
  }

  const finErr = (
    await supabase.from("card_finance").insert(
      rows.map((r, i) => {
        const price = r.free ? 0 : r.price;
        return {
          card_id: cards[i].id,
          final_price: price,
          buyer_name: r.buyer || null,
          sold_at: soldAt,
          payment_status: r.paymentStatus,
          amount_paid: r.paymentStatus === "pago" ? price ?? 0 : 0,
          paid_at: r.paymentStatus === "pago" ? opts.soldDate || null : null,
          due_date: opts.dueDate || null,
          auction_label: label,
          notes: r.notes || (r.free ? "gratuito" : null),
          updated_by: user.id,
        };
      })
    )
  ).error;
  if (finErr) throw new Error(finErr.message);

  // wishlist pings — best effort, don't fail the import over them
  for (const r of rows) {
    if (!r.card.name) continue;
    await supabase
      .rpc("notify_wishlist_match", {
        p_name: r.card.name,
        p_card_number: r.card.card_number || "",
        p_tcg_api_id: r.card.tcg_api_id || "",
        p_image_url: r.card.image_url || "",
      })
      .then(
        () => {},
        () => {}
      );
  }

  revalidatePath("/admin/cartas");
  revalidatePath("/admin/financeiro");
  return { added: rows.length };
}
