import type { CardFinance } from "./supabase/types";

export type PaymentStatus = "aberto" | "parcial" | "pago";

export const PAY_LABEL: Record<string, string> = {
  aberto: "Aberto",
  parcial: "Parcial",
  pago: "Pago",
};

type OwedInput = {
  final_price: number | null;
  amount_paid: number | null;
  payment_status: CardFinance["payment_status"];
};

/** How much this sale still owes (final price minus what was already paid). */
export function owed(f: OwedInput) {
  if (f.payment_status === "pago") return 0;
  const price = Number(f.final_price) || 0;
  const paid = Number(f.amount_paid) || 0;
  return Math.max(0, price - paid);
}

/** A due date in the past and the sale is not fully paid. */
export function isOverdue(
  f: { due_date: string | null; payment_status: CardFinance["payment_status"] },
  now = new Date()
) {
  if (!f.due_date || f.payment_status === "pago") return false;
  const due = new Date(`${f.due_date.slice(0, 10)}T23:59:59`);
  return due.getTime() < now.getTime();
}
