// BRL money-input helpers. The typing mask is a "cents accumulator": every
// digit shifts the value left, so typing 5 0 0 0 lands on R$ 50,00.

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Masks whatever the user typed into "R$ 1.234,56" (empty string stays empty). */
export function maskBRL(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return BRL.format(parseInt(digits, 10) / 100);
}

/** A stored number (reais) -> "R$ 50,00" for pre-filling the input. */
export function brlFromNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  return BRL.format(n);
}

/** Masked/typed value -> plain "1234.56" string for the DB (empty -> ""). */
export function brlToPlain(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return (parseInt(digits, 10) / 100).toFixed(2);
}
