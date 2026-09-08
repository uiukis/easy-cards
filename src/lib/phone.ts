// Formats digits as a Brazilian phone number while typing: (85) 99428-6518
export function maskPhoneBR(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// Converts a masked/raw Brazilian phone number into E.164 (+55...) for Supabase auth.
export function toE164BR(value: string): string {
  const digits = value.replace(/\D/g, "");
  return `+55${digits}`;
}
